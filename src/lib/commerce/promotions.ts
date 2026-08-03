import type {
  AppliedDiscount,
  Cents,
  PricedLine,
  Promotion,
} from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";

/**
 * Promotion engine.
 *
 * One evaluator handles every promotion kind, so adding a rule means adding a
 * case here rather than a branch in the checkout. Automatic promotions apply
 * without a code; coupons are the same objects with `code` set and
 * `automatic: false`.
 *
 * Promotions are stored in-memory behind `promotionStore` — swap it for a table
 * and nothing above changes.
 */

const globalForPromotions = globalThis as unknown as { __samruxPromotions?: Promotion[] };

function seed(): Promotion[] {
  return [
    {
      id: "welcome10",
      code: "WELCOME10",
      kind: "percentage",
      label: "10% off your first order",
      description: `Ten per cent off any order over ${formatPrice(5000)}.`,
      value: 10,
      minSubtotal: 5000,
      automatic: false,
      usageCount: 0,
      oncePerCustomer: true,
      active: true,
    },
    {
      id: "samrux25",
      code: "SAMRUX25",
      kind: "fixed",
      label: `${formatPrice(2500)} off orders over ${formatPrice(20000)}`,
      description: `A flat ${formatPrice(2500)} off larger orders.`,
      value: 2500,
      minSubtotal: 20000,
      automatic: false,
      usageCount: 0,
      active: true,
    },
    {
      id: "freeship",
      code: "FREESHIP",
      kind: "free-shipping",
      label: "Free shipping",
      description: "Removes the shipping cost from any order.",
      value: 0,
      automatic: false,
      usageCount: 0,
      active: true,
    },
    {
      id: "bogo-grocery",
      code: "GOURMET2",
      kind: "bogo",
      label: "Buy one get one on Grocery & Gourmet Food",
      description: "Cheapest of every pair in the grocery department is free.",
      value: 0,
      category: "grocery-gourmet-food",
      automatic: false,
      usageCount: 0,
      active: true,
    },
    {
      id: "bundle-3",
      kind: "bundle",
      label: "Bundle saving",
      description: "5% off automatically once there are three or more items in the cart.",
      value: 5,
      automatic: true,
      usageCount: 0,
      active: true,
    },
    {
      id: "flash-members",
      kind: "flash",
      label: "Members' week",
      description: "An extra 5% off anything already reduced.",
      value: 5,
      automatic: true,
      usageCount: 0,
      active: true,
    },
  ];
}

function state(): Promotion[] {
  if (!globalForPromotions.__samruxPromotions) {
    globalForPromotions.__samruxPromotions = seed();
  }
  return globalForPromotions.__samruxPromotions;
}

export const promotionStore = {
  all(): Promotion[] {
    return state();
  },
  automatic(): Promotion[] {
    return state().filter((promotion) => promotion.automatic && promotion.active);
  },
  findByCode(code: string): Promotion | undefined {
    const wanted = code.trim().toUpperCase();
    return state().find((promotion) => promotion.code?.toUpperCase() === wanted);
  },
  recordUse(id: string) {
    const promotion = state().find((entry) => entry.id === id);
    if (promotion) promotion.usageCount += 1;
  },
  /** Create or update. Admin-driven; the checkout only ever reads. */
  upsert(input: Omit<Promotion, "usageCount"> & { usageCount?: number }): Promotion {
    const existing = state().findIndex((entry) => entry.id === input.id);
    const record: Promotion = {
      ...input,
      usageCount: input.usageCount ?? (existing >= 0 ? state()[existing].usageCount : 0),
    };
    if (existing >= 0) state()[existing] = record;
    else state().push(record);
    return record;
  },
  remove(id: string) {
    const index = state().findIndex((entry) => entry.id === id);
    if (index >= 0) state().splice(index, 1);
  },
};

/* -------------------------------------------------------------------------- */

export interface PromotionContext {
  lines: PricedLine[];
  subtotal: Cents;
  shipping: Cents;
}

