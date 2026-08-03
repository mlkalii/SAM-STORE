import "server-only";

import { randomUUID } from "node:crypto";

import { storeConfig } from "@/config/store";
import { STORE_CURRENCY } from "@/lib/commerce/types";
import type {
  PublicSeller,
  Seller,
  SellerStatus,
  VerificationKind,
  VerificationRecord,
  VerificationStatus,
} from "@/lib/marketplace/types";

/**
 * Seller registry.
 *
 * An in-memory map behind a narrow surface, exactly like every other store in
 * this project — swap the implementation for a table and nothing that calls it
 * changes. Seeded with the house store plus a handful of approved vendors so
 * the marketplace is reviewable on a cold boot.
 */

interface State {
  sellers: Map<string, Seller>;
  slugIndex: Map<string, string>;
  seeded: boolean;
}

const globalForSellers = globalThis as unknown as { __samruxSellers?: State };

/** The marketplace operator's own store. Always approved, never removable. */
export const HOUSE_SELLER_ID = "samrux-house";

const VERIFICATION_KINDS: VerificationKind[] = ["identity", "business", "tax", "banking"];

function verifiedSet(): VerificationRecord[] {
  return VERIFICATION_KINDS.map((kind) => ({
    kind,
    status: "verified" as VerificationStatus,
    submittedAt: "2026-01-04T09:00:00.000Z",
    reviewedAt: "2026-01-06T11:30:00.000Z",
    reviewedBy: "Nadia Owner",
  }));
}

