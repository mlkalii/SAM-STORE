"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { can, type Permission } from "@/config/admin";
import { getAdminUser } from "@/lib/admin/auth";
import { catalogStore, type ProductStatus } from "@/lib/admin/catalog-store";
import { adminProducts } from "@/lib/admin";
import {
  brandStore,
  categoryStore,
  contentStore,
  noteStore,
  purchaseOrderStore,
  settingsStore,
  stockStore,
  warehouseStore,
} from "@/lib/admin/stores";
import { staffStore } from "@/lib/admin/staff-store";
import { advanceOrder, cancelOrder, orderStore, requestRefund } from "@/lib/commerce/orders";
import { giftCardStore } from "@/lib/commerce/gift-cards";
import { promotionStore } from "@/lib/commerce/promotions";
import { commissionStore } from "@/lib/marketplace/commission";
import { payoutStore } from "@/lib/marketplace/payouts";
import { reviewStore } from "@/lib/marketplace/reviews";
import { sellerStore } from "@/lib/marketplace/seller-store";
import type {
  CommissionKind,
  PayoutStatus,
  SellerStatus,
  VerificationKind,
  VerificationStatus,
} from "@/lib/marketplace/types";
import type { OrderStatus, PromotionKind } from "@/lib/commerce/types";
import { assertCsrf } from "@/lib/auth/csrf";
import { auditLog } from "@/lib/security/audit-log";
import { scorePassword } from "@/lib/auth/password-strength";
import { currencyConfig } from "@/config/store";
import {
  checkbox,
  fail,
  field,
  succeed,
  validateEmail,
  validateRequired,
  type FormState,
} from "@/lib/auth/validation";

/**
 * Admin mutations.
 *
 * Every action re-checks CSRF *and* the signed-in staff member's permission
 * server-side — the UI hiding a button is a courtesy, not a control. Actions
 * only orchestrate; the actual state change lives in the domain stores, so an
 * order changes status the same way whether staff or a customer triggered it.
 */

async function guard(form: FormData, permission: Permission) {
  if (!(await assertCsrf(form))) {
    return { staff: null, error: fail("Your session expired. Refresh and try again.") };
  }
  const staff = await getAdminUser();
  if (!staff) return { staff: null, error: fail("Please sign in again.") };
  if (!can(staff.role, permission)) {
    return { staff: null, error: fail("Your role does not allow that.") };
  }
  return { staff, error: null };
}

/** One-line audit record for a staff mutation. */
function audit(
  staff: { id: string; name: string },
  action: string,
  resource: string,
  detail?: Record<string, unknown>,
) {
  auditLog.record({
    actorType: "staff",
    actorId: staff.id,
    actorLabel: staff.name,
    action,
    resource,
    detail,
  });
}

function number(form: FormData, name: string, fallback = 0) {
  const raw = Number(field(form, name).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(raw) ? raw : fallback;
}

/** Prices are entered in dollars and stored as cents. */
function money(form: FormData, name: string) {
  return Math.round(number(form, name) * 100);
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "products.edit");
  if (!staff) return error!;

  const slug = field(form, "slug");
  if (!slug) return fail("Missing product reference.");

  const nameError = validateRequired(field(form, "name"), "Product name");
  if (nameError) return fail("Please correct the highlighted fields.", { name: nameError });

  const price = money(form, "price");
  if (price <= 0) return fail("Enter a selling price above zero.", { price: "Required" });

  const compareAt = money(form, "compareAtPrice");
  const tags = field(form, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  catalogStore.patch(
    slug,
    {
      name: field(form, "name"),
      brand: field(form, "brand"),
      sku: field(form, "sku"),
      shortDescription: field(form, "shortDescription"),
      longDescription: field(form, "longDescription"),
      price,
      ...(compareAt > price ? { compareAtPrice: compareAt } : { compareAtPrice: undefined }),
      discountPercent: compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0,
      stockCount: number(form, "stockCount"),
      category: field(form, "category"),
      subcategory: field(form, "subcategory"),
      tags,
      status: (field(form, "status") || "published") as ProductStatus,
      visible: checkbox(form, "visible"),
      costPrice: money(form, "costPrice"),
      barcode: field(form, "barcode"),
      seoTitle: field(form, "seoTitle"),
      seoDescription: field(form, "seoDescription"),
      videoUrl: field(form, "videoUrl"),
      featured: checkbox(form, "featured"),
      trending: checkbox(form, "trending"),
      newArrival: checkbox(form, "newArrival"),
      bestSeller: checkbox(form, "bestSeller"),
    },
    staff.name,
  );

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath(`/shop/${slug}`);
  return succeed("Product saved.");
}

export async function setProductStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "products.edit");
  if (!staff) return error!;

  const slugs = field(form, "slugs").split(",").filter(Boolean);
  const status = (field(form, "status") || "published") as ProductStatus;

  for (const slug of slugs) {
    catalogStore.patch(slug, { status, visible: status === "published" }, staff.name);
  }

  revalidatePath("/admin/products");
  return succeed(`${slugs.length} product${slugs.length === 1 ? "" : "s"} set to ${status}.`);
}

