import "server-only";

import { getCollection, inCollection } from "@/config/collections";
import { getAllProducts, getCatalog } from "@/lib/product-source";
import type { Product, ProductRef } from "@/types";

/**
 * The application's product API.
 *
 * Every page, route handler and component reads products through this module.
 * It never touches `catalog.json` directly — `lib/product-source` decides
 * whether that data comes from the bundled file, a store-wide feed, or a
 * per-department feed. Swapping in a real inventory API means configuring
 * `src/config/data-source.ts`, not editing this file.
 *
 * All helpers are async because a real source will be. `cache()` inside the
 * source layer means resolving it many times per request costs one lookup.
 */

export async function getCatalogMeta() {
  const snapshot = await getCatalog();
  return {
    currency: snapshot.currency,
    count: snapshot.products.length,
    sources: snapshot.sources,
  };
}

export async function getProducts() {
  return getAllProducts();
}

export async function getProduct(slug: string) {
  const products = await getAllProducts();
  return products.find((product) => product.slug === slug);
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const products = await getAllProducts();
  const wanted = new Set(slugs);
  const found = products.filter((product) => wanted.has(product.slug));
  // Preserve the caller's ordering (wishlist / compare / recently viewed).
  return slugs
    .map((slug) => found.find((product) => product.slug === slug))
    .filter((product): product is Product => product !== undefined);
}

export async function getProductsByCategory(category: string) {
  const products = await getAllProducts();
  return products.filter((product) => product.category === category);
}

function take<T>(list: T[], limit?: number) {
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export async function getFeatured(limit?: number) {
  const products = await getAllProducts();
  return take(
    products.filter((product) => product.featured),
    limit,
  );
}

export async function getBestSellers(limit?: number) {
  const products = await getAllProducts();
  return take(
    products.filter((product) => product.bestSeller).sort((a, b) => b.reviewCount - a.reviewCount),
    limit,
  );
}

export async function getNewArrivals(limit?: number) {
  const products = await getAllProducts();
  return take(
    products
      .filter((product) => product.newArrival)
      .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt)),
    limit,
  );
}

export async function getTrending(limit?: number) {
  const products = await getAllProducts();
  return take(
    products.filter((product) => product.trending).sort((a, b) => b.rating - a.rating),
    limit,
  );
}

export async function getDeals(limit?: number) {
  const products = await getAllProducts();
  return take(
    products
      .filter((product) => product.discountPercent > 0 && product.stockStatus !== "out_of_stock")
      .sort((a, b) => b.discountPercent - a.discountPercent || b.rating - a.rating),
    limit,
  );
}

export async function getRelated(product: Product, limit = 4) {
  const products = await getAllProducts();
  return products
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .sort((a, b) => {
      const aSub = a.subcategory === product.subcategory ? 0 : 1;
      const bSub = b.subcategory === product.subcategory ? 0 : 1;
      return aSub - bSub || b.rating - a.rating;
    })
    .slice(0, limit);
}

/**
 * Bundle companions: same department, different type, cheaper than the anchor
 * and actually in stock — the shape a real "bought together" row takes.
 */
export async function getBundleCompanions(product: Product, limit = 2) {
  const products = await getAllProducts();
  return products
    .filter(
      (item) =>
        item.slug !== product.slug &&
        item.category === product.category &&
        item.subcategory !== product.subcategory &&
        item.stockStatus !== "out_of_stock" &&
        item.price < product.price,
    )
    .sort((a, b) => b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10))
    .slice(0, limit);
}

/**
 * Cross-sell: strong products from *other* departments in a comparable price
 * band. Deliberately not same-category — that is what "related" already covers.
 */
