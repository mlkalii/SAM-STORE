import "server-only";

import { logger } from "@/lib/observability/logger";

import { cache } from "react";

import {
  FALLBACK_TO_BUNDLED_CATALOG,
  PRODUCT_DATA_SOURCE,
  PRODUCT_SOURCE_REVALIDATE_SECONDS,
  PRODUCT_SOURCE_TIMEOUT_MS,
} from "@/config/data-source";
import catalog from "@/data/catalog.json";
import { categories } from "@/data/categories";
import { extractRecords, isCsv, parseCsv } from "@/lib/product-source/parse-feed";
import { normalizeProduct } from "@/lib/product-source/normalize";
import { applyCatalogOverlays } from "@/lib/admin/catalog-store";
import { withSellers } from "@/lib/marketplace/assign";
import type { Product } from "@/types";

export interface CatalogSnapshot {
  products: Product[];
  currency: string;
  /** Which source each department was served from — surfaced in dev logs. */
  sources: { scope: string; from: "bundled" | "feed"; url?: string; count: number }[];
}

const bundled = catalog.products as unknown as Product[];

async function fetchFeed(url: string): Promise<Record<string, unknown>[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PRODUCT_SOURCE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json, text/csv;q=0.9, */*;q=0.5" },
      next: PRODUCT_SOURCE_REVALIDATE_SECONDS
        ? { revalidate: PRODUCT_SOURCE_REVALIDATE_SECONDS }
        : { revalidate: 0 },
    });

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    const text = await response.text();

    return isCsv(url, contentType) ? parseCsv(text) : extractRecords(JSON.parse(text));
  } finally {
    clearTimeout(timer);
  }
}

async function loadFeed(
  url: string,
  options: { categorySlug?: string; fallbackGradient?: string },
): Promise<Product[]> {
  try {
    const records = await fetchFeed(url);
    const products = records
      .map((record) => normalizeProduct(record, options))
      .filter((product): product is Product => product !== null);

    if (products.length === 0) throw new Error("feed returned no usable products");
    return products;
  } catch (error) {
    logger.warn("product_source.feed_failed", {
      url,
      error: (error as Error).message,
      fallback: FALLBACK_TO_BUNDLED_CATALOG,
    });
    return [];
  }
}

/**
 * Resolve the catalogue for this request.
 *
 * Precedence: store-wide `PRODUCT_DATA_SOURCE` → per-department `sourceUrl` →
 * the bundled `catalog.json`. `cache()` makes this once-per-request, so a page
 * calling five helpers still resolves the source a single time.
 */
export const getCatalog = cache(async (): Promise<CatalogSnapshot> => {
  const sources: CatalogSnapshot["sources"] = [];

  // 1. A store-wide feed replaces everything.
  if (PRODUCT_DATA_SOURCE.trim()) {
    const feed = await loadFeed(PRODUCT_DATA_SOURCE.trim(), {});
    if (feed.length > 0) {
      const products = withSellers(feed);
      sources.push({ scope: "store", from: "feed", url: PRODUCT_DATA_SOURCE, count: products.length });
      return { products, currency: catalog.currency, sources };
    }
    if (!FALLBACK_TO_BUNDLED_CATALOG) {
      return { products: [], currency: catalog.currency, sources };
    }
  }

  // 2. Otherwise start from the bundled catalogue and let any department with a
  //    feed replace its own slice.
  const withFeeds = categories.filter((category) => category.sourceUrl.trim() !== "");

  if (withFeeds.length === 0) {
    // Admin overlays are applied last, so an edit made in the dashboard is live
    // on the storefront without touching catalog.json.
    const products = withSellers(applyCatalogOverlays(bundled, "storefront"));
    sources.push({ scope: "store", from: "bundled", count: products.length });
    return { products, currency: catalog.currency, sources };
  }

  const replacements = await Promise.all(
    withFeeds.map(async (category) => ({
      category,
      products: await loadFeed(category.sourceUrl.trim(), {
        categorySlug: category.slug,
        fallbackGradient: category.gradient,
      }),
    })),
  );

  const replaced = new Map(
    replacements
      .filter((entry) => entry.products.length > 0)
      .map((entry) => [entry.category.slug, entry.products]),
  );

  const products = withSellers(
    applyCatalogOverlays(
      [
        ...bundled.filter((product) => !replaced.has(product.category)),
        ...[...replaced.values()].flat(),
      ],
      "storefront",
    ),
  );

  for (const category of categories) {
    const feed = replaced.get(category.slug);
    sources.push({
      scope: category.slug,
      from: feed ? "feed" : "bundled",
      ...(feed ? { url: category.sourceUrl } : {}),
      count: feed ? feed.length : bundled.filter((product) => product.category === category.slug).length,
    });
  }

  return { products, currency: catalog.currency, sources };
});

/** Convenience wrapper used by everything in `src/data/products.ts`. */
export const getAllProducts = cache(async (): Promise<Product[]> => {
  const snapshot = await getCatalog();
  return snapshot.products;
});

/** Admin view: includes drafts, archived and hidden products. */
export const getAdminProducts = cache(async (): Promise<Product[]> => {
  return withSellers(applyCatalogOverlays(bundled, "admin"));
});
