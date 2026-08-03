import type { Cents, StoreCurrency } from "@/lib/commerce/types";

/**
 * Marketplace domain types.
 *
 * A vendor marketplace layered onto the existing commerce domain: orders,
 * pricing, promotions and inventory are unchanged, and a seller is simply the
 * party a product belongs to. Nothing here knows about React or storage.
 */

/* -------------------------------------------------------------------------- */
/*  Seller                                                                     */
/* -------------------------------------------------------------------------- */

export type SellerStatus =
  /** Application started, not yet submitted. */
  | "draft"
  /** Submitted, waiting on a human. */
  | "pending"
  /** Trading. */
  | "approved"
  /** Temporarily blocked; storefront hidden, products delisted. */
  | "suspended"
  /** Application refused. */
  | "rejected";

export type BusinessType =
  | "sole-proprietor"
  | "llc"
  | "corporation"
  | "partnership"
  | "individual";

export interface SellerBusiness {
  legalName: string;
  type: BusinessType;
  /** Employer Identification Number or equivalent. Never rendered in full. */
  taxId: string;
  registrationNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface SellerContact {
  name: string;
  email: string;
  phone: string;
}

export interface SellerBanking {
  /** Bank or wallet label. Full numbers are never stored in this layer. */
  accountName: string;
  /** Last four digits only. */
  accountLast4: string;
  routingLast4?: string;
  /** USDT payout address, when the seller is paid on-chain. */
  walletAddress?: string;
  currency: StoreCurrency;
}

export type VerificationKind = "identity" | "business" | "tax" | "banking";
export type VerificationStatus = "not-started" | "submitted" | "in-review" | "verified" | "rejected";

export interface VerificationRecord {
  kind: VerificationKind;
  status: VerificationStatus;
  /** What the seller uploaded — a reference, never the document itself. */
  documentRef?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  note?: string;
}

export interface Seller {
  id: string;
  /** URL segment for the storefront: /sellers/[slug]. */
  slug: string;
  /** The customer account that owns this seller. */
  ownerUserId: string;

  storeName: string;
  storeDescription: string;
  logoUrl?: string;
  bannerUrl?: string;
  /** Tailwind gradient shown behind the logo and while images load. */
  gradient: string;

  business: SellerBusiness;
  contact: SellerContact;
  banking?: SellerBanking;
  verification: VerificationRecord[];

  status: SellerStatus;
  /** Set when an admin approves, suspends or rejects. */
  statusNote?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;

  /** Percentage points; overrides the marketplace default when set. */
  commissionOverride?: number;

  rating: number;
  reviewCount: number;
  followerCount: number;
  /** Departments this seller lists in — derived, kept for fast filtering. */
  departments: string[];

  joinedAt: string;
  /** Featured sellers surface on the marketplace home and directory. */
  featured: boolean;
  /** Fulfilment promise shown on the storefront. */
  dispatchHours: number;
  returnWindowDays: number;
}

/** Safe projection for client components — no tax id, no banking. */
export interface PublicSeller {
  id: string;
  slug: string;
  storeName: string;
  storeDescription: string;
  logoUrl?: string;
  bannerUrl?: string;
  gradient: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  departments: string[];
  joinedAt: string;
  featured: boolean;
  city: string;
  state: string;
  dispatchHours: number;
  returnWindowDays: number;
  verified: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Commission and money                                                       */
/* -------------------------------------------------------------------------- */

export type CommissionKind = "percentage" | "fixed" | "category";

export interface CommissionRule {
  id: string;
  kind: CommissionKind;
  label: string;
  /** Percentage points for `percentage` and `category`; minor units for `fixed`. */
  value: number;
  /** Required for `category`. */
  category?: string;
  /** Restrict to one seller; otherwise marketplace-wide. */
  sellerId?: string;
  active: boolean;
  priority: number;
}

export interface CommissionBreakdown {
  /** What the customer paid for the seller's lines. */
  gross: Cents;
  commission: Cents;
  /** Which rule decided it — shown in the seller's earnings statement. */
  ruleId: string;
  ruleLabel: string;
  /** Gross minus commission. */
  net: Cents;
}

export type LedgerKind =
  | "sale"
  | "commission"
  | "refund"
  | "commission-reversal"
  | "payout"
  | "adjustment";

export interface LedgerEntry {
  id: string;
  sellerId: string;
  kind: LedgerKind;
  /** Positive credits the seller, negative debits. */
  amount: Cents;
  currency: StoreCurrency;
  description: string;
  orderId?: string;
  orderReference?: string;
  payoutId?: string;
  createdAt: string;
}

export type PayoutStatus = "requested" | "approved" | "processing" | "paid" | "rejected";

export interface Payout {
  id: string;
  reference: string;
  sellerId: string;
  amount: Cents;
  currency: StoreCurrency;
  status: PayoutStatus;
  /** Where the money went. */
  destination: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  note?: string;
  /** On-chain transaction hash once settled. */
  transactionRef?: string;
}

export interface SellerBalance {
  /** Everything earned, net of commission, ever. */
  lifetimeEarnings: Cents;
  /** Commission the marketplace has taken. */
  lifetimeCommission: Cents;
  /** Already paid out. */
  paidOut: Cents;
  /** Requested and not yet settled. */
  pending: Cents;
  /** What can be withdrawn right now. */
  available: Cents;
}

/* -------------------------------------------------------------------------- */
/*  Messaging                                                                  */
/* -------------------------------------------------------------------------- */

export type MessageAuthorRole = "customer" | "seller" | "admin";

export interface MessageAttachment {
  id: string;
  name: string;
  /** Storage reference. Uploads land in object storage; this is the key. */
  ref: string;
  contentType: string;
  sizeBytes: number;
}

export interface Message {
  id: string;
  threadId: string;
  authorRole: MessageAuthorRole;
  authorId: string;
  authorName: string;
  body: string;
  attachments: MessageAttachment[];
  createdAt: string;
  readByCustomer: boolean;
  readBySeller: boolean;
}

export type ThreadKind = "question" | "order" | "return" | "general";

export interface MessageThread {
  id: string;
  kind: ThreadKind;
  subject: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  /** Set when the conversation is about a specific product or order. */
  productSlug?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "answered" | "closed";
  /** Public questions appear on the product page once answered. */
  visibility: "private" | "public";
}

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                    */
/* -------------------------------------------------------------------------- */

export type ReviewTarget = "product" | "seller";
export type ReviewStatus = "pending" | "published" | "rejected";

export interface MarketplaceReview {
  id: string;
  target: ReviewTarget;
  /** Product slug or seller id. */
  targetId: string;
  sellerId: string;
  authorId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  /** True when the author has a delivered order containing this product. */
  verifiedPurchase: boolean;
  orderId?: string;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationNote?: string;
  helpfulCount: number;
  /** The seller's public reply. */
  reply?: { body: string; at: string };
}

/* -------------------------------------------------------------------------- */
/*  Follows                                                                    */
/* -------------------------------------------------------------------------- */

export interface SellerFollow {
  sellerId: string;
  userId: string;
  followedAt: string;
}
