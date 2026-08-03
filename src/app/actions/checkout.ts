"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { userStore } from "@/lib/auth/user-store";
import { describeGiftCardRejection, validateGiftCard } from "@/lib/commerce/gift-cards";
import {
  cancelOrder,
  orderStore,
  placeOrder,
  requestRefund,
  requestReturn,
} from "@/lib/commerce/orders";
import { priceCart } from "@/lib/commerce/pricing";
import {
  describeRejection,
  evaluatePromotion,
  promotionStore,
} from "@/lib/commerce/promotions";
import { getShippingMethod } from "@/lib/commerce/shipping";
import type { CartInput, OrderAddress } from "@/lib/commerce/types";
import { getPaymentProvider } from "@/lib/payments/registry";
import { fail, field, succeed, validateRequired, type FormState } from "@/lib/auth/validation";
import { STORE_CURRENCY } from "@/lib/commerce/types";

/**
 * Checkout and order actions.
 *
 * The browser submits *what* is in the cart, never *what it costs*. Every action
 * re-prices from the catalogue through `priceCart`, so a tampered payload can
 * change the basket but never the price.
 */

function parseCart(raw: string): CartInput[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const item = entry as Partial<CartInput>;
      if (typeof item.slug !== "string" || typeof item.variantId !== "string") return [];
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return [];
      return [{ slug: item.slug, variantId: item.variantId, quantity: Math.floor(quantity) }];
    });
  } catch {
    return [];
  }
}

function readAddress(form: FormData, prefix: string): OrderAddress {
  const get = (name: string) => field(form, `${prefix}${name}`);
  return {
    recipient: get("Recipient"),
    line1: get("Line1"),
    line2: get("Line2") || undefined,
    city: get("City"),
    postcode: get("Postcode"),
    country: (get("Country") || "US").toUpperCase(),
    phone: get("Phone") || undefined,
  };
}

function validateAddress(address: OrderAddress, prefix: string, errors: Record<string, string>) {
  const required: [keyof OrderAddress, string][] = [
    ["recipient", "Recipient"],
    ["line1", "Address line 1"],
    ["city", "City"],
    ["postcode", "Postcode"],
    ["country", "Country"],
  ];

  for (const [key, label] of required) {
    const message = validateRequired(address[key], label);
    if (message) errors[`${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`] = message;
  }
}

/* -------------------------------------------------------------------------- */
/*  Coupons and gift cards                                                     */
/* -------------------------------------------------------------------------- */

export async function applyCouponAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const code = field(form, "code").toUpperCase();
  if (!code) return fail("Enter a code.", { code: "Required" });

  const items = parseCart(field(form, "cart"));
  const promotion = promotionStore.findByCode(code);
  if (!promotion) return fail(describeRejection("not-found"), { code: "Not recognised" });

  // Evaluate against the real cart so a code that cannot help says so now.
  const priced = await priceCart({ items });
  const result = evaluatePromotion(promotion, {
    lines: priced.lines,
    subtotal: priced.totals.subtotal,
    shipping: 0,
  });

  if ("rejected" in result) return fail(describeRejection(result.rejected), { code: "Not applicable" });

  return succeed(`${promotion.label} applied.`);
}