export async function duplicateProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "products.edit");
  if (!staff) return error!;

  const slug = field(form, "slug");
  const source = await adminProducts.find(slug);
  if (!source) return fail("That product no longer exists.");

  const copy = catalogStore.duplicate(source, staff.name);
  revalidatePath("/admin/products");
  return succeed(`Duplicated as “${copy.name}” (draft).`);
}

export async function deleteProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "products.delete");
  if (!staff) return error!;

  const slugs = field(form, "slugs").split(",").filter(Boolean);
  for (const slug of slugs) catalogStore.remove(slug);

  revalidatePath("/admin/products");
  return succeed(`${slugs.length} product${slugs.length === 1 ? "" : "s"} removed from the catalogue.`);
}

/* -------------------------------------------------------------------------- */
/*  Categories and brands                                                      */
/* -------------------------------------------------------------------------- */

export async function saveCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "categories.edit");
  if (!staff) return error!;

  const name = field(form, "name");
  const nameError = validateRequired(name, "Category name");
  if (nameError) return fail("Please correct the highlighted fields.", { name: nameError });

  categoryStore.upsert({
    slug: field(form, "slug") || undefined,
    name,
    tagline: field(form, "tagline"),
    description: field(form, "description"),
    icon: field(form, "icon") || "Package",
    gradient: field(form, "gradient") || "from-slate-600 to-slate-800",
    parentSlug: field(form, "parentSlug") || undefined,
    featured: checkbox(form, "featured"),
    imageUrl: field(form, "imageUrl") || undefined,
    seoTitle: field(form, "seoTitle") || undefined,
    seoDescription: field(form, "seoDescription") || undefined,
    subcategories: field(form, "subcategories")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  });

  revalidatePath("/admin/categories");
  return succeed("Category saved.");
}

export async function deleteCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "categories.edit");
  if (!staff) return error!;

  categoryStore.remove(field(form, "slug"));
  revalidatePath("/admin/categories");
  return succeed("Category removed. Any children were promoted to top level.");
}

export async function saveBrandAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "brands.edit");
  if (!staff) return error!;

  const name = field(form, "name");
  const nameError = validateRequired(name, "Brand name");
  if (nameError) return fail("Please correct the highlighted fields.", { name: nameError });

  brandStore.upsert({
    id: field(form, "id") || undefined,
    name,
    description: field(form, "description"),
    logoUrl: field(form, "logoUrl") || undefined,
    bannerUrl: field(form, "bannerUrl") || undefined,
    featured: checkbox(form, "featured"),
  });

  revalidatePath("/admin/brands");
  return succeed("Brand saved.");
}

export async function deleteBrandAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "brands.edit");
  if (!staff) return error!;

  brandStore.remove(field(form, "id"));
  revalidatePath("/admin/brands");
  return succeed("Brand removed.");
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateOrderStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "orders.edit");
  if (!staff) return error!;

  const orderId = field(form, "orderId");
  const status = field(form, "status") as OrderStatus;

  if (status === "cancelled") {
    const cancelled = await cancelOrder(orderId, `Cancelled by ${staff.name}`);
    if (!cancelled) return fail("That order can no longer be cancelled.");
  } else {
    const updated = await advanceOrder(orderId, status);
    if (!updated) return fail("Could not update that order.");
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return succeed(`Order marked as ${status.replaceAll("-", " ")}.`);
}

