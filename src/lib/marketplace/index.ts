import "server-only";

import { categories } from "@/data/categories";
import { adminOrders } from "@/lib/admin";
import { ensureAdminDemoData } from "@/lib/admin/demo-data";
import { ensureMarketplaceDemoData } from "@/lib/marketplace/demo-data";
import { adminMetaFor } from "@/lib/admin/catalog-store";
import { settingsStore } from "@/lib/admin/stores";
import { orderStore } from "@/lib/commerce/orders";
import type { Cents, Order } from "@/lib/commerce/types";
import { getAdminProducts, getAllProducts } from "@/lib/product-source";
import { commissionFor } from "@/lib/marketplace/commission";
import { followStore } from "@/lib/marketplace/follows";
import { messaging } from "@/lib/marketplace/messaging";
import { balanceFor, ledger, payoutStore } from "@/lib/marketplace/payouts";
import { reviewStore } from "@/lib/marketplace/reviews";
import { sellerStore, toPublicSeller, HOUSE_SELLER_ID } from "@/lib/marketplace/seller-store";
import { linesForSeller, ordersForSeller } from "@/lib/marketplace/settlement";
import type { PublicSeller } from "@/lib/marketplace/types";
import type { Product } from "@/types";

/**
 * Read models for the seller dashboard, the vendor storefront and the admin's
 * marketplace screens.
 *
 * Every function here composes the domain stores; none of them mutate. Pages
 * call these rather than reaching into stores directly, so a page never has to
 * know that a seller's revenue is the fold of a ledger.
 */

/**
 * Orders have to exist before marketplace activity can reference them, so the
 * two seeds run in order rather than in parallel.
 */
async function ensureMarketplace() {
  await ensureAdminDemoData();
  await ensureMarketplaceDemoData();
}

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

/** A seller's products, including drafts — the seller's own view. */
export async function sellerCatalogue(sellerId: string): Promise<
  (Product & { meta: ReturnType<typeof adminMetaFor> })[]
> {
  const products = await getAdminProducts();
  return products
    .filter((product) => product.sellerId === sellerId)
    .map((product) => ({ ...product, meta: adminMetaFor(product.slug) }));
}

/** A seller's live products — what a shopper sees on the storefront. */
export async function sellerStorefrontProducts(sellerId: string): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((product) => product.sellerId === sellerId);
}

/* -------------------------------------------------------------------------- */
/*  Storefront                                                                 */
/* -------------------------------------------------------------------------- */

export interface StorefrontData {
  seller: PublicSeller;
  products: Product[];
  featured: Product[];
  collections: { slug: string; name: string; count: number; products: Product[] }[];
  reviews: ReturnType<typeof reviewStore.sellerReviews>;
  productReviewCount: number;
}

