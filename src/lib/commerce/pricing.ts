import "server-only";

import { getProductsBySlugs } from "@/data/products";
import { giftCardStore, validateGiftCard } from "@/lib/commerce/gift-cards";
import { availabilityFor } from "@/lib/commerce/inventory";
import {
  evaluatePromotion,
  promotionStore,
  type PromotionRejection,
} from "@/lib/commerce/promotions";
import { estimateDelivery, getShippingMethod, rateFor } from "@/lib/commerce/shipping";
import { calculateTax } from "@/lib/commerce/tax";
import { STORE_CURRENCY } from "@/lib/commerce/types";
import type {
  AppliedDiscount,
  CartInput,
  Cents,
  DeliveryEstimate,
  OrderTotals,
  PricedLine,
} from "@/lib/commerce/types";

/**
 * The pricing pipeline.
 *
 * One function turns a cart into money, and every surface uses it: the cart
 * page, each checkout step, the order-placement action and the confirmation
 * email. That is the point — a total can never disagree with itself because
 * there is only one implementation.
 *
 * Prices are always re-derived from the catalogue. Whatever the browser submits
 * for price is ignored, so a tampered payload cannot buy a $3,000 camera for a
 * dollar.
 *
 * Order of operations: subtotal → automatic promotions → coupons → shipping
 * (and shipping discounts) → tax → gift cards → amount due.
 */

export interface PriceCartOptions {
  items: CartInput[];
  /** Coupon codes the customer has entered. */
  couponCodes?: string[];
  /** Gift card codes the customer has applied. */
  giftCardCodes?: string[];
  shippingMethodId?: string;
  /** ISO-3166 alpha-2. Drives both shipping zone and tax. */
  country?: string;
  now?: Date;
}

export interface PricedCart {
  lines: PricedLine[];
  totals: OrderTotals;
  deliveryEstimate: DeliveryEstimate | null;
  shippingMethodId: string | null;
  shippingMethodLabel: string | null;
  /** Codes that were entered but did not apply, with the reason. */
  rejectedCoupons: { code: string; reason: PromotionRejection }[];
  rejectedGiftCards: { code: string; reason: string }[];
  /** True when at least one line cannot be fulfilled at all. */
  hasUnavailableLines: boolean;
  itemCount: number;
}

const EMPTY_TOTALS: OrderTotals = {
  subtotal: 0,
  discountTotal: 0,
  shippingTotal: 0,
  shippingDiscount: 0,
  taxTotal: 0,
  taxLines: [],
  giftCardTotal: 0,
  grandTotal: 0,
  appliedDiscounts: [],
  currency: STORE_CURRENCY,
};

/** Turns raw cart input into catalogue-backed, availability-checked lines. */
export async function priceLines(items: CartInput[]): Promise<PricedLine[]> {
  const wanted = items.filter((item) => item.quantity > 0);
  if (wanted.length === 0) return [];

  const products = await getProductsBySlugs(wanted.map((item) => item.slug));
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return wanted.flatMap<PricedLine>((item) => {
    const product = bySlug.get(item.slug);
    if (!product) return [];

    const variant =
      product.variants.find((option) => option.id === item.variantId) ?? product.variants[0];
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), 99);

    return [
      {
        slug: product.slug,
        variantId: variant.id,
        variantLabel: variant.label,
        quantity,
        name: product.name,
        brand: product.brand,
        category: product.category,
        image: product.images[0]?.thumbnail ?? "",
        gradient: product.gradient,
        unitPrice: product.price,
        ...(product.compareAtPrice ? { unitCompareAtPrice: product.compareAtPrice } : {}),
        lineSubtotal: product.price * quantity,
        lineDiscount: 0,
        availability: availabilityFor(product, variant.id, quantity),
      },
    ];
  });
}