function emptyVerification(): VerificationRecord[] {
  return VERIFICATION_KINDS.map((kind) => ({ kind, status: "not-started" as VerificationStatus }));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/* -------------------------------------------------------------------------- */
/*  Seed                                                                       */
/* -------------------------------------------------------------------------- */

interface SeedInput {
  id: string;
  storeName: string;
  description: string;
  gradient: string;
  city: string;
  state: string;
  contactName: string;
  email: string;
  phone: string;
  departments: string[];
  rating: number;
  reviewCount: number;
  followerCount: number;
  joinedAt: string;
  featured: boolean;
  status?: SellerStatus;
  commissionOverride?: number;
}

const SEED_SELLERS: SeedInput[] = [
  {
    id: HOUSE_SELLER_ID,
    storeName: "SAMRUX Official",
    description:
      "The house store. Every department, stocked and shipped by SAMRUX LLC from St. Petersburg, Florida, with the full marketplace guarantee behind it.",
    gradient: "from-neutral-900 to-neutral-700",
    city: storeConfig.address.city,
    state: storeConfig.address.state,
    contactName: "SAMRUX Operations",
    email: storeConfig.supportEmail,
    phone: storeConfig.phone,
    departments: [],
    rating: 4.8,
    reviewCount: 12480,
    followerCount: 38200,
    joinedAt: "2025-11-01T00:00:00.000Z",
    featured: true,
    commissionOverride: 0,
  },
  {
    id: "seller-northline",
    storeName: "Northline Supply",
    description:
      "Workshop tools, automotive kit and hardware chosen by people who use it daily. Everything tested before it is listed, and nothing stocked that we would not fit ourselves.",
    gradient: "from-amber-900 to-orange-700",
    city: "Columbus",
    state: "OH",
    contactName: "Dana Whitfield",
    email: "hello@northlinesupply.example",
    phone: "+1 (614) 555-0142",
    departments: ["tools-home-improvement", "automotive", "office-products"],
    rating: 4.7,
    reviewCount: 2140,
    followerCount: 5820,
    joinedAt: "2026-01-12T00:00:00.000Z",
    featured: true,
  },
  {
    id: "seller-halcyon",
    storeName: "Halcyon Home",
    description:
      "Kitchen and home goods with a long life expectancy. We favour repairable designs, honest materials and manufacturers who still sell spare parts a decade later.",
    gradient: "from-emerald-900 to-teal-700",
    city: "Portland",
    state: "OR",
    contactName: "Ines Cardoso",
    email: "studio@halcyonhome.example",
    phone: "+1 (503) 555-0188",
    departments: ["home-kitchen", "grocery-gourmet-food"],
    rating: 4.9,
    reviewCount: 1685,
    followerCount: 7410,
    joinedAt: "2026-02-03T00:00:00.000Z",
    featured: true,
  },
  {
    id: "seller-vantage",
    storeName: "Vantage Electronics",
    description:
      "Audio, displays and computing from a team that has been in consumer electronics for twenty years. Every unit is bench-checked and every warranty is honoured in-house.",
    gradient: "from-sky-900 to-indigo-700",
    city: "Austin",
    state: "TX",
    contactName: "Marcus Aday",
    email: "support@vantage-electronics.example",
    phone: "+1 (512) 555-0170",
    departments: ["electronics", "computers-accessories", "mobile-phones"],
    rating: 4.6,
    reviewCount: 3920,
    followerCount: 11240,
    joinedAt: "2026-01-28T00:00:00.000Z",
    featured: true,
  },
  {
    id: "seller-meridian",
    storeName: "Meridian Wellbeing",
    description:
      "Beauty, wellness and personal care with full ingredient disclosure. Nothing tested on animals, nothing listed without a certificate of analysis on file.",
    gradient: "from-rose-900 to-pink-700",
    city: "Nashville",
    state: "TN",
    contactName: "Priya Raman",
    email: "care@meridianwellbeing.example",
    phone: "+1 (615) 555-0119",
    departments: ["beauty-personal-care", "health-wellness"],
    rating: 4.8,
    reviewCount: 2760,
    followerCount: 9130,
    joinedAt: "2026-02-19T00:00:00.000Z",
    featured: false,
  },
  {
    id: "seller-fieldcrest",
    storeName: "Fieldcrest Outdoors",
    description:
      "Sport, outdoor and pet gear built for weather. We field-test in the Rockies before anything reaches the catalogue, and we publish what failed.",
    gradient: "from-lime-900 to-green-700",
    city: "Denver",
    state: "CO",
    contactName: "Tomas Berg",
    email: "crew@fieldcrestoutdoors.example",
    phone: "+1 (720) 555-0163",
    departments: ["sports-outdoors", "pet-supplies"],
    rating: 4.5,
    reviewCount: 1490,
    followerCount: 4380,
    joinedAt: "2026-03-08T00:00:00.000Z",
    featured: false,
  },
  {
    id: "seller-lumen",
    storeName: "Lumen & Co",
    description:
      "Baby, toys and family essentials. Safety certificates for every listing, and age guidance written by a paediatric nurse rather than a marketing team.",
    gradient: "from-violet-900 to-purple-700",
    city: "Minneapolis",
    state: "MN",
    contactName: "Clara Nyström",
    email: "hello@lumenandco.example",
    phone: "+1 (612) 555-0127",
    departments: ["baby-products", "toys-games", "fashion"],
    rating: 4.7,
    reviewCount: 2015,
    followerCount: 6290,
    joinedAt: "2026-03-22T00:00:00.000Z",
    featured: false,
  },
  {
    id: "seller-atlas-pending",
    storeName: "Atlas Trading Group",
    description:
      "General merchandise importer applying to join the marketplace. Application submitted and awaiting review.",
    gradient: "from-slate-900 to-slate-700",
    city: "Newark",
    state: "NJ",
    contactName: "Owen Marsh",
    email: "apply@atlastrading.example",
    phone: "+1 (973) 555-0104",
    departments: [],
    rating: 0,
    reviewCount: 0,
    followerCount: 0,
    joinedAt: "2026-07-18T00:00:00.000Z",
    featured: false,
    status: "pending",
  },
];

function seedSeller(input: SeedInput): Seller {
  const approved = (input.status ?? "approved") === "approved";

  return {
    id: input.id,
    slug: slugify(input.storeName),
    ownerUserId: `owner-${input.id}`,
    storeName: input.storeName,
    storeDescription: input.description,
    gradient: input.gradient,
    business: {
      legalName: input.id === HOUSE_SELLER_ID ? storeConfig.legalName : `${input.storeName} LLC`,
      type: "llc",
      taxId: `**-***${input.id.slice(-4).toUpperCase()}`,
      addressLine1: input.id === HOUSE_SELLER_ID ? storeConfig.address.line1 : "1 Commerce Way",
      addressLine2: input.id === HOUSE_SELLER_ID ? storeConfig.address.line2 : undefined,
      city: input.city,
      state: input.state,
      postcode: input.id === HOUSE_SELLER_ID ? storeConfig.address.postcode : "00000",
      country: "US",
    },
    contact: { name: input.contactName, email: input.email, phone: input.phone },
    banking: approved
      ? {
          accountName: input.storeName,
          accountLast4: input.id.slice(-4).replace(/\D/g, "0").padStart(4, "0"),
          walletAddress: `T${input.id.replace(/[^a-z0-9]/gi, "").slice(0, 20).padEnd(20, "x")}`,
          currency: STORE_CURRENCY,
        }
      : undefined,
    verification: approved ? verifiedSet() : emptyVerification(),
    status: input.status ?? "approved",
    statusChangedAt: input.joinedAt,
    commissionOverride: input.commissionOverride,
    rating: input.rating,
    reviewCount: input.reviewCount,
    followerCount: input.followerCount,
    departments: input.departments,
    joinedAt: input.joinedAt,
    featured: input.featured,
    dispatchHours: 24,
    returnWindowDays: 30,
  };
}

function state(): State {
  if (!globalForSellers.__samruxSellers) {
    const sellers = new Map<string, Seller>();
    const slugIndex = new Map<string, string>();

    for (const input of SEED_SELLERS) {
      const seller = seedSeller(input);
      sellers.set(seller.id, seller);
      slugIndex.set(seller.slug, seller.id);
    }

    globalForSellers.__samruxSellers = { sellers, slugIndex, seeded: true };
  }
  return globalForSellers.__samruxSellers;
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                      */
/* -------------------------------------------------------------------------- */

export interface CreateSellerInput {
  ownerUserId: string;
  storeName: string;
  storeDescription: string;
  logoUrl?: string;
  bannerUrl?: string;
  business: Seller["business"];
  contact: Seller["contact"];
}

const GRADIENTS = [
  "from-sky-900 to-indigo-700",
  "from-emerald-900 to-teal-700",
  "from-amber-900 to-orange-700",
  "from-rose-900 to-pink-700",
  "from-violet-900 to-purple-700",
  "from-lime-900 to-green-700",
];

export const sellerStore = {
  all(): Seller[] {
    return [...state().sellers.values()];
  },

  /** Only sellers a shopper may see. */
  approved(): Seller[] {
    return this.all().filter((seller) => seller.status === "approved");
  },

  find(id: string): Seller | undefined {
    return state().sellers.get(id);
  },

  findBySlug(slug: string): Seller | undefined {
    const id = state().slugIndex.get(slug);
    return id ? state().sellers.get(id) : undefined;
  },

  /** A customer account owns at most one seller. */
  findByOwner(userId: string): Seller | undefined {
    return this.all().find((seller) => seller.ownerUserId === userId);
  },

  create(input: CreateSellerInput): Seller {
    const id = `seller-${randomUUID().slice(0, 8)}`;

    // Slugs must stay unique: two "Northline Supply" applications cannot share
    // a storefront URL.
    const base = slugify(input.storeName) || id;
    let slug = base;
    let attempt = 2;
    while (state().slugIndex.has(slug)) slug = `${base}-${attempt++}`;

    const seller: Seller = {
      id,
      slug,
      ownerUserId: input.ownerUserId,
      storeName: input.storeName,
      storeDescription: input.storeDescription,
      logoUrl: input.logoUrl,
      bannerUrl: input.bannerUrl,
      gradient: GRADIENTS[state().sellers.size % GRADIENTS.length],
      business: input.business,
      contact: input.contact,
      verification: emptyVerification(),
      status: "pending",
      statusChangedAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      followerCount: 0,
      departments: [],
      joinedAt: new Date().toISOString(),
      featured: false,
      dispatchHours: 48,
      returnWindowDays: 30,
    };

    state().sellers.set(id, seller);
    state().slugIndex.set(slug, id);
    return seller;
  },

  update(id: string, patch: Partial<Omit<Seller, "id" | "slug">>): Seller | undefined {
    const existing = state().sellers.get(id);
    if (!existing) return undefined;

    const next = { ...existing, ...patch };
    state().sellers.set(id, next);
    return next;
  },

  setStatus(
    id: string,
    status: SellerStatus,
    options: { note?: string; by?: string } = {},
  ): Seller | undefined {
    return this.update(id, {
      status,
      statusNote: options.note,
      statusChangedBy: options.by,
      statusChangedAt: new Date().toISOString(),
    });
  },

  setVerification(
    id: string,
    kind: VerificationKind,
    status: VerificationStatus,
    options: { documentRef?: string; note?: string; by?: string } = {},
  ): Seller | undefined {
    const seller = state().sellers.get(id);
    if (!seller) return undefined;

    const now = new Date().toISOString();
    const verification = seller.verification.map((record) =>
      record.kind === kind
        ? {
            ...record,
            status,
            documentRef: options.documentRef ?? record.documentRef,
            note: options.note ?? record.note,
            submittedAt: status === "submitted" ? now : record.submittedAt,
            reviewedAt: status === "verified" || status === "rejected" ? now : record.reviewedAt,
            reviewedBy: options.by ?? record.reviewedBy,
          }
        : record,
    );

    return this.update(id, { verification });
  },

  /** Recomputed whenever reviews change, so the storefront never lies. */
  setRating(id: string, rating: number, reviewCount: number) {
    return this.update(id, { rating, reviewCount });
  },

  setFollowerCount(id: string, followerCount: number) {
    return this.update(id, { followerCount });
  },

  setDepartments(id: string, departments: string[]) {
    return this.update(id, { departments });
  },
};

/* -------------------------------------------------------------------------- */
/*  Projections                                                                */
/* -------------------------------------------------------------------------- */

export function isFullyVerified(seller: Seller) {
  return seller.verification.every((record) => record.status === "verified");
}

/** Everything a shopper may see. Never carries tax id or banking detail. */
export function toPublicSeller(seller: Seller): PublicSeller {
  return {
    id: seller.id,
    slug: seller.slug,
    storeName: seller.storeName,
    storeDescription: seller.storeDescription,
    logoUrl: seller.logoUrl,
    bannerUrl: seller.bannerUrl,
    gradient: seller.gradient,
    rating: seller.rating,
    reviewCount: seller.reviewCount,
    followerCount: seller.followerCount,
    departments: seller.departments,
    joinedAt: seller.joinedAt,
    featured: seller.featured,
    city: seller.business.city,
    state: seller.business.state,
    dispatchHours: seller.dispatchHours,
    returnWindowDays: seller.returnWindowDays,
    verified: isFullyVerified(seller),
  };
}

/** Two initials for the avatar when a seller has no logo. */
export function sellerInitials(storeName: string) {
  return storeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