export async function refundOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "orders.refund");
  if (!staff) return error!;

  const orderId = field(form, "orderId");
  const amount = money(form, "amount");
  const order = orderStore.find(orderId);
  if (!order) return fail("Could not find that order.");

  await requestRefund(orderId, amount > 0 ? Math.min(amount, order.totals.grandTotal) : undefined);

  audit(staff, "order.refund", `order:${orderId}`, {
    amount: amount > 0 ? Math.min(amount, order.totals.grandTotal) : order.totals.grandTotal,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return succeed("Refund issued and the customer notified.");
}

export async function addNoteAction(_prev: FormState, form: FormData): Promise<FormState> {
  const scope = field(form, "scope") === "customer" ? "customer" : "order";
  const { staff, error } = await guard(form, scope === "customer" ? "customers.edit" : "orders.edit");
  if (!staff) return error!;

  const body = field(form, "body");
  if (!body) return fail("Write something first.", { body: "Required" });

  noteStore.add({
    scope,
    refId: field(form, "refId"),
    body,
    internal: checkbox(form, "internal"),
    by: staff.name,
  });

  revalidatePath(`/admin/${scope === "customer" ? "customers" : "orders"}/${field(form, "refId")}`);
  return succeed("Note added.");
}

/* -------------------------------------------------------------------------- */
/*  Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export async function adjustStockAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "inventory.edit");
  if (!staff) return error!;

  const slug = field(form, "slug");
  const delta = number(form, "delta");
  if (delta === 0) return fail("Enter a non-zero adjustment.", { delta: "Required" });

  stockStore.adjust({
    slug,
    warehouseId: field(form, "warehouseId") || "wh-main",
    delta,
    reason: (field(form, "reason") || "adjustment") as "adjustment",
    note: field(form, "note") || undefined,
    by: staff.name,
  });

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/products/${slug}`);
  return succeed(`Stock adjusted by ${delta > 0 ? "+" : ""}${delta}.`);
}

export async function saveWarehouseAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "inventory.edit");
  if (!staff) return error!;

  const name = field(form, "name");
  const code = field(form, "code");
  if (!name || !code) return fail("Name and code are both required.");

  warehouseStore.upsert({
    id: field(form, "id") || undefined,
    name,
    code,
    city: field(form, "city"),
    country: field(form, "country"),
    active: checkbox(form, "active"),
  });

  revalidatePath("/admin/inventory");
  return succeed("Warehouse saved.");
}

export async function createPurchaseOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "inventory.edit");
  if (!staff) return error!;

  const supplier = field(form, "supplier");
  const slug = field(form, "slug");
  const quantity = number(form, "quantity");
  if (!supplier || !slug || quantity <= 0) {
    return fail("Supplier, product and a positive quantity are all required.");
  }

  const product = await adminProducts.find(slug);
  if (!product) return fail("That product no longer exists.");

  purchaseOrderStore.create({
    supplier,
    warehouseId: field(form, "warehouseId") || "wh-main",
    status: "ordered",
    expectedAt: field(form, "expectedAt") || undefined,
    lines: [{ slug, name: product.name, quantity, unitCost: money(form, "unitCost") }],
  });

  revalidatePath("/admin/inventory");
  return succeed("Purchase order raised.");
}

export async function setPurchaseOrderStatusAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { staff, error } = await guard(form, "inventory.edit");
  if (!staff) return error!;

  const id = field(form, "id");
  const status = field(form, "status") as "received" | "cancelled";
  const order = purchaseOrderStore.setStatus(id, status);
  if (!order) return fail("Could not find that purchase order.");

  // Receiving a PO puts its lines into stock.
  if (status === "received") {
    for (const line of order.lines) {
      stockStore.adjust({
        slug: line.slug,
        warehouseId: order.warehouseId,
        delta: line.quantity,
        reason: "purchase-order",
        note: order.reference,
        by: staff.name,
      });
    }
  }

  revalidatePath("/admin/inventory");
  return succeed(`Purchase order ${status}.`);
}

/* -------------------------------------------------------------------------- */
/*  Marketing                                                                  */
/* -------------------------------------------------------------------------- */

export async function togglePromotionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "marketing.edit");
  if (!staff) return error!;

  const id = field(form, "id");
  const promotion = promotionStore.all().find((entry) => entry.id === id);
  if (!promotion) return fail("Could not find that promotion.");

  promotion.active = !promotion.active;
  revalidatePath("/admin/marketing");
  return succeed(`${promotion.label} ${promotion.active ? "activated" : "paused"}.`);
}