export async function getRecommended(product: Product, limit = 8) {
  const products = await getAllProducts();
  const low = product.price * 0.4;
  const high = product.price * 2.2;

  return products
    .filter(
      (item) =>
        item.category !== product.category &&
        item.stockStatus !== "out_of_stock" &&
        item.price >= low &&
        item.price <= high,
    )
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/** Upsell: the next tier up of the same concept, if we stock one. */
export async function getUpsell(product: Product) {
  const products = await getAllProducts();
  const base = product.name.replace(/\s+(Lite|Pro|Max)$/, "");

  return products
    .filter(
      (item) =>
        item.slug !== product.slug &&
        item.category === product.category &&
        item.name.replace(/\s+(Lite|Pro|Max)$/, "") === base &&
        item.price > product.price &&
        item.stockStatus !== "out_of_stock",
    )
    .sort((a, b) => a.price - b.price)[0];
}

/** Products that share a brand — shown as "more from this brand" on the PDP. */
export async function getByBrand(brand: string, excludeSlug?: string, limit = 4) {
  const products = await getAllProducts();
  return products
    .filter((product) => product.brand === brand && product.slug !== excludeSlug)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export async function getAllBrands() {
  const products = await getAllProducts();
  return [...new Set(products.map((product) => product.brand))].sort();
}

/** The compact shape stored by the wishlist / compare / recently-viewed lists. */
export function toProductRef(product: Product, addedAt = 0): ProductRef {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    ...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {}),
    image: product.images[0]?.thumbnail ?? "",
    gradient: product.gradient,
    category: product.category,
    rating: product.rating,
    addedAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Query engine — shared by the shop, every category page, and search.        */
/* -------------------------------------------------------------------------- */

export const SORT_OPTIONS = [
  { key: "relevance", label: "Relevance" },
  { key: "popular", label: "Most popular" },
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "discount", label: "Biggest saving" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["key"];

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((option) => option.key === value);
}

export interface ProductQuery {
  q?: string;
  category?: string;
  subcategories?: string[];
  brands?: string[];
  /** Cents, inclusive. */
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  /** Restrict to a curated slice before filtering. */
  scope?: "all" | "deals" | "new" | "best-sellers" | "trending";
  /** Cross-department edit — see `config/collections`. */
  collection?: string;
}

export interface Facet {
  value: string;
  count: number;
}

export interface ProductQueryResult {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  facets: {
    brands: Facet[];
    subcategories: Facet[];
    categories: Facet[];
    priceRange: { min: number; max: number };
  };
}

function searchScore(product: Product, terms: string[]) {
  if (terms.length === 0) return 0;

  const name = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const sub = product.subcategory.toLowerCase();
  const sku = product.sku.toLowerCase();
  const blurb = product.shortDescription.toLowerCase();
  const tags = product.tags.join(" ").toLowerCase();

  let score = 0;
  for (const term of terms) {
    let hit = 0;
    if (name.startsWith(term)) hit += 12;
    if (name.includes(term)) hit += 8;
    if (brand.includes(term)) hit += 6;
    if (sub.includes(term)) hit += 4;
    if (sku.includes(term)) hit += 10;
    if (tags.includes(term)) hit += 2;
    if (blurb.includes(term)) hit += 1;
    // Every term must land somewhere, otherwise the product is not a match.
    if (hit === 0) return -1;
    score += hit;
  }

  // Nudge well-reviewed, in-stock items up when scores are otherwise equal.
  return (
    score + Math.min(product.reviewCount / 1000, 3) + (product.stockStatus === "in_stock" ? 1 : 0)
  );
}

function countBy(list: Product[], key: (product: Product) => string): Facet[] {
  const counts = new Map<string, number>();
  for (const product of list) {
    const value = key(product);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

async function scopedProducts(scope: ProductQuery["scope"]) {
  switch (scope) {
    case "deals":
      return getDeals();
    case "new":
      return getNewArrivals();
    case "best-sellers":
      return getBestSellers();
    case "trending":
      return getTrending();
    default:
      return getAllProducts();
  }
}

export async function queryProducts(query: ProductQuery = {}): Promise<ProductQueryResult> {
  const {
    q = "",
    category,
    subcategories = [],
    brands = [],
    minPrice,
    maxPrice,
    inStockOnly = false,
    onSaleOnly = false,
    sort = q ? "relevance" : "popular",
    page = 1,
    perPage = 24,
    scope = "all",
    collection,
  } = query;

  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

  // A collection narrows the *pool*, not the facets — it is the subject of the
  // page rather than a filter the shopper can untick.
  const edit = collection ? getCollection(collection) : undefined;

  const base = (await scopedProducts(scope)).filter((product) => {
    if (category && product.category !== category) return false;
    if (edit && !inCollection(product, edit)) return false;
    return true;
  });

  // Facets describe the pool *before* the narrowing filters, so a shopper can
  // always see what unticking a box would give them back.
  const scored = base
    .map((product) => ({ product, score: searchScore(product, terms) }))
    .filter((entry) => entry.score >= 0);

  const matched = scored.map((entry) => entry.product);

  const filtered = scored.filter(({ product }) => {
    if (subcategories.length && !subcategories.includes(product.subcategory)) return false;
    if (brands.length && !brands.includes(product.brand)) return false;
    if (typeof minPrice === "number" && product.price < minPrice) return false;
    if (typeof maxPrice === "number" && product.price > maxPrice) return false;
    if (inStockOnly && product.stockStatus === "out_of_stock") return false;
    if (onSaleOnly && product.discountPercent <= 0) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "relevance":
        return b.score - a.score || b.product.reviewCount - a.product.reviewCount;
      case "new":
        return b.product.releasedAt.localeCompare(a.product.releasedAt);
      case "price-asc":
        return a.product.price - b.product.price;
      case "price-desc":
        return b.product.price - a.product.price;
      case "discount":
        return b.product.discountPercent - a.product.discountPercent;
      default:
        return b.product.reviewCount - a.product.reviewCount || b.product.rating - a.product.rating;
    }
  });

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * perPage;

  const prices = matched.map((product) => product.price);

  return {
    items: sorted.slice(start, start + perPage).map((entry) => entry.product),
    total,
    page: safePage,
    perPage,
    pageCount,
    facets: {
      brands: countBy(matched, (product) => product.brand),
      subcategories: countBy(matched, (product) => product.subcategory),
      categories: countBy(matched, (product) => product.category),
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    },
  };
}

/** Lightweight suggestions for the header search field. */
export async function suggestProducts(q: string, limit = 6) {
  if (!q.trim()) return [];
  const result = await queryProducts({ q, sort: "relevance", perPage: limit });
  return result.items;
}

/** Brand names matching a query — powers brand rows in autocomplete. */
export async function suggestBrands(q: string, limit = 4) {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];

  const products = await getAllProducts();
  const counts = new Map<string, number>();
  for (const product of products) {
    if (product.brand.toLowerCase().includes(needle)) {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
