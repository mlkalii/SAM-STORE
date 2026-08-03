"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { isServiceableState } from "@/config/store";
import { catalogStore, type ProductStatus } from "@/lib/admin/catalog-store";
import { assertCsrf } from "@/lib/auth/csrf";
import {
  checkbox,
  fail,
  field,
  succeed,
  validateEmail,
  validateRequired,
  type FormState,
} from "@/lib/auth/validation";
import { getCurrentUser } from "@/lib/auth";
import { advanceOrder, orderStore } from "@/lib/commerce/orders";
import { promotionStore } from "@/lib/commerce/promotions";
import { getAdminProducts } from "@/lib/product-source";
import { getSellerContext, requireSeller } from "@/lib/marketplace/auth";
import { followStore } from "@/lib/marketplace/follows";
import { messaging } from "@/lib/marketplace/messaging";
import { payoutStore } from "@/lib/marketplace/payouts";
import { recomputeSellerRating, reviewStore } from "@/lib/marketplace/reviews";
import { sellerStore, slugify } from "@/lib/marketplace/seller-store";
import { linesForSeller } from "@/lib/marketplace/settlement";
import type { BusinessType, VerificationKind } from "@/lib/marketplace/types";
import type { Product } from "@/types";

/**
 * Seller mutations.
 *
 * Every action re-checks CSRF and re-derives the seller from the session — a
 * form can post any `sellerId` it likes and it will be ignored. Ownership is
 * checked against the resource too: a seller can only touch their own products,
 * their own orders and their own money.
 */

async function guard() {
  const { user, seller } = await getSellerContext();
  if (!user) return { error: fail("Please sign in again.") } as const;
  if (!seller) return { error: fail("You do not have a seller account yet.") } as const;
  if (seller.status !== "approved") {
    return { error: fail("Your store is not approved for trading yet.") } as const;
  }
  return { user, seller, error: null } as const;
}

async function guarded(form: FormData) {
  if (!(await assertCsrf(form))) {
    return { error: fail("Your session expired. Refresh and try again.") } as const;
  }
  return guard();
}

function number(form: FormData, name: string, fallback = 0) {
  const raw = Number(field(form, name).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(raw) ? raw : fallback;
}

/** Prices are entered as decimals and stored as minor units. */
function money(form: FormData, name: string) {
  return Math.round(number(form, name) * 100);
}

function lines(form: FormData, name: string) {
  return field(form, name)
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/*  Registration                                                               */
/* -------------------------------------------------------------------------- */

export async function registerSellerAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to your SAMRUX account before applying to sell.");

  if (sellerStore.findByOwner(user.id)) {
    return fail("This account already has a seller application.");
  }

  const storeName = field(form, "storeName");
  const legalName = field(form, "legalName");
  const taxId = field(form, "taxId");
  const contactEmail = field(form, "contactEmail");
  const contactPhone = field(form, "contactPhone");
  const state = field(form, "state").toUpperCase();

  const errors: Record<string, string> = {};
  const storeNameError = validateRequired(storeName, "Store name");
  if (storeNameError) errors.storeName = storeNameError;
  const legalNameError = validateRequired(legalName, "Legal business name");
  if (legalNameError) errors.legalName = legalNameError;
  const taxIdError = validateRequired(taxId, "Tax ID");
  if (taxIdError) errors.taxId = taxIdError;
  const emailError = validateEmail(contactEmail);
  if (emailError) errors.contactEmail = emailError;
  if (!contactPhone) errors.contactPhone = "Contact phone is required";
  if (!field(form, "addressLine1")) errors.addressLine1 = "Street address is required";
  if (!field(form, "city")) errors.city = "City is required";
  if (!field(form, "postcode")) errors.postcode = "ZIP code is required";

  // SAMRUX ships within the United States, so a seller must be able to as well.
  if (!isServiceableState(state)) {
    errors.state = "Choose one of the fifty US states";
  }
  if (!checkbox(form, "terms")) {
    errors.terms = "You must accept the seller agreement";
  }

  if (Object.keys(errors).length > 0) {
    return fail("Please correct the highlighted fields.", errors);
  }

  // Two stores cannot share a name — the storefront URL comes from it.
  const wantedSlug = slugify(storeName);
  if (sellerStore.findBySlug(wantedSlug)) {
    return fail("A store with that name already exists.", { storeName: "Already taken" });
  }

  const seller = sellerStore.create({
    ownerUserId: user.id,
    storeName,
    storeDescription: field(form, "storeDescription"),
    logoUrl: field(form, "logoUrl") || undefined,
    bannerUrl: field(form, "bannerUrl") || undefined,
    business: {
      legalName,
      type: (field(form, "businessType") || "llc") as BusinessType,
      taxId,
      registrationNumber: field(form, "registrationNumber") || undefined,
      addressLine1: field(form, "addressLine1"),
      addressLine2: field(form, "addressLine2") || undefined,
      city: field(form, "city"),
      state,
      postcode: field(form, "postcode"),
      country: "US",
    },
    contact: {
      name: field(form, "contactName") || user.name,
      email: contactEmail,
      phone: contactPhone,
    },
  });

  revalidatePath("/seller");
  revalidatePath("/admin/sellers");
  return succeed(`${seller.storeName} submitted for review.`, { sellerId: seller.id });
}

/* -------------------------------------------------------------------------- */
/*  Store settings and verification                                            */
/* -------------------------------------------------------------------------- */

export async function saveStoreSettingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const storeName = field(form, "storeName");
  const nameError = validateRequired(storeName, "Store name");
  if (nameError) return fail("Please correct the highlighted fields.", { storeName: nameError });

  const contactEmail = field(form, "contactEmail");
  const emailError = validateEmail(contactEmail);
  if (emailError) return fail("Please correct the highlighted fields.", { contactEmail: emailError });

  sellerStore.update(seller.id, {
    storeName,
    storeDescription: field(form, "storeDescription"),
    logoUrl: field(form, "logoUrl") || undefined,
    bannerUrl: field(form, "bannerUrl") || undefined,
    dispatchHours: Math.max(1, number(form, "dispatchHours", 24)),
    returnWindowDays: Math.max(0, number(form, "returnWindowDays", 30)),
    contact: {
      name: field(form, "contactName") || seller.contact.name,
      email: contactEmail,
      phone: field(form, "contactPhone") || seller.contact.phone,
    },
  });

  revalidatePath("/seller/settings");
  revalidatePath(`/sellers/${seller.slug}`);
  return succeed("Store settings saved.");
}