export async function applyGiftCardAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const code = field(form, "code").toUpperCase();
  if (!code) return fail("Enter a gift card number.", { code: "Required" });

  const result = validateGiftCard(code);
  if ("rejected" in result) {
    return fail(describeGiftCardRejection(result.rejected), { code: "Not valid" });
  }

  return succeed(
    `Gift card applied — $${(result.card.balance / 100).toFixed(2)} available.`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Placing an order                                                           */
/* -------------------------------------------------------------------------- */

export async function placeOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to complete your order.");

  const items = parseCart(field(form, "cart"));
  if (items.length === 0) return fail("Your cart is empty.");

  const shippingAddress = readAddress(form, "ship");
  const billingSameAsShipping = form.get("billingSame") === "on";
  const billingAddress = billingSameAsShipping ? shippingAddress : readAddress(form, "bill");

  const errors: Record<string, string> = {};
  validateAddress(shippingAddress, "ship", errors);
  if (!billingSameAsShipping) validateAddress(billingAddress, "bill", errors);

  const shippingMethodId = field(form, "shippingMethodId");
  const method = getShippingMethod(shippingMethodId);
  if (!method) errors.shippingMethodId = "Choose a delivery method";

  const providerId = field(form, "paymentProviderId");
  const provider = getPaymentProvider(providerId);
  if (!provider) errors.paymentProviderId = "Choose a payment method";

  if (Object.keys(errors).length > 0) {
    return fail("Please complete the highlighted fields.", errors);
  }

  const couponCodes = field(form, "coupons").split(",").map((code) => code.trim()).filter(Boolean);
  const giftCardCodes = field(form, "giftCards").split(",").map((code) => code.trim()).filter(Boolean);

  // Authoritative repricing. Anything the browser claimed is discarded here.
  const priced = await priceCart({
    items,
    couponCodes,
    giftCardCodes,
    shippingMethodId,
    country: shippingAddress.country,
  });

  if (priced.lines.length === 0) return fail("Your cart is empty.");
  if (priced.hasUnavailableLines) {
    return fail("Something in your cart went out of stock. Review the cart and try again.");
  }

  const intent = await provider!.createIntent({
    orderReference: `PENDING-${user.id.slice(0, 8)}`,
    amount: priced.totals.grandTotal,
    currency: STORE_CURRENCY,
    email: user.email,
    billingAddress,
  });

  if (intent.status === "failed") {
    return fail("That payment could not be authorised. Try another method.");
  }

  const order = await placeOrder({
    userId: user.id,
    email: user.email,
    customerName: user.name,
    lines: priced.lines,
    totals: priced.totals,
    shippingAddress,
    billingAddress,
    shippingMethodId: method!.id,
    shippingMethodLabel: method!.label,
    deliveryEstimate: priced.deliveryEstimate!,
    payment: {
      providerId: provider!.id,
      providerLabel: provider!.label,
      reference: intent.reference,
      status: intent.status === "authorised" ? "captured" : "pending",
      amount: priced.totals.grandTotal,
    },
    notes: field(form, "notes") || undefined,
    couponCodes,
    giftCardCodes,
  });

  // Keep the address book in step with what was just used.
  if (form.get("saveAddress") === "on") {
    const exists = user.addresses.some(
      (entry) => entry.line1 === shippingAddress.line1 && entry.postcode === shippingAddress.postcode,
    );
    if (!exists) {
      await userStore.update(user.id, {
        addresses: [
          ...user.addresses.map((entry) => ({ ...entry, isDefault: false })),
          {
            id: crypto.randomUUID(),
            label: "Checkout",
            recipient: shippingAddress.recipient,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            postcode: shippingAddress.postcode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            isDefault: true,
          },
        ],
      });
    }
  }

  revalidatePath("/account", "layout");
  redirect(`/checkout/confirmation/${order.id}`);
}

/* -------------------------------------------------------------------------- */
/*  Order lifecycle                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the order named by the form and proves the caller owns it.
 *
 * The ownership test has to happen *before* any state change. Checking the
 * order returned by `cancelOrder`/`requestRefund` — as this once did — gates
 * only the message the customer reads: the mutation has already landed, so
 * anyone signed in could cancel or refund a stranger's order by posting its id
 * and simply ignore the error they got back.
 *
 * Returns `null` for "not signed in", "no such order" and "not yours" alike;
 * the caller answers all three the same way, so a probe cannot tell an order
 * that exists from one that does not.
 */
async function ownedOrder(form: FormData) {
  const user = await getCurrentUser();
  if (!user) return null;

  const orderId = field(form, "orderId");
  if (!orderId) return null;

  const order = orderStore.find(orderId);
  if (!order || order.userId !== user.id) return null;

  return { user, orderId, order };
}

export async function cancelOrderAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const owned = await ownedOrder(form);
  if (!owned) return fail("That order can no longer be cancelled.");

  const reason = field(form, "reason") || "Cancelled by the customer";
  const order = await cancelOrder(owned.orderId, reason);
  if (!order) return fail("That order can no longer be cancelled.");

  revalidatePath(`/account/orders/${owned.orderId}`);
  revalidatePath("/account/orders");
  return succeed("Order cancelled. Any payment taken is refunded to the original method.");
}

export async function requestReturnAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const owned = await ownedOrder(form);
  if (!owned) return fail("Returns open once an order has been delivered.");

  const reason = field(form, "reason");
  if (!reason) return fail("Tell us briefly why it is going back.", { reason: "Required" });

  const order = await requestReturn(owned.orderId, reason);
  if (!order) return fail("Returns open once an order has been delivered.");

  revalidatePath(`/account/orders/${owned.orderId}`);
  return succeed("Return started. A prepaid label follows by email.");
}

export async function requestRefundAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const owned = await ownedOrder(form);
  if (!owned) return fail("That order cannot be refunded.");

  const order = await requestRefund(owned.orderId);
  if (!order) return fail("That order cannot be refunded.");

  revalidatePath(`/account/orders/${owned.orderId}`);
  return succeed("Refund issued to the original payment method.");
}
