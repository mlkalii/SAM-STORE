/**
 * Official SAMRUX business configuration.
 *
 * One source of truth for the legal entity, contact details, currency, shipping
 * region and timezone. Everything customer-facing, every invoice, every email
 * and every admin screen reads from here — so a change of address or phone
 * number is a single edit, not a search across the codebase.
 */

export const storeConfig = {
  legalName: "SAMRUX LLC",
  tradingName: "SAMRUX",

  address: {
    line1: "7901 4TH ST N",
    line2: "STE 300",
    city: "St. Petersburg",
    state: "FL",
    postcode: "33702",
    country: "United States",
    countryCode: "US",
  },

  phone: "+1 (840) 206-4262",
  /** E.164, for `tel:` links and structured data. */
  phoneHref: "+18402064262",

  /** Primary address — customer-facing, used everywhere by default. */
  supportEmail: "info@samrux.com",
  /** Secondary address — company, press, wholesale and legal notices. */
  contactEmail: "contact@samrux.com",

  language: "English",
  locale: "en-US",
  timezone: "America/New_York",
} as const;

/** Single line, for footers and email signatures. */
export const storeAddressLine = [
  storeConfig.address.line1,
  storeConfig.address.line2,
  `${storeConfig.address.city}, ${storeConfig.address.state} ${storeConfig.address.postcode}`,
  storeConfig.address.country,
].join(", ");

/** Multi-line, for invoices and the contact page. */
export const storeAddressLines = [
  storeConfig.legalName,
  `${storeConfig.address.line1}, ${storeConfig.address.line2}`,
  `${storeConfig.address.city}, ${storeConfig.address.state} ${storeConfig.address.postcode}`,
  storeConfig.address.country,
];

/* -------------------------------------------------------------------------- */
/*  Currency                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Tether. Not an ISO 4217 code, so `Intl.NumberFormat` cannot format it as a
 * currency — see `lib/format`, which groups the number itself and appends the
 * ticker. Amounts stay integer minor units (hundredths) everywhere, exactly as
 * before, so no pricing arithmetic changes.
 */
export const currencyConfig = {
  code: "USDT",
  name: "Tether",
  symbol: "₮",
  /** Minor units per whole token. */
  minorUnits: 100,
  decimals: 2,
  /** Where the symbol sits relative to the number. */
  position: "prefix",
} as const;

/* -------------------------------------------------------------------------- */
/*  Shipping region                                                            */
/* -------------------------------------------------------------------------- */

/** SAMRUX ships to all fifty states. */
export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const shippingRegion = {
  label: "All 50 United States",
  countryCode: "US",
  /** States we do not ship to. Empty — the whole country is covered. */
  excludedStates: [] as string[],
} as const;

export function isServiceableState(code: string) {
  const wanted = code.trim().toUpperCase();
  return (
    US_STATES.some((state) => state.code === wanted) &&
    !(shippingRegion.excludedStates as readonly string[]).includes(wanted)
  );
}

export function stateName(code: string) {
  return US_STATES.find((state) => state.code === code.trim().toUpperCase())?.name ?? code;
}

/* -------------------------------------------------------------------------- */
/*  Timezone                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every customer-visible date is rendered in store time, so an order placed at
 * 11pm in New York never shows as the next day to a customer in California.
 */
export const storeDateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: storeConfig.timezone,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const storeDateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: storeConfig.timezone,
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatStoreDateTime(value: string | number | Date) {
  return storeDateTimeFormat.format(new Date(value));
}

export function formatStoreDate(value: string | number | Date) {
  return storeDateFormat.format(new Date(value));
}