export async function savePayoutDetailsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const accountName = field(form, "accountName");
  if (!accountName) return fail("Account name is required.", { accountName: "Required" });

  // Only the last four digits are ever kept — the full number belongs in a
  // payment provider's vault, never in the application database.
  const raw = field(form, "accountNumber").replace(/\D/g, "");
  const walletAddress = field(form, "walletAddress");

  if (!raw && !walletAddress) {
    return fail("Enter a bank account or a USDT wallet address.", {
      accountNumber: "One payout destination is required",
    });
  }

  sellerStore.update(seller.id, {
    banking: {
      accountName,
      accountLast4: raw.slice(-4) || seller.banking?.accountLast4 || "0000",
      routingLast4: field(form, "routingNumber").replace(/\D/g, "").slice(-4) || undefined,
      walletAddress: walletAddress || undefined,
      currency: "USDT",
    },
  });

  // Supplying details restarts banking verification.
  sellerStore.setVerification(seller.id, "banking", "submitted");

  revalidatePath("/seller/payouts");
  revalidatePath("/seller/verification");
  return succeed("Payout details saved and submitted for verification.");
}

export async function submitVerificationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const kind = field(form, "kind") as VerificationKind;
  if (!["identity", "business", "tax", "banking"].includes(kind)) {
    return fail("Unknown verification type.");
  }

  const reference = field(form, "documentRef") || `doc-${randomUUID().slice(0, 10)}`;
  sellerStore.setVerification(seller.id, kind, "submitted", {
    documentRef: reference,
    note: field(form, "note") || undefined,
  });

  revalidatePath("/seller/verification");
  revalidatePath(`/admin/sellers/${seller.id}`);
  return succeed("Submitted. A reviewer will look at it shortly.");
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                   */
/* -------------------------------------------------------------------------- */

/** A seller may only ever touch a product they own. */
async function ownedProduct(sellerId: string, slug: string) {
  const products = await getAdminProducts();
  const product = products.find((entry) => entry.slug === slug);
  if (!product || product.sellerId !== sellerId) return undefined;
  return product;
}

