import "server-only";

import { categories } from "@/data/categories";
import { getProducts } from "@/data/products";
import { getAdminProducts } from "@/lib/product-source";
import { adminMetaFor } from "@/lib/admin/catalog-store";
import { stockStore } from "@/lib/admin/stores";
import { ensureAdminDemoData } from "@/lib/admin/demo-data";
import type { AdminRole, Permission } from "@/config/admin";
import { can } from "@/config/admin";
import { userStore } from "@/lib/auth/user-store";
import { orderStore } from "@/lib/commerce/orders";
import type { Cents, Order } from "@/lib/commerce/types";

/**
 * Admin service layer.
 *
 * Architecture only — there is no admin UI yet, and deliberately so. What is
 * here is the read/aggregate surface an admin dashboard would sit on, expressed
 * as plain async functions over the same stores the storefront uses. Building
 * the UI later means rendering these; it does not mean writing new business
 * logic, and no admin logic leaks into the customer-facing code.
 *
 * Every function is a query. Mutations stay in the domain services
 * (`orders.ts`, `promotions.ts`, …) so there is exactly one place where an
 * order can change state, whoever triggered it.
 */

export interface AdminPage<T> {
  rows: T[];
  total: number;
  page: number;
  pageCount: number;
}

function paginate<T>(rows: T[], page = 1, perPage = 25): AdminPage<T> {
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return {
    rows: rows.slice((safePage - 1) * perPage, safePage * perPage),
    total: rows.length,
    page: safePage,
    pageCount,
  };
}

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export const adminProducts = {
  /** Admin view: includes drafts, archived and hidden products. */
  async all() {
    const products = await getAdminProducts();
    return products.map((product) => ({
      ...product,
      meta: adminMetaFor(product.slug),
      // Catalogue stock plus every adjustment recorded in the admin.
      effectiveStock: product.stockCount + stockStore.netFor(product.slug),
    }));
  },

  async find(slug: string) {
    const all = await adminProducts.all();
    return all.find((product) => product.slug === slug);
  },

  async list(options: { query?: string; category?: string; page?: number } = {}) {
    const products = await getAdminProducts();
    const needle = options.query?.trim().toLowerCase();

    const filtered = products.filter((product) => {
      if (options.category && product.category !== options.category) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle) ||
        product.brand.toLowerCase().includes(needle)
      );
    });

    return paginate(filtered, options.page);
  },

  /** Everything at or below the low-stock threshold, worst first. */
  async lowStock(threshold = 10) {
    const products = await adminProducts.all();
    return products
      .filter((product) => product.effectiveStock <= threshold)
      .sort((a, b) => a.effectiveStock - b.effectiveStock);
  },

  async outOfStock() {
    const products = await adminProducts.all();
    return products.filter((product) => product.effectiveStock <= 0);
  },
};

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Everything the dashboard homepage needs, in one pass over the orders.
 *
 * Assembled server-side so the page is a rendering exercise rather than a
 * calculation one, and so the same numbers can later back an API or a digest
 * email without being re-derived.
 */