export async function priceCart(options: PriceCartOptions): Promise<PricedCart> {
  const {
    items,
    couponCodes = [],
    giftCardCodes = [],
    shippingMethodId,
    country = "US",
    now = new Date(),
  } = options;

  const lines = await priceLines(items);

  if (lines.length === 0) {
    return {
      lines: [],
      totals: EMPTY_TOTALS,
      deliveryEstimate: null,
      shippingMethodId: null,
      shippingMethodLabel: null,
      rejectedCoupons: [],
      rejectedGiftCards: [],
      hasUnavailableLines: false,
      itemCount: 0,
    };
  }

  const subtotal = lines.reduce((total, line) => total + line.lineSubtotal, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  // 1. Shipping, before discounts — a free-shipping coupon needs a rate to zero.
  const method = shippingMethodId ? getShippingMethod(shippingMethodId) : undefined;
  const baseShipping: Cents = method ? rateFor(method, subtotal) : 0;

  // 2. Automatic promotions, then coupons. Both share one evaluator.
  const context = { lines, subtotal, shipping: baseShipping };
  const applied: AppliedDiscount[] = [];

  for (const promotion of promotionStore.automatic()) {
    const result = evaluatePromotion(promotion, context, now);
    if ("discount" in result && result.discount.amount > 0) applied.push(result.discount);
  }

  const rejectedCoupons: { code: string; reason: PromotionRejection }[] = [];
  const seenCodes = new Set<string>();

  for (const rawCode of couponCodes) {
    const code = rawCode.trim().toUpperCase();
    if (!code || seenCodes.has(code)) continue;
    seenCodes.add(code);

    const promotion = promotionStore.findByCode(code);
    if (!promotion) {
      rejectedCoupons.push({ code, reason: "not-found" });
      continue;
    }

    const result = evaluatePromotion(promotion, context, now);
    if ("rejected" in result) {
      rejectedCoupons.push({ code, reason: result.rejected });
      continue;
    }
    if (result.discount.amount > 0) applied.push(result.discount);
  }

  // 3. Split item discounts from shipping discounts, and clamp both.
  const rawItemDiscount = applied
    .filter((discount) => !discount.appliesToShipping)
    .reduce((total, discount) => total + discount.amount, 0);
  const discountTotal = Math.min(rawItemDiscount, subtotal);

  const rawShippingDiscount = applied
    .filter((discount) => discount.appliesToShipping)
    .reduce((total, discount) => total + discount.amount, 0);
  const shippingDiscount = Math.min(rawShippingDiscount, baseShipping);
  const shippingTotal = baseShipping - shippingDiscount;

  // 4. Tax on the discounted goods value.
  const taxableGoods = subtotal - discountTotal;
  const { total: taxTotal, lines: taxLines } = calculateTax(country, taxableGoods, shippingTotal);

  const payable = Math.max(0, taxableGoods + shippingTotal + taxTotal);

  // 5. Gift cards last — they are tender, not a discount.
  let remaining = payable;
  let giftCardTotal = 0;
  const rejectedGiftCards: { code: string; reason: string }[] = [];

  for (const rawCode of giftCardCodes) {
    const code = rawCode.trim().toUpperCase();
    if (!code || remaining <= 0) continue;

    const result = validateGiftCard(code, now);
    if ("rejected" in result) {
      rejectedGiftCards.push({ code, reason: result.rejected });
      continue;
    }

    // Preview only — the balance is not spent until the order is placed.
    const usable = Math.min(result.card.balance, remaining);
    giftCardTotal += usable;
    remaining -= usable;
  }

  // Attribute the item discount back to the lines, proportionally, so an
  // invoice or a partial refund can be worked out per line later.
  const withLineDiscounts = lines.map((line) => ({
    ...line,
    lineDiscount:
      subtotal > 0 ? Math.round((line.lineSubtotal / subtotal) * discountTotal) : 0,
  }));

  return {
    lines: withLineDiscounts,
    totals: {
      subtotal,
      discountTotal,
      shippingTotal,
      shippingDiscount,
      taxTotal,
      taxLines,
      giftCardTotal,
      grandTotal: Math.max(0, payable - giftCardTotal),
      appliedDiscounts: applied,
      currency: STORE_CURRENCY,
    },
    deliveryEstimate: method ? estimateDelivery(method, now) : null,
    shippingMethodId: method?.id ?? null,
    shippingMethodLabel: method?.label ?? null,
    rejectedCoupons,
    rejectedGiftCards,
    hasUnavailableLines: withLineDiscounts.some(
      (line) => line.availability.status === "unavailable",
    ),
    itemCount,
  };
}

/** Spends gift card balances for real. Called only when an order is placed. */
export function commitGiftCards(
  codes: string[],
  amountDue: Cents,
): { spent: Cents; redemptions: { code: string; amount: Cents }[] } {
  let remaining = amountDue;
  let spent = 0;
  // Cards are drained in order, so only the per-card figures reveal who paid
  // what. The caller stores them on the order to make the refund reversible.
  const redemptions: { code: string; amount: Cents }[] = [];

  for (const code of codes) {
    if (remaining <= 0) break;
    const taken = giftCardStore.redeem(code, remaining);
    if (taken > 0) redemptions.push({ code, amount: taken });
    spent += taken;
    remaining -= taken;
  }

  return { spent, redemptions };
}