export async function saveSellerProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const slug = field(form, "slug");
  const name = field(form, "name");
  const nameError = validateRequired(name, "Product name");
  if (nameError) return fail("Please correct the highlighted fields.", { name: nameError });

  const price = money(form, "price");
  if (price <= 0) return fail("Enter a price above zero.", { price: "Required" });

  const patch = {
    name,
    brand: field(form, "brand") || seller.storeName,
    shortDescription: field(form, "shortDescription"),
    longDescription: field(form, "longDescription"),
    features: lines(form, "features"),
    price,
    compareAtPrice: money(form, "compareAtPrice") || undefined,
    stockCount: Math.max(0, number(form, "stockCount")),
    category: field(form, "category"),
    subcategory: field(form, "subcategory"),
    tags: field(form, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    sku: field(form, "sku"),
    status: (field(form, "status") || "draft") as ProductStatus,
    costPrice: money(form, "costPrice") || undefined,
    barcode: field(form, "barcode") || undefined,
    seoTitle: field(form, "seoTitle") || undefined,
    seoDescription: field(form, "seoDescription") || undefined,
    videoUrl: field(form, "videoUrl") || undefined,
    visible: checkbox(form, "visible"),
  };

  if (slug) {
    const existing = await ownedProduct(seller.id, slug);
    if (!existing) return fail("That product is not in your catalogue.");

    catalogStore.patch(slug, patch, seller.storeName);
    revalidatePath(`/seller/products/${slug}`);
    revalidatePath(`/shop/${slug}`);
    return succeed("Product saved.");
  }

  // New listing. The slug is derived once and never changes, because it is the
  // product's public URL.
  const products = await getAdminProducts();
  const base = slugify(name) || `product-${randomUUID().slice(0, 6)}`;
  let candidate = base;
  let attempt = 2;
  while (products.some((product) => product.slug === candidate)) candidate = `${base}-${attempt++}`;

  const gradient = "from-neutral-800 to-neutral-600";
  const product: Product = {
    id: randomUUID(),
    slug: candidate,
    name,
    brand: patch.brand,
    sku: patch.sku || `${seller.slug.slice(0, 4).toUpperCase()}-${candidate.slice(0, 6).toUpperCase()}`,
    shortDescription: patch.shortDescription,
    longDescription: patch.longDescription,
    features: patch.features,
    specifications: [],
    price,
    compareAtPrice: patch.compareAtPrice,
    discountPercent: patch.compareAtPrice
      ? Math.round(((patch.compareAtPrice - price) / patch.compareAtPrice) * 100)
      : 0,
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stockStatus: patch.stockCount > 0 ? "in_stock" : "out_of_stock",
    stockCount: patch.stockCount,
    category: patch.category,
    subcategory: patch.subcategory,
    sellerId: seller.id,
    images: [],
    variants: [{ id: "default", label: "Standard" }],
    tags: patch.tags,
    releasedAt: new Date().toISOString().slice(0, 10),
    gradient,
    warrantyMonths: 12,
    returnWindowDays: seller.returnWindowDays,
    dispatchHours: seller.dispatchHours,
    hasVideo: Boolean(patch.videoUrl),
    featured: false,
    bestSeller: false,
    newArrival: true,
    trending: false,
  };

  catalogStore.create(
    product,
    {
      status: patch.status,
      costPrice: patch.costPrice,
      barcode: patch.barcode,
      seoTitle: patch.seoTitle,
      seoDescription: patch.seoDescription,
      videoUrl: patch.videoUrl,
      visible: patch.visible,
    },
    seller.storeName,
  );

  revalidatePath("/seller/products");
  return succeed("Product created.", { slug: candidate });
}

export async function setSellerProductStatusAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const slug = field(form, "slug");
  if (!(await ownedProduct(seller.id, slug))) return fail("That product is not in your catalogue.");

  const status = field(form, "status") as ProductStatus;
  catalogStore.patch(slug, { status }, seller.storeName);

  revalidatePath("/seller/products");
  revalidatePath(`/shop/${slug}`);
  return succeed(`Product ${status}.`);
}

export async function deleteSellerProductAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const slug = field(form, "slug");
  if (!(await ownedProduct(seller.id, slug))) return fail("That product is not in your catalogue.");

  catalogStore.remove(slug);
  revalidatePath("/seller/products");
  return succeed("Product removed from your store.");
}

export async function adjustSellerStockAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const slug = field(form, "slug");
  const product = await ownedProduct(seller.id, slug);
  if (!product) return fail("That product is not in your catalogue.");

  const stockCount = Math.max(0, number(form, "stockCount"));
  catalogStore.patch(
    slug,
    {
      stockCount,
      stockStatus: stockCount <= 0 ? "out_of_stock" : stockCount <= 10 ? "low_stock" : "in_stock",
    },
    seller.storeName,
  );

  revalidatePath("/seller/inventory");
  return succeed(`Stock set to ${stockCount}.`);
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