export async function adminDashboard() {
  await ensureAdminDemoData();
  const orders = orderStore.all();
  const products = await adminProducts.all();
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

  const paid = orders.filter((order) => order.status !== "cancelled");

  const sum = (list: Order[]) => list.reduce((total, order) => total + order.totals.grandTotal, 0);
  const since = (from: Date) => paid.filter((order) => new Date(order.placedAt) >= from);

  const previousWindow = paid.filter((order) => {
    const at = new Date(order.placedAt);
    return at >= sixtyDaysAgo && at < thirtyDaysAgo;
  });
  const currentWindow = since(thirtyDaysAgo);

  const growth = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

  // Daily series for the last 30 days, zero-filled so the chart has no gaps.
  const days: { label: string; value: number }[] = [];
  const orderDays: { label: string; value: number }[] = [];
  const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = startOfDay(new Date(now.getTime() - offset * 86400000));
    const next = new Date(day.getTime() + 86400000);
    const inDay = paid.filter((order) => {
      const at = new Date(order.placedAt);
      return at >= day && at < next;
    });
    days.push({ label: dayFormat.format(day), value: sum(inDay) });
    orderDays.push({ label: dayFormat.format(day), value: inDay.length });
  }

  const customerIds = new Set(orders.map((order) => order.userId));
  const activeCustomerIds = new Set(currentWindow.map((order) => order.userId));
  const newCustomerIds = new Set(
    since(thirtyDaysAgo)
      .filter((order) => {
        const theirs = orders.filter((entry) => entry.userId === order.userId);
        return theirs.length > 0 && new Date(theirs[theirs.length - 1].placedAt) >= thirtyDaysAgo;
      })
      .map((order) => order.userId),
  );

  const unitsBySlug = new Map<string, { name: string; units: number; revenue: number }>();
  for (const order of paid) {
    for (const line of order.lines) {
      const entry = unitsBySlug.get(line.slug) ?? { name: line.name, units: 0, revenue: 0 };
      entry.units += line.quantity;
      entry.revenue += line.unitPrice * line.quantity;
      unitsBySlug.set(line.slug, entry);
    }
  }

  const byStatus = (status: Order["status"]) => orders.filter((order) => order.status === status).length;

  return {
    revenue: {
      total: sum(paid),
      today: sum(since(today)),
      month: sum(since(monthStart)),
      growth: growth(sum(currentWindow), sum(previousWindow)),
    },
    orders: {
      total: orders.length,
      pending: orders.filter((order) => order.payment.status === "pending").length,
      processing: byStatus("processing"),
      packed: byStatus("packed"),
      shipped: byStatus("shipped"),
      completed: byStatus("delivered"),
      cancelled: byStatus("cancelled"),
      refundRequests: orders.filter(
        (order) => order.refund?.status === "requested" || order.returnRequest?.status === "requested",
      ).length,
      growth: growth(currentWindow.length, previousWindow.length),
    },
    customers: {
      total: customerIds.size,
      active: activeCustomerIds.size,
      new: newCustomerIds.size,
      growth: growth(activeCustomerIds.size, new Set(previousWindow.map((o) => o.userId)).size),
    },
    products: {
      total: products.length,
      published: products.filter((product) => product.meta.status === "published").length,
      drafts: products.filter((product) => product.meta.status === "draft").length,
      lowStock: products.filter(
        (product) => product.effectiveStock > 0 && product.effectiveStock <= 10,
      ).length,
      outOfStock: products.filter((product) => product.effectiveStock <= 0).length,
    },
    bestSellers: [...unitsBySlug.entries()]
      .map(([slug, entry]) => ({ slug, ...entry }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6),
    trending: products
      .filter((product) => product.trending)
      .slice(0, 6)
      .map((product) => ({
        slug: product.slug,
        name: product.name,
        rating: product.rating,
        reviewCount: product.reviewCount,
      })),
    recentOrders: [...orders]
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
      .slice(0, 8),
    series: { revenue: days, orders: orderDays },
  };
}

/**
 * Items needing staff attention, filtered to what this role may act on. Feeds
 * the bell menu in the top bar.
 */
export async function adminAlerts(role: AdminRole) {
  const alerts: { id: string; title: string; body: string; href?: string; tone: string }[] = [];

  if (can(role, "orders.view")) {
    for (const order of await adminOrders.requiresAction()) {
      alerts.push({
        id: `order-${order.id}`,
        title: `${order.reference} needs attention`,
        body:
          order.returnRequest?.status === "requested"
            ? "Return requested"
            : order.payment.status === "pending"
              ? "Awaiting payment"
              : "Awaiting fulfilment",
        href: `/admin/orders/${order.id}`,
        tone: order.returnRequest?.status === "requested" ? "warning" : "info",
      });
    }
  }

  if (can(role, "inventory.view")) {
    const low = await adminProducts.lowStock(5);
    for (const product of low.slice(0, 5)) {
      alerts.push({
        id: `stock-${product.slug}`,
        title: `${product.name} is low`,
        body: `${product.effectiveStock} left in stock`,
        href: `/admin/inventory`,
        tone: product.effectiveStock <= 0 ? "danger" : "warning",
      });
    }
  }

  return alerts.slice(0, 8);
}

export type { Permission };

export const adminCategories = {
  async list() {
    const products = await getProducts();

    return categories.map((category) => {
      const inCategory = products.filter((product) => product.category === category.slug);
      const stockValue = inCategory.reduce(
        (total, product) => total + product.price * product.stockCount,
        0,
      );

      return {
        slug: category.slug,
        name: category.name,
        productCount: inCategory.length,
        outOfStock: inCategory.filter((product) => product.stockStatus === "out_of_stock").length,
        stockValue,
        hasExternalFeed: category.sourceUrl.trim() !== "",
      };
    });
  },
};

/* -------------------------------------------------------------------------- */
/*  Orders and customers                                                       */
/* -------------------------------------------------------------------------- */

