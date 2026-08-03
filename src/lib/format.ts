import { currencyConfig } from "@/config/store";

/**
 * Prices are stored in minor units (hundredths) and always have been — the
 * store's currency is now USDT rather than USD, which changes only how a number
 * is *rendered*, never how it is stored or added up.
 *
 * `Intl.NumberFormat` cannot format USDT as a currency: `currency` requires an
 * ISO 4217 code and Tether has none. So the number is grouped by Intl and the
 * symbol is applied here.
 */
export function formatPrice(minorUnits: number, currency = currencyConfig.code) {
  const value = minorUnits / currencyConfig.minorUnits;

  const grouped = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: minorUnits % currencyConfig.minorUnits === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

  // Anything other than the store currency is a genuine ISO code (a supplier
  // feed, a historical order) and can go through Intl unchanged.
  if (currency !== currencyConfig.code) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    }).format(value);
  }

  return currencyConfig.position === "prefix"
    ? `${currencyConfig.symbol}${grouped}`
    : `${grouped} ${currencyConfig.code}`;
}

/** Long form, for invoices and anywhere the ticker must be unambiguous. */
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