export async function savePromotionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "marketing.edit");
  if (!staff) return error!;

  const label = field(form, "label");
  const kind = field(form, "kind") as PromotionKind;
  const labelError = validateRequired(label, "Name");
  if (labelError || !kind) {
    return fail("Give the promotion a name and a type.", {
      ...(labelError ? { label: labelError } : {}),
      ...(kind ? {} : { kind: "Type is required" }),
    });
  }

  const code = field(form, "code").trim().toUpperCase();
  // Percentages are entered as whole numbers; fixed amounts as dollars.
  const rawValue = number(form, "value");
  const value = kind === "fixed" ? Math.round(rawValue * 100) : rawValue;

  const id = field(form, "id") || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  // A duplicate code would make `findByCode` ambiguous at checkout.
  const clash = code ? promotionStore.findByCode(code) : undefined;
  if (clash && clash.id !== id) {
    return fail(`${code} is already used by "${clash.label}".`, { code: "Already in use" });
  }

  promotionStore.upsert({
    id,
    ...(code ? { code } : {}),
    kind,
    label,
    description: field(form, "description") || label,
    value,
    ...(number(form, "minSubtotal") > 0 ? { minSubtotal: money(form, "minSubtotal") } : {}),
    ...(field(form, "category") ? { category: field(form, "category") } : {}),
    ...(field(form, "startsAt") ? { startsAt: field(form, "startsAt") } : {}),
    ...(field(form, "endsAt") ? { endsAt: field(form, "endsAt") } : {}),
    automatic: checkbox(form, "automatic"),
    ...(number(form, "usageLimit") > 0 ? { usageLimit: number(form, "usageLimit") } : {}),
    oncePerCustomer: checkbox(form, "oncePerCustomer"),
    active: checkbox(form, "active"),
  });

  revalidatePath("/admin/marketing");
  return succeed(`${label} saved.`);
}

export async function deletePromotionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "marketing.edit");
  if (!staff) return error!;

  promotionStore.remove(field(form, "id"));
  revalidatePath("/admin/marketing");
  return succeed("Promotion removed.");
}

export async function issueGiftCardAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "marketing.edit");
  if (!staff) return error!;

  const amount = money(form, "amount");
  if (amount <= 0) return fail("Enter an amount above zero.", { amount: "Required" });

  // A blank code gets a generated one so staff never have to invent uniqueness.
  const code = field(form, "code") || `SAMRUX-${randomUUID().slice(0, 8).toUpperCase()}`;
  if (giftCardStore.find(code)) {
    return fail("That code already exists.", { code: "Already in use" });
  }

  const card = giftCardStore.issue({
    code,
    amount,
    expiresAt: field(form, "expiresAt") || undefined,
  });

  revalidatePath("/admin/marketing");
  return succeed(`Gift card ${card.code} issued.`);
}

export async function toggleGiftCardAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "marketing.edit");
  if (!staff) return error!;

  const code = field(form, "code");
  const card = giftCardStore.find(code);
  if (!card) return fail("Could not find that gift card.");

  giftCardStore.setActive(code, !card.active);
  revalidatePath("/admin/marketing");
  return succeed(`${card.code} ${card.active ? "deactivated" : "reactivated"}.`);
}

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

export async function toggleSectionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "content.edit");
  if (!staff) return error!;

  contentStore.toggleSection(field(form, "id"), checkbox(form, "enabled"));
  revalidatePath("/admin/content");
  return succeed("Homepage updated.");
}

export async function saveBannerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "content.edit");
  if (!staff) return error!;

  contentStore.saveBanner({
    id: field(form, "id") || "members-week",
    eyebrow: field(form, "eyebrow"),
    headline: field(form, "headline"),
    body: field(form, "body"),
    ctaLabel: field(form, "ctaLabel"),
    ctaHref: field(form, "ctaHref") || "/deals",
    active: checkbox(form, "active"),
  });

  revalidatePath("/admin/content");
  return succeed("Banner saved.");
}

export async function saveFaqAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "content.edit");
  if (!staff) return error!;

  const question = field(form, "question");
  const answer = field(form, "answer");
  if (!question || !answer) return fail("Both a question and an answer are required.");

  contentStore.saveFaq({ id: field(form, "id") || undefined, question, answer });
  revalidatePath("/admin/content");
  return succeed("FAQ saved.");
}

export async function deleteFaqAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "content.edit");
  if (!staff) return error!;

  contentStore.removeFaq(field(form, "id"));
  revalidatePath("/admin/content");
  return succeed("FAQ removed.");
}

