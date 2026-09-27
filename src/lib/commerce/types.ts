/**
 * Commerce domain types.
 *
 * Deliberately free of React and of any storage concern: these describe the
 * business, and every service, action and component agrees on them. All money
 * is integer minor units (cents) — never floats.
 */

export type Cents = number;

/**
 * The store trades in US dollars. Amounts remain integer minor units (cents)
 * throughout — see `config/store` and `lib/format`.
 */
export type StoreCurrency = "USD";

export const STORE_CURRENCY: StoreCurrency = "USD";

/* -------------------------------------------------------------------------- */
/*  Cart                                                                       */
/* -------------------------------------------------------------------------- */

/** What the browser submits. Prices are re-derived server-side, never trusted. */
export interface CartInput {
  slug: string;
  variantId: string;
  quantity: number;
}

/** A cart line after the server has re-priced it against the catalogue. */
export interface PricedLine {
  slug: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  gradient: string;
  /** Current selling price for one unit. */
  unitPrice: Cents;
  /** List price for one unit, when the product is discounted. */
  unitCompareAtPrice?: Cents;
  /** `unitPrice * quantity`, before any promotion or coupon. */
  lineSubtotal: Cents;
  /** Promotion-driven reduction attributed to this line. */
  lineDiscount: Cents;
  /** Whether the requested quantity can actually be fulfilled. */
  availability: LineAvailability;
}

export interface LineAvailability {
  status: "available" | "partial" | "backorder" | "unavailable";
  /** How many can ship now. */
  availableNow: number;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*  Shipping                                                                   */
/* -------------------------------------------------------------------------- */

export type ShippingZoneId = "domestic" | "europe" | "international";

export interface ShippingZone {
  id: ShippingZoneId;
  label: string;
  /** ISO-3166 alpha-2 codes, or "*" for the catch-all zone. */
  countries: string[];
}

export interface ShippingMethod {
  id: string;
  zone: ShippingZoneId;
  label: string;
  description: string;
  /** Flat rate before any free-shipping threshold or coupon. */
  rate: Cents;
  /** Order subtotal at or above which this method costs nothing. */
  freeOver?: Cents;
  /** Working days, used for the delivery estimate. */
  minDays: number;
  maxDays: number;
  /** Carbon-neutral, signature required, etc. */
  tags?: string[];
}

export interface DeliveryEstimate {
  earliest: string;
  latest: string;
  label: string;
}

/* -------------------------------------------------------------------------- */
/*  Promotions, coupons and gift cards                                         */
/* -------------------------------------------------------------------------- */

export type PromotionKind =
  | "percentage"
  | "fixed"
  | "free-shipping"
  | "bogo"
  | "bundle"
  | "flash";

export interface Promotion {
  id: string;
  code?: string;
  kind: PromotionKind;
  label: string;
  description: string;
  /** Percent (0–100) for `percentage`, cents for `fixed`. */
  value: number;
  /** Minimum order subtotal before the promotion applies. */
  minSubtotal?: Cents;
  /** Restrict to a department. */
  category?: string;
  /** Restrict to specific products. */
  slugs?: string[];
  /** ISO dates. A promotion outside its window never applies. */
  startsAt?: string;
  endsAt?: string;
  /** Automatic promotions need no code and stack below coupons. */
  automatic: boolean;
  /** Total redemptions allowed across all customers. */
  usageLimit?: number;
  usageCount: number;
  /** One per customer when true. */
  oncePerCustomer?: boolean;
  active: boolean;
}

export interface AppliedDiscount {
  id: string;
  label: string;
  kind: PromotionKind;
  amount: Cents;
  /** Set when the discount removes the shipping cost rather than item value. */
  appliesToShipping?: boolean;
  code?: string;
}

export interface GiftCard {
  code: string;
  initialBalance: Cents;
  balance: Cents;
  currency: StoreCurrency;
  active: boolean;
  expiresAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Totals                                                                     */
/* -------------------------------------------------------------------------- */

export interface TaxLine {
  label: string;
  rate: number;
  amount: Cents;
}

export interface OrderTotals {
  /** Sum of every line before discounts. */
  subtotal: Cents;
  /** Item-level reductions (promotions + coupons). */
  discountTotal: Cents;
  /** Shipping after any free-shipping rule. */
  shippingTotal: Cents;
  shippingDiscount: Cents;
  taxTotal: Cents;
  taxLines: TaxLine[];
  /** Amount covered by gift cards. */
  giftCardTotal: Cents;
  /** What the customer actually pays. */
  grandTotal: Cents;
  appliedDiscounts: AppliedDiscount[];
  currency: StoreCurrency;
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_FLOW = [
  "processing",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number] | "cancelled" | "returned" | "refunded";

export interface OrderEvent {
  id: string;
  status: OrderStatus | "placed" | "return-requested" | "refund-requested";
  label: string;
  detail?: string;
  at: string;
}

export interface OrderAddress {
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface OrderPayment {
  providerId: string;
  providerLabel: string;
  /** Never a card number — providers return a token or reference. */
  reference: string;
  status: "pending" | "authorised" | "captured" | "failed" | "refunded";
  amount: Cents;
}

export interface Order {
  id: string;
  reference: string;
  userId: string;
  email: string;
  placedAt: string;
  status: OrderStatus;
  lines: PricedLine[];
  totals: OrderTotals;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  shippingMethodId: string;
  shippingMethodLabel: string;
  deliveryEstimate: DeliveryEstimate;
  payment: OrderPayment;
  notes?: string;
  giftCardCodes: string[];
  /**
   * What each card actually paid, in order of redemption.
   *
   * `giftCardCodes` plus the combined `totals.giftCardTotal` is not enough to
   * reverse a payment: two cards splitting one total cannot be told apart, and
   * refunding the combined figure to each of them mints money. Recorded at
   * placement so a cancellation restores exactly what was taken.
   */
  giftCardRedemptions: { code: string; amount: number }[];
  couponCodes: string[];
  timeline: OrderEvent[];
  trackingNumber?: string;
  /** Set once a return is requested. */
  returnRequest?: {
    requestedAt: string;
    reason: string;
    status: "requested" | "approved" | "received" | "refunded" | "declined";
  };
  refund?: {
    requestedAt: string;
    amount: Cents;
    status: "requested" | "processing" | "issued";
    issuedAt?: string;
  };
}
