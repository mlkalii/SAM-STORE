export type Currency = "USD";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Lucide icon name, resolved through `components/common/category-icon`. */
  icon: string;
  /** Tailwind gradient utility used for banners and image fallbacks. */
  gradient: string;
  subcategories: string[];
  /**
   * Optional supplier feed for this department. Empty means "use the bundled
   * catalogue". Accepts a JSON or CSV endpoint — see `lib/product-source`.
   */
  sourceUrl: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  /** CSS colour for the swatch dot. Omitted for non-colour options (sizes). */
  hex?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  id: string;
  /** main | detail | in-use | angle | scale | packaging */
  view: string;
  alt: string;
  src: string;
  thumbnail: string;
  credit: string;
  /** Tailwind gradient shown while the photo loads, and if it fails. */
  gradient: string;
  width: number;
  height: number;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  /** ISO date (YYYY-MM-DD). */
  createdAt: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  specifications: ProductSpec[];
  /** Selling price in minor units (cents). */
  price: number;
  /** List price before discount, in cents. Absent when nothing is off. */
  compareAtPrice?: number;
  discountPercent: number;
  /** Aggregate score across all orders, not just the published reviews. */
  rating: number;
  reviewCount: number;
  /** A published sample of `reviewCount`. */
  reviews: ProductReview[];
  stockStatus: StockStatus;
  stockCount: number;
  category: string;
  subcategory: string;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  /** ISO date — drives "new arrivals" ordering. */
  releasedAt: string;
  gradient: string;
  warrantyMonths: number;
  returnWindowDays: number;
  dispatchHours: number;
  hasVideo: boolean;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
}

/**
 * A cart line carries its own snapshot so the client bundle never has to
 * import the full catalogue just to render the bag.
 */
export interface CartLineSnapshot {
  name: string;
  brand: string;
  price: number;
  gradient: string;
  image: string;
  variantLabel: string;
  category: string;
}

export interface CartLine {
  slug: string;
  variantId: string;
  quantity: number;
  snapshot: CartLineSnapshot;
}

export interface CartLineTotals extends CartLine {
  lineTotal: number;
}

/** Shared shape for wishlist / compare / recently-viewed entries. */
export interface ProductRef {
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  gradient: string;
  category: string;
  rating: number;
  addedAt: number;
}

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}
