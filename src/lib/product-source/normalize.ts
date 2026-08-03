import type { Product, ProductImage, ProductReview, ProductVariant } from "@/types";

/**
 * THE translation point between a supplier's payload and the app's `Product`.
 *
 * If a feed uses different field names, map them here and nothing else in the
 * codebase has to change. Every field falls back to something renderable, so a
 * sparse feed still produces usable pages rather than runtime crashes.
 */

type Raw = Record<string, unknown>;

function str(raw: Raw, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function num(raw: Raw, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function bool(raw: Raw, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (/^(true|yes|1|y)$/i.test(value)) return true;
      if (/^(false|no|0|n)$/i.test(value)) return false;
    }
  }
  return fallback;
}

function list(raw: Raw, keys: string[]): string[] {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      return value
        .split(/\s*[|;\n]\s*/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Money can arrive as cents (1999) or as a decimal ("19.99"). */
function toCents(value: number, raw: Raw): number {
  const looksLikeDecimal =
    !Number.isInteger(value) || bool(raw, ["priceInDecimal", "price_is_decimal"], false);
  return Math.round(looksLikeDecimal ? value * 100 : value);
}

function normalizeImages(raw: Raw, product: { slug: string; name: string; gradient: string }): ProductImage[] {
  const sources = list(raw, ["images", "image_urls", "imageUrls", "gallery", "image", "image_url"]);
  if (sources.length === 0) return [];

  return sources.map((src, index) => ({
    id: `${product.slug}-${index}`,
    view: index === 0 ? "main" : `view-${index}`,
    alt: `${product.name} — image ${index + 1}`,
    src,
    thumbnail: src,
    credit: str(raw, ["imageCredit", "image_credit"], ""),
    gradient: product.gradient,
    width: num(raw, ["imageWidth"], 1600),
    height: num(raw, ["imageHeight"], 1600),
  }));
}

function normalizeVariants(raw: Raw): ProductVariant[] {
  const value = raw.variants ?? raw.options;
  if (Array.isArray(value) && value.length > 0) {
    return value.map((entry, index) => {
      if (typeof entry === "string") {
        return { id: slugify(entry) || `v${index}`, label: entry };
      }
      const record = entry as Raw;
      const label = str(record, ["label", "name", "title"], `Option ${index + 1}`);
      const hex = str(record, ["hex", "color", "colour"], "");
      return {
        id: str(record, ["id", "sku", "value"], slugify(label) || `v${index}`),
        label,
        ...(hex ? { hex } : {}),
      };
    });
  }
  return [{ id: "standard", label: "Standard" }];
}

function normalizeReviews(raw: Raw, slug: string): ProductReview[] {
  const value = raw.reviews;
  if (!Array.isArray(value)) return [];

  return value.map((entry, index) => {
    const record = entry as Raw;
    return {
      id: str(record, ["id"], `${slug}-r${index + 1}`),
      author: str(record, ["author", "name", "reviewer"], "Verified buyer"),
      rating: Math.min(5, Math.max(1, num(record, ["rating", "score", "stars"], 5))),
      title: str(record, ["title", "headline"], ""),
      body: str(record, ["body", "text", "content", "comment"], ""),
      createdAt: str(record, ["createdAt", "date", "created_at"], "").slice(0, 10),
      verifiedPurchase: bool(record, ["verifiedPurchase", "verified", "verified_purchase"], false),
      helpfulCount: num(record, ["helpfulCount", "helpful", "upvotes"], 0),
    };
  });
}

/**
 * Convert one supplier record into a `Product`. `categorySlug` is supplied when
 * the record came from a per-department feed and therefore has no category of
 * its own.
 */
export function normalizeProduct(
  raw: Raw,
  options: { categorySlug?: string; fallbackGradient?: string } = {},
): Product | null {
  const name = str(raw, ["name", "title", "product_name", "productName"]);
  if (!name) return null;

  const slug = str(raw, ["slug", "handle", "id", "sku"]) ? slugify(str(raw, ["slug", "handle", "id", "sku"])) : slugify(name);
  if (!slug) return null;

  const gradient = str(raw, ["gradient"], options.fallbackGradient ?? "from-slate-500 to-slate-700");
  const price = toCents(num(raw, ["price", "sale_price", "salePrice", "amount"]), raw);
  const compareRaw = num(raw, ["compareAtPrice", "compare_at_price", "list_price", "msrp", "rrp"], 0);
  const compareAtPrice = compareRaw > 0 ? toCents(compareRaw, raw) : undefined;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : num(raw, ["discountPercent", "discount"], 0);

  const stockCount = num(raw, ["stockCount", "stock", "quantity", "inventory"], 0);
  const stockStatusRaw = str(raw, ["stockStatus", "availability", "status"], "").toLowerCase();
  const stockStatus =
    stockStatusRaw.includes("out") || (stockStatusRaw === "" && stockCount === 0 && raw.stockCount !== undefined)
      ? "out_of_stock"
      : stockStatusRaw.includes("low") || (stockCount > 0 && stockCount < 10)
        ? "low_stock"
        : "in_stock";

  const base = { slug, name, gradient };

  return {
    id: str(raw, ["id", "sku"], slug),
    slug,
    name,
    brand: str(raw, ["brand", "manufacturer", "vendor"], "Unbranded"),
    sku: str(raw, ["sku", "mpn", "id"], slug.toUpperCase().slice(0, 16)),
    shortDescription: str(raw, ["shortDescription", "short_description", "summary", "subtitle"], ""),
    longDescription: str(raw, ["longDescription", "description", "body_html", "details"], ""),
    features: list(raw, ["features", "bullets", "highlights"]),
    specifications: Array.isArray(raw.specifications)
      ? (raw.specifications as Raw[]).map((spec) => ({
          label: str(spec, ["label", "name", "key"], ""),
          value: str(spec, ["value", "val"], ""),
        }))
      : [],
    price,
    ...(compareAtPrice ? { compareAtPrice } : {}),
    discountPercent,
    rating: num(raw, ["rating", "averageRating", "stars"], 0),
    reviewCount: num(raw, ["reviewCount", "reviews_count", "ratingCount"], 0),
    reviews: normalizeReviews(raw, slug),
    stockStatus,
    stockCount,
    category: options.categorySlug ?? slugify(str(raw, ["category", "department", "category_slug"], "uncategorised")),
    subcategory: str(raw, ["subcategory", "product_type", "type"], "General"),
    images: normalizeImages(raw, base),
    variants: normalizeVariants(raw),
    tags: list(raw, ["tags", "keywords"]),
    releasedAt: str(raw, ["releasedAt", "created_at", "published_at"], "").slice(0, 10) || "1970-01-01",
    gradient,
    warrantyMonths: num(raw, ["warrantyMonths", "warranty_months"], 24),
    returnWindowDays: num(raw, ["returnWindowDays", "return_days"], 30),
    dispatchHours: num(raw, ["dispatchHours", "dispatch_hours"], 48),
    hasVideo: bool(raw, ["hasVideo", "video"], false),
    featured: bool(raw, ["featured"], false),
    bestSeller: bool(raw, ["bestSeller", "best_seller"], false),
    newArrival: bool(raw, ["newArrival", "new_arrival", "is_new"], false),
    trending: bool(raw, ["trending"], false),
  };
}