/** A seller may only act on an order that contains one of their lines. */
async function ownedOrder(sellerId: string, orderId: string) {
  const order = orderStore.find(orderId);
  if (!order) return undefined;
  return linesForSeller(order, sellerId).length > 0 ? order : undefined;
}

export async function acceptOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const orderId = field(form, "orderId");
  const order = await ownedOrder(seller.id, orderId);
  if (!order) return fail("That order is not yours.");
  if (order.status !== "processing") return fail("That order has already moved on.");

  await advanceOrder(orderId, "packed");
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  return succeed("Order accepted and marked packed.");
}

export async function rejectOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const orderId = field(form, "orderId");
  const order = await ownedOrder(seller.id, orderId);
  if (!order) return fail("That order is not yours.");

  const reason = field(form, "reason") || "Seller could not fulfil this order";

  // A rejection is recorded on the timeline and escalated to support rather
  // than silently cancelling the customer's whole order — other sellers may
  // still be shipping their part of it.
  orderStore.save({
    ...order,
    timeline: [
      ...order.timeline,
      {
        id: randomUUID(),
        status: order.status,
        label: `${seller.storeName} could not fulfil their items`,
        detail: reason,
        at: new Date().toISOString(),
      },
    ],
  });

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  return succeed("Order flagged for support. The customer has been notified.");
}

export async function shipOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const orderId = field(form, "orderId");
  const order = await ownedOrder(seller.id, orderId);
  if (!order) return fail("That order is not yours.");

  const trackingNumber = field(form, "trackingNumber");
  if (trackingNumber) orderStore.save({ ...order, trackingNumber });

  await advanceOrder(orderId, "shipped");

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  return succeed(trackingNumber ? `Shipped with tracking ${trackingNumber}.` : "Marked as shipped.");
}

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveSellerCouponAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const label = field(form, "label");
  const labelError = validateRequired(label, "Coupon name");
  if (labelError) return fail("Please correct the highlighted fields.", { label: labelError });

  const code = field(form, "code").trim().toUpperCase();
  if (!code) return fail("A coupon needs a code.", { code: "Required" });

  const clash = promotionStore.findByCode(code);
  const id = `seller-${seller.id}-${slugify(label)}`;
  if (clash && clash.id !== id) {
    return fail(`${code} is already in use.`, { code: "Already in use" });
  }

  const value = number(form, "value");

  // Seller coupons are scoped to that seller's products by slug, so a vendor
  // can never discount another vendor's stock.
  const catalogue = (await getAdminProducts()).filter((product) => product.sellerId === seller.id);

  promotionStore.upsert({
    id,
    code,
    kind: "percentage",
    label: `${seller.storeName}: ${label}`,
    description: field(form, "description") || label,
    value,
    minSubtotal: money(form, "minSubtotal") || undefined,
    slugs: catalogue.map((product) => product.slug),
    startsAt: field(form, "startsAt") || undefined,
    endsAt: field(form, "endsAt") || undefined,
    automatic: false,
    usageLimit: number(form, "usageLimit") || undefined,
    active: checkbox(form, "active"),
  });

  revalidatePath("/seller/coupons");
  return succeed(`${label} saved.`);
}

export async function deleteSellerCouponAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const id = field(form, "id");
  if (!id.startsWith(`seller-${seller.id}-`)) return fail("That coupon is not yours.");

  promotionStore.remove(id);
  revalidatePath("/seller/coupons");
  return succeed("Coupon removed.");
}

/* -------------------------------------------------------------------------- */
/*  Payouts                                                                    */
/* -------------------------------------------------------------------------- */

export async function requestPayoutAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  // The amount is validated against the ledger inside the store — a client
  // cannot withdraw more than it earned, whatever it posts.
  const result = payoutStore.request(seller.id, money(form, "amount"));
  if (result.error) return fail(result.error, { amount: result.error });

  revalidatePath("/seller/payouts");
  revalidatePath("/admin/payouts");
  return succeed(`Withdrawal ${result.payout!.reference} requested.`);
}

/* -------------------------------------------------------------------------- */
/*  Messaging and reviews                                                      */
/* -------------------------------------------------------------------------- */