export async function storefrontFor(slug: string): Promise<StorefrontData | null> {
  await ensureMarketplace();

  const seller = sellerStore.findBySlug(slug);
  if (!seller || seller.status !== "approved") return null;

  const products = await sellerStorefrontProducts(seller.id);

  // Collections are the departments this seller actually stocks, so a store
  // never advertises an empty aisle.
  const byCategory = new Map<string, Product[]>();
  for (const product of products) {
    const list = byCategory.get(product.category) ?? [];
    list.push(product);
    byCategory.set(product.category, list);
  }

  const collections = [...byCategory.entries()]
    .map(([slugKey, items]) => ({
      slug: slugKey,
      name: categories.find((category) => category.slug === slugKey)?.name ?? slugKey,
      count: items.length,
      products: items.slice(0, 8),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    seller: toPublicSeller(seller),
    products,
    featured: products.filter((product) => product.featured).slice(0, 8),
    collections,
    reviews: reviewStore.sellerReviews(seller.id),
    productReviewCount: reviewStore.forSeller(seller.id).length,
  };
}

/** The public seller directory. */
export async function sellerDirectory(): Promise<
  (PublicSeller & { productCount: number })[]
> {
  await ensureMarketplace();

  const products = await getAllProducts();
  const counts = new Map<string, number>();
  for (const product of products) {
    const id = product.sellerId ?? HOUSE_SELLER_ID;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return sellerStore
    .approved()
    .map((seller) => ({ ...toPublicSeller(seller), productCount: counts.get(seller.id) ?? 0 }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.productCount - a.productCount;
    });
}

/* -------------------------------------------------------------------------- */
/*  Seller dashboard                                                           */
/* -------------------------------------------------------------------------- */

export interface SellerDashboardData {
  revenue: { total: Cents; month: Cents; today: Cents; commission: Cents; net: Cents };
  balance: ReturnType<typeof balanceFor>;
  orders: {
    total: number;
    awaitingAction: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returns: number;
  };
  products: { total: number; published: number; drafts: number; lowStock: number; outOfStock: number };
  customers: number;
  reviews: { total: number; pending: number; average: number };
  unreadMessages: number;
  followers: number;
  recentOrders: Order[];
  bestSellers: { slug: string; name: string; units: number; revenue: Cents }[];
  series: { revenue: { label: string; value: number }[]; orders: { label: string; value: number }[] };
}

const DAY = 86400000;

export async function sellerDashboard(sellerId: string): Promise<SellerDashboardData> {
  await ensureMarketplace();

  const [catalogue, allOrders] = await Promise.all([
    sellerCatalogue(sellerId),
    adminOrders.all(),
  ]);

  const orders = ordersForSeller(allOrders, sellerId);
  const settings = settingsStore.get();

  const now = Date.now();
  const startOfToday = new Date(new Date(now).toDateString()).getTime();
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();

  // Cancelled and refunded orders never count as revenue.
  const earning = orders.filter(
    (order) => order.status !== "cancelled" && order.status !== "refunded",
  );

  let total = 0;
  let month = 0;
  let today = 0;
  let commission = 0;

  const unitsBySlug = new Map<string, { name: string; units: number; revenue: Cents }>();
  const customers = new Set<string>();

  for (const order of earning) {
    const lines = linesForSeller(order, sellerId);
    const breakdown = commissionFor(sellerId, lines);
    const placed = new Date(order.placedAt).getTime();

    total += breakdown.gross;
    commission += breakdown.commission;
    if (placed >= monthStart) month += breakdown.gross;
    if (placed >= startOfToday) today += breakdown.gross;

    customers.add(order.userId);

    for (const line of lines) {
      const existing = unitsBySlug.get(line.slug) ?? { name: line.name, units: 0, revenue: 0 };
      existing.units += line.quantity;
      existing.revenue += line.lineSubtotal - line.lineDiscount;
      unitsBySlug.set(line.slug, existing);
    }
  }

  // Thirty daily buckets, oldest first.
  const revenueSeries: { label: string; value: number }[] = [];
  const orderSeries: { label: string; value: number }[] = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const dayStart = startOfToday - offset * DAY;
    const dayEnd = dayStart + DAY;
    const inDay = earning.filter((order) => {
      const placed = new Date(order.placedAt).getTime();
      return placed >= dayStart && placed < dayEnd;
    });

    const label = new Date(dayStart).toLocaleDateString("en-US", { day: "numeric", month: "short" });
    revenueSeries.push({
      label,
      value: inDay.reduce(
        (sum, order) => sum + commissionFor(sellerId, linesForSeller(order, sellerId)).gross,
        0,
      ),
    });
    orderSeries.push({ label, value: inDay.length });
  }

  const reviews = reviewStore.forSeller(sellerId, { includeUnpublished: true });
  const published = reviews.filter((review) => review.status === "published");

  return {
    revenue: { total, month, today, commission, net: total - commission },
    balance: balanceFor(sellerId),
    orders: {
      total: orders.length,
      awaitingAction: orders.filter((order) => order.status === "processing").length,
      shipped: orders.filter(
        (order) => order.status === "shipped" || order.status === "out-for-delivery",
      ).length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      returns: orders.filter(
        (order) =>
          order.returnRequest?.status === "requested" || order.refund?.status === "requested",
      ).length,
    },
    products: {
      total: catalogue.length,
      published: catalogue.filter((product) => product.meta.status === "published").length,
      drafts: catalogue.filter((product) => product.meta.status === "draft").length,
      lowStock: catalogue.filter(
        (product) => product.stockCount > 0 && product.stockCount <= settings.lowStockThreshold,
      ).length,
      outOfStock: catalogue.filter((product) => product.stockCount <= 0).length,
    },
    customers: customers.size,
    reviews: {
      total: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      average:
        published.length > 0
          ? Math.round(
              (published.reduce((sum, review) => sum + review.rating, 0) / published.length) * 10,
            ) / 10
          : 0,
    },
    unreadMessages: messaging.unreadFor("seller", sellerId),
    followers: sellerStore.find(sellerId)?.followerCount ?? 0,
    recentOrders: orders.slice(0, 8),
    bestSellers: [...unitsBySlug.entries()]
      .map(([slug, value]) => ({ slug, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6),
    series: { revenue: revenueSeries, orders: orderSeries },
  };
}

/* -------------------------------------------------------------------------- */
/*  Admin marketplace view                                                     */
/* -------------------------------------------------------------------------- */

export async function marketplaceOverview() {
  await ensureMarketplace();

  const products = await getAllProducts();
  const sellers = sellerStore.all();

  const counts = new Map<string, number>();
  for (const product of products) {
    const id = product.sellerId ?? HOUSE_SELLER_ID;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const orders = orderStore.all();

  const rows = sellers.map((seller) => {
    const theirs = ordersForSeller(orders, seller.id).filter(
      (order) => order.status !== "cancelled" && order.status !== "refunded",
    );

    const gross = theirs.reduce(
      (total, order) => total + commissionFor(seller.id, linesForSeller(order, seller.id)).gross,
      0,
    );
    const commission = theirs.reduce(
      (total, order) =>
        total + commissionFor(seller.id, linesForSeller(order, seller.id)).commission,
      0,
    );

    return {
      seller,
      productCount: counts.get(seller.id) ?? 0,
      orderCount: theirs.length,
      gross,
      commission,
      balance: balanceFor(seller.id),
      followers: followStore.countFor(seller.id) + seller.followerCount,
      pendingVerification: seller.verification.filter(
        (record) => record.status === "submitted" || record.status === "in-review",
      ).length,
    };
  });

  return {
    rows: rows.sort((a, b) => b.gross - a.gross),
    totals: {
      sellers: sellers.length,
      approved: sellers.filter((seller) => seller.status === "approved").length,
      pending: sellers.filter((seller) => seller.status === "pending").length,
      suspended: sellers.filter((seller) => seller.status === "suspended").length,
      gross: rows.reduce((total, row) => total + row.gross, 0),
      commission: rows.reduce((total, row) => total + row.commission, 0),
      owed: rows.reduce((total, row) => total + row.balance.available, 0),
      payoutsPending: payoutStore.pending().length,
      reviewsPending: reviewStore.pending().length,
    },
    recentLedger: ledger.all().slice(0, 12),
  };
}