export const adminOrders = {
  async list(options: { status?: Order["status"]; page?: number } = {}) {
    await ensureAdminDemoData();

    const rows = orderStore
      .all()
      .filter((order) => !options.status || order.status === options.status)
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));

    return paginate(rows, options.page);
  },

  /** Every order, newest first. */
  async all(): Promise<Order[]> {
    await ensureAdminDemoData();
    return orderStore.all().sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  },

  async forUser(userId: string): Promise<Order[]> {
    await ensureAdminDemoData();
    return orderStore.forUser(userId);
  },

  async find(id: string) {
    await ensureAdminDemoData();
    return orderStore.find(id);
  },

  /** Orders needing someone to act — the queue an ops team works from. */
  async requiresAction() {
    await ensureAdminDemoData();
    return orderStore
      .all()
      .filter(
        (order) =>
          order.status === "processing" ||
          order.payment.status === "pending" ||
          order.returnRequest?.status === "requested" ||
          order.refund?.status === "requested",
      );
  },
};

export interface AdminCustomerRow {
  id: string;
  email: string;
  name: string;
  orderCount: number;
  lifetimeValue: Cents;
  lastOrderAt: string;
  /** Placed an order within the last 30 days. */
  active: boolean;
}

/**
 * Customers are derived from orders rather than stored separately, so the
 * clock read that decides "active" lives here — a page never reads it during
 * render.
 */
function customerRows(): AdminCustomerRow[] {
  const orders = orderStore.all();
  const thirtyDaysAgo = Date.now() - 30 * 86400000;

  return [...new Set(orders.map((order) => order.userId))]
    .map((userId) => {
      const theirs = orders.filter((order) => order.userId === userId);
      const lastOrderAt = theirs
        .map((order) => order.placedAt)
        .sort((a, b) => b.localeCompare(a))[0];

      return {
        id: userId,
        email: theirs[0]?.email ?? "",
        name: theirs[0]?.shippingAddress.recipient ?? "Customer",
        orderCount: theirs.length,
        lifetimeValue: theirs.reduce((total, order) => total + order.totals.grandTotal, 0),
        lastOrderAt,
        active: new Date(lastOrderAt).getTime() >= thirtyDaysAgo,
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

export const adminCustomers = {
  /** Every customer, unpaginated — the admin table paginates client-side. */
  async rows(): Promise<AdminCustomerRow[]> {
    await ensureAdminDemoData();
    return customerRows();
  },

  async list(options: { page?: number } = {}) {
    await ensureAdminDemoData();
    return paginate(customerRows(), options.page);
  },

  async find(userId: string) {
    const user = await userStore.findById(userId);
    if (!user) return undefined;
    return { user, orders: orderStore.forUser(userId) };
  },
};

/* -------------------------------------------------------------------------- */
/*  Promotions and reviews                                                     */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
/*  Reports                                                                    */
/* -------------------------------------------------------------------------- */

export interface SalesReport {
  orderCount: number;
  grossRevenue: Cents;
  discountGiven: Cents;
  shippingCollected: Cents;
  taxCollected: Cents;
  averageOrderValue: Cents;
  byStatus: Record<string, number>;
  topProducts: { slug: string; name: string; units: number; revenue: Cents }[];
}

export const adminReports = {
  /**
   * `days` is a rolling window ending now; omit it for all time. Resolving the
   * window here keeps the clock read out of the page component.
   */
  async sales(options: { days?: number } = {}): Promise<SalesReport> {
    await ensureAdminDemoData();
    const since = options.days ? Date.now() - options.days * 86400000 : null;

    const orders = orderStore
      .all()
      .filter((order) => since === null || new Date(order.placedAt).getTime() >= since);

    const byStatus: Record<string, number> = {};
    const productTotals = new Map<string, { name: string; units: number; revenue: Cents }>();

    let grossRevenue = 0;
    let discountGiven = 0;
    let shippingCollected = 0;
    let taxCollected = 0;

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
      grossRevenue += order.totals.grandTotal;
      discountGiven += order.totals.discountTotal + order.totals.shippingDiscount;
      shippingCollected += order.totals.shippingTotal;
      taxCollected += order.totals.taxTotal;

      for (const line of order.lines) {
        const existing = productTotals.get(line.slug) ?? {
          name: line.name,
          units: 0,
          revenue: 0,
        };
        existing.units += line.quantity;
        existing.revenue += line.unitPrice * line.quantity;
        productTotals.set(line.slug, existing);
      }
    }

    return {
      orderCount: orders.length,
      grossRevenue,
      discountGiven,
      shippingCollected,
      taxCollected,
      averageOrderValue: orders.length > 0 ? Math.round(grossRevenue / orders.length) : 0,
      byStatus,
      topProducts: [...productTotals.entries()]
        .map(([slug, value]) => ({ slug, ...value }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };
  },

  async inventoryValue() {
    const products = await getProducts();
    return products.reduce((total, product) => total + product.price * product.stockCount, 0);
  },
};
