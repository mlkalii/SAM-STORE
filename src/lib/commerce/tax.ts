import type { Cents, TaxLine } from "@/lib/commerce/types";
import { zoneForCountry } from "@/lib/commerce/shipping";

/**
 * Tax calculation structure.
 *
 * Rates are a lookup table keyed by destination, which is the shape a real tax
 * service (Avalara, TaxJar, Stripe Tax) returns. Swap `rateFor` for an API call
 * and the pricing pipeline is unchanged.
 *
 * Deliberately simple by design: one rate per destination, applied to the
 * discounted item total plus taxable shipping.
 */

interface TaxRule {
  label: string;
  rate: number;
  /** Whether shipping is taxed alongside goods in this jurisdiction. */
  taxableShipping: boolean;
}

const RULES: Record<string, TaxRule> = {
  US: { label: "Sales tax", rate: 0.08, taxableShipping: false },
  GB: { label: "VAT", rate: 0.2, taxableShipping: true },
  IE: { label: "VAT", rate: 0.23, taxableShipping: true },
  DE: { label: "VAT", rate: 0.19, taxableShipping: true },
  FR: { label: "VAT", rate: 0.2, taxableShipping: true },
  ES: { label: "VAT", rate: 0.21, taxableShipping: true },
  IT: { label: "VAT", rate: 0.22, taxableShipping: true },
  NL: { label: "VAT", rate: 0.21, taxableShipping: true },
};

const ZONE_FALLBACK: Record<string, TaxRule> = {
  domestic: RULES.US,
  europe: { label: "VAT", rate: 0.2, taxableShipping: true },
  // Duties are collected by the carrier on delivery rather than charged here.
  international: { label: "Duties (collected on delivery)", rate: 0, taxableShipping: false },
};

export function taxRuleFor(country: string): TaxRule {
  const code = country.trim().toUpperCase();
  return RULES[code] ?? ZONE_FALLBACK[zoneForCountry(code)];
}

export function calculateTax(
  country: string,
  taxableGoods: Cents,
  shipping: Cents,
): { total: Cents; lines: TaxLine[] } {
  const rule = taxRuleFor(country);
  if (rule.rate === 0) return { total: 0, lines: [] };

  const base = taxableGoods + (rule.taxableShipping ? shipping : 0);
  const amount = Math.round(base * rule.rate);

  return {
    total: amount,
    lines: [{ label: rule.label, rate: rule.rate, amount }],
  };
}
