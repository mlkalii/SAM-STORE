/**
 * Where product data comes from.
 *
 * Both settings below are intentionally EMPTY. While they are empty the app
 * serves the bundled catalogue at `src/data/catalog.json`. Fill one in and the
 * data layer switches over — no other file needs to change.
 *
 * ── Store-wide feed ───────────────────────────────────────────────────────
 *   PRODUCT_DATA_SOURCE = "https://your-api.example.com/products"
 *   PRODUCT_DATA_SOURCE = "https://your-cdn.example.com/inventory.csv"
 *   PRODUCT_DATA_SOURCE = "/feeds/inventory.json"      // served from /public
 *
 * ── Per-department feed ───────────────────────────────────────────────────
 *   Set `sourceUrl` on any entry in `src/data/categories.ts`. A department with
 *   a feed replaces only its own products; the rest keep using the fallback.
 *
 * Supported out of the box: JSON arrays, JSON objects with a `products` /
 * `items` / `data` array, and CSV with a header row. Anything else: map it in
 * `lib/product-source/normalize.ts` — that is the single translation point
 * between a supplier's shape and the app's `Product` type.
 *
 * Nothing here hardcodes a third-party site.
 */
export const PRODUCT_DATA_SOURCE = "";

/** Fallback used whenever a feed is unset, unreachable, or returns nothing. */
export const FALLBACK_TO_BUNDLED_CATALOG = true;

/** Seconds to cache a remote feed. 0 disables caching. */
export const PRODUCT_SOURCE_REVALIDATE_SECONDS = 300;

/** Abort a feed request that takes longer than this. */
export const PRODUCT_SOURCE_TIMEOUT_MS = 8000;