/* -------------------------------------------------------------------------- */
/*  Settings and staff                                                         */
/* -------------------------------------------------------------------------- */

export async function saveSettingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "settings.edit");
  if (!staff) return error!;

  const supportEmail = field(form, "supportEmail");
  const contactEmail = field(form, "contactEmail");

  const errors: Record<string, string> = {};
  const supportError = validateEmail(supportEmail);
  if (supportError) errors.supportEmail = supportError;
  const contactError = validateEmail(contactEmail);
  if (contactError) errors.contactEmail = contactError;
  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  settingsStore.update({
    storeName: field(form, "storeName") || undefined,
    legalName: field(form, "legalName") || undefined,
    supportEmail,
    contactEmail,
    phone: field(form, "phone"),
    addressLine: field(form, "addressLine"),
    currency: field(form, "currency") || currencyConfig.code,
    currencySymbol: field(form, "currencySymbol") || "$",
    freeShippingThreshold: money(form, "freeShippingThreshold"),
    defaultTaxRate: number(form, "defaultTaxRate") / 100,
    pricesIncludeTax: checkbox(form, "pricesIncludeTax"),
    notifyOnNewOrder: checkbox(form, "notifyOnNewOrder"),
    notifyOnLowStock: checkbox(form, "notifyOnLowStock"),
    lowStockThreshold: number(form, "lowStockThreshold", 10),
    seoTitleTemplate: field(form, "seoTitleTemplate"),
    seoDescription: field(form, "seoDescription"),
    maintenanceMode: checkbox(form, "maintenanceMode"),
    backupFrequency: (field(form, "backupFrequency") || "daily") as "daily",
  });

  audit(staff, "settings.update", "settings:store");

  revalidatePath("/admin/settings");
  return succeed("Settings saved.");
}

export async function saveStaffAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "staff.edit");
  if (!staff) return error!;

  const id = field(form, "id");
  const name = field(form, "name");
  const email = field(form, "email");
  const role = field(form, "role") as Parameters<typeof staffStore.create>[0]["role"];

  const errors: Record<string, string> = {};
  const nameError = validateRequired(name, "Name");
  if (nameError) errors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (id) {
    if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);
    await staffStore.update(id, { name, email, role, active: checkbox(form, "active") });
    revalidatePath("/admin/staff");
    return succeed("Staff member updated.");
  }

  const password = field(form, "password");
  const strength = scorePassword(password);
  if (!strength.acceptable) errors.password = strength.suggestions[0] ?? "Choose a stronger password";
  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  if (await staffStore.findByEmail(email)) {
    return fail("A staff account already exists for that email.", { email: "Already in use" });
  }

  await staffStore.create({ name, email, role, password });
  revalidatePath("/admin/staff");
  return succeed("Staff member added.");
}

/* -------------------------------------------------------------------------- */
/*  Marketplace                                                                */
/* -------------------------------------------------------------------------- */

export async function setSellerStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "sellers.approve");
  if (!staff) return error!;

  const id = field(form, "id");
  const status = field(form, "status") as SellerStatus;
  if (!["approved", "suspended", "rejected", "pending"].includes(status)) {
    return fail("Unknown status.");
  }

  const seller = sellerStore.setStatus(id, status, {
    note: field(form, "note") || undefined,
    by: staff.name,
  });
  if (!seller) return fail("Could not find that seller.");

  audit(staff, `seller.${status}`, `seller:${seller.id}`, { note: field(form, "note") || undefined });

  revalidatePath("/admin/sellers");
  revalidatePath(`/admin/sellers/${id}`);
  revalidatePath("/sellers");
  return succeed(`${seller.storeName} ${status}.`);
}

export async function setSellerVerificationAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { staff, error } = await guard(form, "sellers.approve");
  if (!staff) return error!;

  const id = field(form, "id");
  const kind = field(form, "kind") as VerificationKind;
  const status = field(form, "status") as VerificationStatus;

  const seller = sellerStore.setVerification(id, kind, status, {
    note: field(form, "note") || undefined,
    by: staff.name,
  });
  if (!seller) return fail("Could not find that seller.");

  revalidatePath(`/admin/sellers/${id}`);
  return succeed(`${kind} verification ${status}.`);
}

