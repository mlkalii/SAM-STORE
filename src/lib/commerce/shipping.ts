import type {
  Cents,
  DeliveryEstimate,
  ShippingMethod,
  ShippingZone,
  ShippingZoneId,
} from "@/lib/commerce/types";

/**
 * Shipping zones, methods and delivery estimates.
 *
 * Rates are data, not code: a real integration replaces `SHIPPING_METHODS` with
 * a carrier API response of the same shape and nothing downstream changes.
 */

export const SHIPPING_ZONES: ShippingZone[] = [
  { id: "domestic", label: "United States", countries: ["US"] },
  {
    id: "europe",
    label: "Europe",
    countries: ["GB", "IE", "FR", "DE", "ES", "IT", "NL", "BE", "PT", "SE", "DK", "NO", "FI", "PL", "AT", "CH"],
  },
  { id: "international", label: "Rest of world", countries: ["*"] },
];

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard-domestic",
    zone: "domestic",
    label: "Standard",
    description: "Tracked, 2–4 working days once dispatched.",
    rate: 995,
    freeOver: 7500,
    minDays: 2,
    maxDays: 4,
    tags: ["Carbon neutral"],
  },
  {
    id: "express-domestic",
    zone: "domestic",
    label: "Express",
    description: "Next working day when ordered before 3pm.",
    rate: 1995,
    minDays: 1,
    maxDays: 2,
    tags: ["Signature required"],
  },
  {
    id: "standard-europe",
    zone: "europe",
    label: "Standard international",
    description: "Tracked, 5–9 working days. Duties collected on delivery.",
    rate: 1895,
    freeOver: 20000,
    minDays: 5,
    maxDays: 9,
  },
  {
    id: "express-europe",
    zone: "europe",
    label: "Express international",
    description: "Courier, 2–4 working days, duties prepaid.",
    rate: 3495,
    minDays: 2,
    maxDays: 4,
    tags: ["Duties prepaid"],
  },
  {
    id: "standard-international",
    zone: "international",
    label: "International",
    description: "Tracked, 7–14 working days. Duties collected on delivery.",
    rate: 2495,
    freeOver: 30000,
    minDays: 7,
    maxDays: 14,
  },
];

/** Falls back to the catch-all zone, so an unknown country still gets a rate. */
export function zoneForCountry(country: string): ShippingZoneId {
  const code = country.trim().toUpperCase();
  const match = SHIPPING_ZONES.find((zone) => zone.countries.includes(code));
  return match?.id ?? "international";
}

export function methodsForCountry(country: string) {
  const zone = zoneForCountry(country);
  return SHIPPING_METHODS.filter((method) => method.zone === zone);
}

export function getShippingMethod(id: string) {
  return SHIPPING_METHODS.find((method) => method.id === id);
}

/** The rate actually charged, after the method's own free-shipping threshold. */
export function rateFor(method: ShippingMethod, subtotal: Cents): Cents {
  if (typeof method.freeOver === "number" && subtotal >= method.freeOver) return 0;
  return method.rate;
}

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

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * Delivery window for a method. `dispatchDays` covers the warehouse, on top of
 * the carrier's transit time — the two are separate promises.
 */
export function estimateDelivery(
  method: ShippingMethod,
  now: Date,
  dispatchDays = 2,
): DeliveryEstimate {
  const earliest = addBusinessDays(now, dispatchDays + method.minDays);
  const latest = addBusinessDays(now, dispatchDays + method.maxDays);

  return {
    earliest: earliest.toISOString(),
    latest: latest.toISOString(),
    label: `${dayFormat.format(earliest)} – ${dayFormat.format(latest)}`,
  };
}