export type PromotionRejection =
  | "not-found"
  | "inactive"
  | "expired"
  | "not-started"
  | "usage-limit"
  | "below-minimum"
  | "no-matching-items";

export function describeRejection(reason: PromotionRejection): string {
  switch (reason) {
    case "not-found":
      return "That code was not recognised.";
    case "inactive":
      return "That code is no longer available.";
    case "expired":
      return "That code has expired.";
    case "not-started":
      return "That code is not active yet.";
    case "usage-limit":
      return "That code has reached its redemption limit.";
    case "below-minimum":
      return "Your order does not reach the minimum for that code.";
    case "no-matching-items":
      return "Nothing in your cart qualifies for that code.";
  }
}

function eligibleLines(promotion: Promotion, lines: PricedLine[]) {
  return lines.filter((line) => {
    if (promotion.category && line.category !== promotion.category) return false;
    if (promotion.slugs && !promotion.slugs.includes(line.slug)) return false;
    return true;
  });
}

/**
 * Works out what a promotion is worth against a cart. Returns `null` with a
 * reason when it does not apply, so the UI can explain rather than fail quietly.
 */
export function evaluatePromotion(
  promotion: Promotion,
  context: PromotionContext,
  now = new Date(),
): { discount: AppliedDiscount } | { rejected: PromotionRejection } {
  if (!promotion.active) return { rejected: "inactive" };
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return { rejected: "not-started" };
  if (promotion.endsAt && new Date(promotion.endsAt) < now) return { rejected: "expired" };
  if (
    typeof promotion.usageLimit === "number" &&
    promotion.usageCount >= promotion.usageLimit
  ) {
    return { rejected: "usage-limit" };
  }

  const scoped = eligibleLines(promotion, context.lines);
  if (scoped.length === 0) return { rejected: "no-matching-items" };

  const scopedSubtotal = scoped.reduce((total, line) => total + line.lineSubtotal, 0);

  if (typeof promotion.minSubtotal === "number" && context.subtotal < promotion.minSubtotal) {
    return { rejected: "below-minimum" };
  }

  const base: Omit<AppliedDiscount, "amount"> = {
    id: promotion.id,
    label: promotion.label,
    kind: promotion.kind,
    ...(promotion.code ? { code: promotion.code } : {}),
  };

  switch (promotion.kind) {
    case "percentage":
    case "bundle": {
      // Bundle only kicks in once the cart is genuinely a bundle.
      if (promotion.kind === "bundle") {
        const units = context.lines.reduce((total, line) => total + line.quantity, 0);
        if (units < 3) return { rejected: "no-matching-items" };
      }
      return { discount: { ...base, amount: Math.round((scopedSubtotal * promotion.value) / 100) } };
    }

    case "flash": {
      // Only applies on top of items that are already reduced.
      const reduced = scoped.filter((line) => line.unitCompareAtPrice);
      if (reduced.length === 0) return { rejected: "no-matching-items" };
      const reducedSubtotal = reduced.reduce((total, line) => total + line.lineSubtotal, 0);
      return { discount: { ...base, amount: Math.round((reducedSubtotal * promotion.value) / 100) } };
    }

    case "fixed":
      // Never discount below zero.
      return { discount: { ...base, amount: Math.min(promotion.value, scopedSubtotal) } };

    case "free-shipping":
      return {
        discount: { ...base, amount: context.shipping, appliesToShipping: true },
      };

    case "bogo": {
      // Expand to units, sort cheapest first, and give away every second one.
      const units: Cents[] = [];
      for (const line of scoped) {
        for (let index = 0; index < line.quantity; index += 1) units.push(line.unitPrice);
      }
      if (units.length < 2) return { rejected: "no-matching-items" };

      units.sort((a, b) => a - b);
      const freeCount = Math.floor(units.length / 2);
      const amount = units.slice(0, freeCount).reduce((total, price) => total + price, 0);

      return { discount: { ...base, amount } };
    }
  }
}
