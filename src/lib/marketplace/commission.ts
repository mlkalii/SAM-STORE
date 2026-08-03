import "server-only";

import { randomUUID } from "node:crypto";

import type { Cents, PricedLine } from "@/lib/commerce/types";
import { sellerStore } from "@/lib/marketplace/seller-store";
import type { CommissionBreakdown, CommissionRule } from "@/lib/marketplace/types";

/**
 * Commission engine.
 *
 * One evaluator handles every rule kind, so adding a commission model means
 * adding a case here rather than a branch in the order pipeline. Rules are
 * resolved most specific first: a seller override beats a category rule, which
 * beats the marketplace default.
 *
 * Money is integer minor units throughout — a percentage is rounded once, at
 * the end, so a hundred small lines cannot drift from the order total.
 */

const globalForCommission = globalThis as unknown as { __samruxCommission?: CommissionRule[] };

/** Applied when nothing more specific matches. */
export const DEFAULT_COMMISSION_RATE = 12;

function seed(): CommissionRule[] {
  return [
    {
      id: "marketplace-default",
      kind: "percentage",
      label: "Marketplace standard",
      value: DEFAULT_COMMISSION_RATE,
      active: true,
      priority: 0,
    },
    {
      id: "category-electronics",
      kind: "category",
      label: "Electronics",
      value: 8,
      category: "electronics",
      active: true,
      priority: 10,
    },
    {
      id: "category-computers",
      kind: "category",
      label: "Computers & Accessories",
      value: 8,
      category: "computers-accessories",
      active: true,
      priority: 10,
    },
    {
      id: "category-mobile",
      kind: "category",
      label: "Mobile Phones & Accessories",
      value: 10,
      category: "mobile-phones",
      active: true,
      priority: 10,
    },
    {
      id: "category-grocery",
      kind: "category",
      label: "Grocery & Gourmet Food",
      value: 6,
      category: "grocery-gourmet-food",
      active: true,
      priority: 10,
    },
    {
      id: "category-fashion",
      kind: "category",
      label: "Fashion",
      value: 15,
      category: "fashion",
      active: true,
      priority: 10,
    },
    {
      id: "category-beauty",
      kind: "category",
      label: "Beauty & Personal Care",
      value: 15,
      category: "beauty-personal-care",
      active: true,
      priority: 10,
    },
    {
      id: "listing-fee",
      kind: "fixed",
      label: "Per-order listing fee",
      value: 30,
      active: false,
      priority: 5,
    },
  ];
}

function state(): CommissionRule[] {
  if (!globalForCommission.__samruxCommission) {
    globalForCommission.__samruxCommission = seed();
  }
  return globalForCommission.__samruxCommission;
}

export const commissionStore = {
  all(): CommissionRule[] {
    return [...state()].sort((a, b) => b.priority - a.priority);
  },
  active(): CommissionRule[] {
    return this.all().filter((rule) => rule.active);
  },
  find(id: string) {
    return state().find((rule) => rule.id === id);
  },
  upsert(input: CommissionRule) {
    const index = state().findIndex((rule) => rule.id === input.id);
    if (index >= 0) state()[index] = input;
    else state().push(input);
    return input;
  },
  create(input: Omit<CommissionRule, "id">) {
    const rule: CommissionRule = { ...input, id: `rule-${randomUUID().slice(0, 8)}` };
    state().push(rule);
    return rule;
  },
  remove(id: string) {
    // The default is the floor every other rule falls back to; removing it
    // would leave some orders with no commission at all.
    if (id === "marketplace-default") return false;
    const index = state().findIndex((rule) => rule.id === id);
    if (index < 0) return false;
    state().splice(index, 1);
    return true;
  },
  toggle(id: string) {
    const rule = state().find((entry) => entry.id === id);
    if (!rule) return undefined;
    rule.active = !rule.active;
    return rule;
  },
};

/* -------------------------------------------------------------------------- */
/*  Evaluation                                                                 */
/* -------------------------------------------------------------------------- */

/** The rule that applies to one line, most specific first. */
export function ruleFor(sellerId: string, category: string): CommissionRule {
  const rules = commissionStore.active();

  const sellerRule = rules.find((rule) => rule.sellerId === sellerId);
  if (sellerRule) return sellerRule;

  const categoryRule = rules.find((rule) => rule.kind === "category" && rule.category === category);
  if (categoryRule) return categoryRule;

  const percentage = rules.find((rule) => rule.kind === "percentage" && !rule.sellerId);
  if (percentage) return percentage;

  return {
    id: "marketplace-default",
    kind: "percentage",
    label: "Marketplace standard",
    value: DEFAULT_COMMISSION_RATE,
    active: true,
    priority: 0,
  };
}

/**
 * Commission on one seller's share of an order.
 *
 * `lines` must already be that seller's lines. Discounts are respected: the
 * commission is taken on what the customer actually paid, not on list price.
 */
export function commissionFor(
  sellerId: string,
  lines: PricedLine[],
  options: { shipping?: Cents } = {},
): CommissionBreakdown {
  const seller = sellerStore.find(sellerId);
  const gross = lines.reduce((total, line) => total + line.lineSubtotal - line.lineDiscount, 0);

  // A seller-level override is a percentage and beats every rule.
  if (seller?.commissionOverride !== undefined) {
    const commission = Math.round((gross * seller.commissionOverride) / 100);
    return {
      gross,
      commission,
      ruleId: `override-${sellerId}`,
      ruleLabel:
        seller.commissionOverride === 0
          ? "House store — no commission"
          : `Negotiated rate (${seller.commissionOverride}%)`,
      net: gross - commission,
    };
  }

  // Otherwise the highest-priority matching rule per line, summed.
  let commission = 0;
  const applied = new Map<string, CommissionRule>();

  for (const line of lines) {
    const rule = ruleFor(sellerId, line.category);
    applied.set(rule.id, rule);

    const lineNet = line.lineSubtotal - line.lineDiscount;
    commission +=
      rule.kind === "fixed" ? rule.value * line.quantity : Math.round((lineNet * rule.value) / 100);
  }

  // A flat per-order fee is charged once, not once per line.
  const flat = commissionStore.active().find((rule) => rule.kind === "fixed" && !rule.sellerId);
  if (flat && !applied.has(flat.id) && lines.length > 0) {
    commission += flat.value;
    applied.set(flat.id, flat);
  }

  const rules = [...applied.values()];
  const label =
    rules.length === 1 ? rules[0].label : `${rules.length} rules applied`;

  return {
    gross: gross + (options.shipping ?? 0),
    commission,
    ruleId: rules.map((rule) => rule.id).join("+") || "marketplace-default",
    ruleLabel: label,
    net: gross + (options.shipping ?? 0) - commission,
  };
}

/** Groups an order's lines by the seller that fulfils them. */
export function splitBySeller(lines: PricedLine[]): Map<string, PricedLine[]> {
  const grouped = new Map<string, PricedLine[]>();

  for (const line of lines) {
    const sellerId = line.sellerId ?? "samrux-house";
    const existing = grouped.get(sellerId) ?? [];
    existing.push(line);
    grouped.set(sellerId, existing);
  }

  return grouped;
}