export async function setSellerCommissionAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { staff, error } = await guard(form, "commissions.edit");
  if (!staff) return error!;

  const id = field(form, "id");
  const raw = field(form, "commissionOverride");

  // An empty field clears the override and returns the seller to the standard
  // rules, which is different from setting it to zero.
  const commissionOverride = raw === "" ? undefined : Math.max(0, Math.min(100, number(form, "commissionOverride")));

  const seller = sellerStore.update(id, { commissionOverride });
  if (!seller) return fail("Could not find that seller.");

  revalidatePath(`/admin/sellers/${id}`);
  revalidatePath("/admin/commissions");
  return succeed(
    commissionOverride === undefined
      ? "Reverted to the standard commission rules."
      : `Commission set to ${commissionOverride}%.`,
  );
}

export async function setSellerFeaturedAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "sellers.edit");
  if (!staff) return error!;

  const id = field(form, "id");
  const seller = sellerStore.find(id);
  if (!seller) return fail("Could not find that seller.");

  sellerStore.update(id, { featured: !seller.featured });
  revalidatePath("/admin/sellers");
  revalidatePath("/sellers");
  return succeed(seller.featured ? "Removed from featured." : "Added to featured.");
}

export async function saveCommissionRuleAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { staff, error } = await guard(form, "commissions.edit");
  if (!staff) return error!;

  const label = field(form, "label");
  const labelError = validateRequired(label, "Rule name");
  if (labelError) return fail("Please correct the highlighted fields.", { label: labelError });

  const kind = field(form, "kind") as CommissionKind;
  // A fixed fee is entered in whole currency and stored as minor units; a
  // percentage is stored as entered.
  const value = kind === "fixed" ? money(form, "value") : number(form, "value");

  const id = field(form, "id");
  if (id) {
    const existing = commissionStore.find(id);
    if (!existing) return fail("Could not find that rule.");

    commissionStore.upsert({
      ...existing,
      label,
      kind,
      value,
      category: field(form, "category") || undefined,
      sellerId: field(form, "sellerId") || undefined,
      priority: number(form, "priority", existing.priority),
      active: checkbox(form, "active"),
    });
  } else {
    commissionStore.create({
      label,
      kind,
      value,
      category: field(form, "category") || undefined,
      sellerId: field(form, "sellerId") || undefined,
      priority: number(form, "priority", 10),
      active: checkbox(form, "active"),
    });
  }

  revalidatePath("/admin/commissions");
  return succeed(`${label} saved.`);
}

export async function toggleCommissionRuleAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { staff, error } = await guard(form, "commissions.edit");
  if (!staff) return error!;

  const rule = commissionStore.toggle(field(form, "id"));
  if (!rule) return fail("Could not find that rule.");

  revalidatePath("/admin/commissions");
  return succeed(`${rule.label} ${rule.active ? "activated" : "paused"}.`);
}

export async function deleteCommissionRuleAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { staff, error } = await guard(form, "commissions.edit");
  if (!staff) return error!;

  if (!commissionStore.remove(field(form, "id"))) {
    return fail("That rule cannot be removed — it is the marketplace default.");
  }

  revalidatePath("/admin/commissions");
  return succeed("Rule removed.");
}

export async function setPayoutStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "payouts.edit");
  if (!staff) return error!;

  const id = field(form, "id");
  const status = field(form, "status") as PayoutStatus;

  const payout = payoutStore.setStatus(id, status, {
    by: staff.name,
    note: field(form, "note") || undefined,
    transactionRef: field(form, "transactionRef") || undefined,
  });
  if (!payout) return fail("Could not find that payout.");

  audit(staff, `payout.${status}`, `payout:${payout.id}`, {
    amount: payout.amount,
    sellerId: payout.sellerId,
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/seller/payouts");
  return succeed(`${payout.reference} ${status}.`);
}

export async function moderateReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, error } = await guard(form, "reviews.moderate");
  if (!staff) return error!;

  const id = field(form, "id");
  const status = field(form, "status") as "published" | "rejected" | "pending";

  const review = reviewStore.moderate(id, status, {
    by: staff.name,
    note: field(form, "note") || undefined,
  });
  if (!review) return fail("Could not find that review.");

  audit(staff, `review.${status}`, `review:${review.id}`);

  revalidatePath("/admin/reviews");
  if (review.target === "product") revalidatePath(`/shop/${review.targetId}`);
  return succeed(`Review ${status}.`);
}