export async function replyToThreadAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const threadId = field(form, "threadId");
  const thread = messaging.thread(threadId);
  if (!thread || thread.sellerId !== seller.id) return fail("That conversation is not yours.");

  const body = field(form, "body");
  if (!body) return fail("Write a reply first.", { body: "Required" });

  messaging.reply({
    threadId,
    authorRole: "seller",
    authorId: seller.id,
    authorName: seller.storeName,
    body,
  });

  if (checkbox(form, "makePublic")) messaging.setVisibility(threadId, "public");

  revalidatePath("/seller/messages");
  revalidatePath(`/seller/messages/${threadId}`);
  return succeed("Reply sent.");
}

export async function replyToReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { seller, error } = await guarded(form);
  if (!seller) return error!;

  const id = field(form, "reviewId");
  const review = reviewStore.find(id);
  if (!review || review.sellerId !== seller.id) return fail("That review is not yours.");

  const body = field(form, "body");
  if (!body) return fail("Write a reply first.", { body: "Required" });

  reviewStore.reply(id, body);
  revalidatePath("/seller/reviews");
  return succeed("Reply published.");
}

/* -------------------------------------------------------------------------- */
/*  Shopper-facing marketplace actions                                         */
/* -------------------------------------------------------------------------- */

export async function toggleFollowAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to follow a store.");

  const sellerId = field(form, "sellerId");
  const seller = sellerStore.find(sellerId);
  if (!seller) return fail("Unknown store.");

  const { following } = followStore.toggle(sellerId, user.id);
  revalidatePath(`/sellers/${seller.slug}`);
  return succeed(following ? `Following ${seller.storeName}.` : `Unfollowed ${seller.storeName}.`);
}

export async function askSellerAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to message a seller.");

  const sellerId = field(form, "sellerId");
  const seller = sellerStore.find(sellerId);
  if (!seller) return fail("Unknown store.");

  const body = field(form, "body");
  if (!body) return fail("Write your question first.", { body: "Required" });

  const thread = messaging.start({
    kind: field(form, "productSlug") ? "question" : "general",
    subject: field(form, "subject") || "Question about a product",
    customerId: user.id,
    customerName: user.name,
    sellerId,
    productSlug: field(form, "productSlug") || undefined,
    orderId: field(form, "orderId") || undefined,
    visibility: checkbox(form, "public") ? "public" : "private",
    body,
  });

  revalidatePath("/account/messages");
  return succeed("Question sent. You will be notified when the seller replies.", {
    threadId: thread.id,
  });
}

export async function replyAsCustomerAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");

  const threadId = field(form, "threadId");
  const thread = messaging.thread(threadId);
  if (!thread || thread.customerId !== user.id) return fail("That conversation is not yours.");

  const body = field(form, "body");
  if (!body) return fail("Write a reply first.", { body: "Required" });

  messaging.reply({
    threadId,
    authorRole: "customer",
    authorId: user.id,
    authorName: user.name,
    body,
  });

  revalidatePath(`/account/messages/${threadId}`);
  return succeed("Reply sent.");
}

export async function submitReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to leave a review.");

  const target = field(form, "target") === "seller" ? "seller" : "product";
  const targetId = field(form, "targetId");
  const sellerId = field(form, "sellerId");

  const rating = number(form, "rating");
  if (rating < 1 || rating > 5) return fail("Choose a rating from one to five.", { rating: "Required" });

  const title = field(form, "title");
  const body = field(form, "body");
  if (!title || !body) {
    return fail("A review needs a title and a few words.", {
      ...(title ? {} : { title: "Required" }),
      ...(body ? {} : { body: "Required" }),
    });
  }

  if (reviewStore.existing(user.id, target, targetId)) {
    return fail("You have already reviewed this.");
  }

  const review = reviewStore.submit({
    target,
    targetId,
    sellerId,
    authorId: user.id,
    authorName: user.name,
    rating,
    title,
    body,
  });

  if (target === "seller") recomputeSellerRating(sellerId);

  revalidatePath(target === "seller" ? "/sellers" : `/shop/${targetId}`);
  return succeed(
    review.verifiedPurchase
      ? "Thank you. Your verified review is queued for moderation."
      : "Thank you. Your review is queued for moderation.",
  );
}

/** Used by the seller shell to prove the session is still valid on nav. */
export async function sellerHeartbeat() {
  const { seller } = await requireSeller();
  return { id: seller.id, status: seller.status };
}
