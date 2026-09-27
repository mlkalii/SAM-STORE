import { currencyConfig } from "@/config/store";

/**
 * Money rendering — the single place a price becomes text.
 *
 * The store trades exclusively in US dollars. Amounts are stored as integer
 * minor units (cents) everywhere: in `catalog.json`, in the cart, in orders and
 * in the database. Nothing below changes an amount, only how it is displayed.
 *
 * Two decimals are always shown ($169.00, never $169) so a price can never be
 * mistaken for a rounded or approximate figure.
 */
export function formatPrice(minorUnits: number, currency: string = currencyConfig.code) {
  const value = minorUnits / currencyConfig.minorUnits;

  return new Intl.NumberFormat(currencyConfig.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currencyConfig.decimals,
    maximumFractionDigits: currencyConfig.decimals,
  }).format(value);
}

/**
 * Long form — `$169.00 USD`.
 *
 * Used wherever the currency must be unambiguous rather than merely implied by
 * the symbol: cart and checkout totals, invoices, order confirmations and
 * payment instructions. `$` alone is shared by several currencies; this is not.
 */
export function formatPriceWithCode(minorUnits: number) {
  return `${formatPrice(minorUnits)} ${currencyConfig.code}`;
}

/** Bare number, for form fields that post a decimal amount back. */
export function toDecimal(minorUnits: number) {
  return (minorUnits / currencyConfig.minorUnits).toFixed(currencyConfig.decimals);
}


export function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
