import type { Product } from "@/types";

/**
 * Delivery estimates.
 *
 * Pure functions over an explicit "now", so they can be unit-tested and so a
 * statically prerendered page never bakes in a stale date — the UI passes the
 * client's date once it has hydrated (see `useClientToday`).
 */

const WEEKEND = new Set([0, 6]);

function addBusinessDays(from: Date, days: number) {
  const date = new Date(from.getTime());
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (!WEEKEND.has(date.getDay())) remaining -= 1;
  }
  return date;
}

export interface DeliveryWindow {
  earliest: Date;
  latest: Date;
  /** "Thu 2 Aug – Mon 6 Aug" */
  label: string;
  /** "Order within 6 hrs for dispatch today" style urgency line, if applicable. */
  dispatchNote: string;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function estimateDelivery(product: Product, now: Date): DeliveryWindow {
  // Dispatch first, then transit. Out-of-stock items add a restock allowance.
  const dispatchDays = Math.ceil(product.dispatchHours / 24);
  const restockDays = product.stockStatus === "out_of_stock" ? 10 : 0;

  const earliest = addBusinessDays(now, dispatchDays + restockDays + 2);
  const latest = addBusinessDays(now, dispatchDays + restockDays + 4);

  const cutoffHour = 15;
  const dispatchNote =
    product.stockStatus === "out_of_stock"
      ? "Back in stock in about two weeks"
      : now.getHours() < cutoffHour && !WEEKEND.has(now.getDay())
        ? `Order within ${cutoffHour - now.getHours()} hr${cutoffHour - now.getHours() === 1 ? "" : "s"} for same-day dispatch`
        : "Dispatches on the next working day";

  return {
    earliest,
    latest,
    label: `${dayFormat.format(earliest)} – ${dayFormat.format(latest)}`,
    dispatchNote,
  };
}

/** Compact form for cards: "Arrives Thu 2 Aug". */
export function shortDeliveryLabel(product: Product, now: Date) {
  return `Arrives ${dayFormat.format(estimateDelivery(product, now).earliest)}`;
}

export function formatWarranty(months: number) {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} months`;
}
