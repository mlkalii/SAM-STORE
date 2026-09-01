/**
 * Builds `src/data/catalog.json`.
 *
 *   node scripts/generate-catalog.mjs
 *
 * Sources:
 *   catalog-source.mjs            10 original departments × 10 concepts
 *   catalog-source-extra.mjs      +3 concepts for each of those
 *   catalog-source-tech.mjs       computers & accessories, mobile phones
 *   catalog-source-lifestyle.mjs  fashion, grocery, toys
 *   image-pool.mjs                curated, verified Unsplash photo IDs
 *   review-source.mjs             review copy pools
 *
 * 15 departments × 13 concepts × 4 tiers = 780 unique products.
 *
 * The output is fully deterministic — running it twice produces an identical
 * file — so the catalogue can be committed and reviewed like any other source.
 * Nothing in the app imports this script at runtime.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CATEGORY_SOURCE, VARIANT_SETS } from "./catalog-source.mjs";
import { EXTRA_CONCEPTS } from "./catalog-source-extra.mjs";
import { TECH_SOURCE } from "./catalog-source-tech.mjs";
import { EXTRA_VARIANT_SETS, LIFESTYLE_SOURCE } from "./catalog-source-lifestyle.mjs";
import { CATEGORY_IMAGE_POOL, STUDIO_IMAGE_POOL } from "./image-pool.mjs";
import { BODIES, CONTEXTS, REVIEWER_NAMES, TITLES } from "./review-source.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../src/data/catalog.json");

/** Fixed so regenerating never churns the diff. */
const CATALOG_DATE = new Date("2026-07-01T00:00:00.000Z");

/** Four tiers per concept, priced and specified differently. */
const TIERS = [
  {
    suffix: "Lite",
    multiplier: 0.68,
    warrantyMonths: 12,
    sku: "LT",
    reviewBase: 1400,
    note: "the pared-back configuration, for people who do not need the extras",
  },
  {
    suffix: "",
    multiplier: 1,
    warrantyMonths: 24,
    sku: "ST",
    reviewBase: 4200,
    note: "the standard configuration, and the one most people should buy",
  },
  {
    suffix: "Pro",
    multiplier: 1.45,
    warrantyMonths: 36,
    sku: "PR",
    reviewBase: 2200,
    note: "upgraded internals, better materials and a longer warranty",
  },
  {
    suffix: "Max",
    multiplier: 1.95,
    warrantyMonths: 60,
    sku: "MX",
    reviewBase: 900,
    note: "the flagship, with every option fitted and the longest cover we offer",
  },
];

const ALL_VARIANT_SETS = { ...VARIANT_SETS, ...EXTRA_VARIANT_SETS };

const CATEGORY_ORDER = [
  "electronics",
  "computers-accessories",
  "mobile-phones",
  "home-kitchen",
  "beauty-personal-care",
  "sports-outdoors",
  "pet-supplies",
  "baby-products",
  "office-products",
  "automotive",
  "tools-home-improvement",
  "fashion",
  "grocery-gourmet-food",
  "toys-games",
];

const CATEGORY_NAMES = {
  electronics: "Electronics",
  "computers-accessories": "Computers & Accessories",
  "mobile-phones": "Mobile Phones & Accessories",
  "home-kitchen": "Home & Kitchen",
  "beauty-personal-care": "Beauty & Personal Care",
  "sports-outdoors": "Sports & Outdoors",
  "pet-supplies": "Pet Supplies",
  "baby-products": "Baby Products",
  "office-products": "Office Products",
  automotive: "Automotive",
  "tools-home-improvement": "Tools & Home Improvement",
  fashion: "Fashion",
  "grocery-gourmet-food": "Grocery & Gourmet Food",
  "toys-games": "Toys & Games",
};

/** Merge the base departments with their extra concepts, then the new ones. */
function buildSources() {
  const merged = {};

  for (const [slug, source] of Object.entries(CATEGORY_SOURCE)) {
    merged[slug] = {
      ...source,
      concepts: [...source.concepts, ...(EXTRA_CONCEPTS[slug] ?? [])],
    };
  }
  for (const [slug, source] of Object.entries({ ...TECH_SOURCE, ...LIFESTYLE_SOURCE })) {
    merged[slug] = source;
  }

  return merged;
}

const SOURCES = buildSources();
const DISCOUNTS = [0, 0, 0, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40];

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and stable across Node versions. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function intBetween(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

/** Prices are cents and always end in .99. */
function priceCents(base, multiplier) {
  const dollars = Math.round((base * multiplier) / 100);
  return Math.max(199, dollars * 100 - 1);
}

function initials(text) {
  return text
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/* -------------------------------------------------------------------------- */
/*  Images                                                                     */
/* -------------------------------------------------------------------------- */

/** Six photos per product: one lead image plus five gallery shots. */
const IMAGES_PER_PRODUCT = 6;
const IMAGE_VIEWS = ["main", "detail", "in-use", "angle", "scale", "packaging"];

/**
 * Unsplash serves a resized original; `next/image` re-encodes from there, so we
 * only ask for a source large enough for the biggest layout slot.
 */
function unsplashUrl(id, width = 1600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/**
 * Primary catalogue framing: the photo is letterboxed onto a pure-white
 * square (`fill=solid&fill-color=ffffff`), so every main image in the store
 * shares the same canvas, the same centring and the same aspect ratio —
 * one professional catalogue, not two hundred crops.
 */
function studioUrl(id, size = 1600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=fill&fill=solid&fill-color=ffffff&w=${size}&h=${size}&q=80`;
}

function buildImages(categorySlug, indexInCategory, product) {
  const studio = STUDIO_IMAGE_POOL[categorySlug] ?? [];
  const gallery = CATEGORY_IMAGE_POOL[categorySlug] ?? [];
  if (studio.length === 0) throw new Error(`No studio pool for "${categorySlug}"`);
  if (gallery.length === 0) throw new Error(`No gallery pool for "${categorySlug}"`);

  return Array.from({ length: IMAGES_PER_PRODUCT }, (_, offset) => {
    const view = IMAGE_VIEWS[offset];

    // Slot 0 is the catalogue shot: studio pool, white square framing.
    // Slots 1–5 are lifestyle/detail photography from the gallery pool; a
    // stride of three keeps neighbouring products from sharing shots.
    const isMain = offset === 0;
    const photoId = isMain
      ? studio[indexInCategory % studio.length]
      : gallery[(indexInCategory * 3 + offset) % gallery.length];

    return {
      id: `${product.slug}-${view}`,
      view,
      alt: isMain
        ? `${product.brand} ${product.name} — studio product photo on white`
        : `${product.brand} ${product.name} — ${view.replace("-", " ")} view`,
      src: isMain ? studioUrl(photoId) : unsplashUrl(photoId),
      thumbnail: isMain ? studioUrl(photoId, 400) : unsplashUrl(photoId, 400),
      credit: `Photo via Unsplash (${photoId})`,
      // Kept as the paint-before-load backdrop and the offline fallback.
      gradient: product.gradient,
      width: 1600,
      height: 1600,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                    */
/* -------------------------------------------------------------------------- */

function ratingFor(headline, roll) {
  if (headline >= 4.5) return roll < 0.78 ? 5 : roll < 0.95 ? 4 : 3;
  if (headline >= 4.1) return roll < 0.5 ? 5 : roll < 0.85 ? 4 : roll < 0.96 ? 3 : 2;
  return roll < 0.3 ? 5 : roll < 0.62 ? 4 : roll < 0.9 ? 3 : 2;
}

function buildReviews(product, random) {
  const count = intBetween(random, 3, 8);
  const usedNames = new Set();

  return Array.from({ length: count }, (_, index) => {
    // Ratings cluster around the product's headline score.
    const rating = ratingFor(product.rating, random());

    let author = pick(random, REVIEWER_NAMES);
    let guard = 0;
    while (usedNames.has(author) && guard < 12) {
      author = pick(random, REVIEWER_NAMES);
      guard += 1;
    }
    usedNames.add(author);

    const daysAgo = intBetween(random, 2, 400);
    const body = pick(random, BODIES[rating]);
    const withContext = random() < 0.45 ? `${body} ${pick(random, CONTEXTS)}` : body;

    return {
      id: `${product.slug}-r${index + 1}`,
      author,
      rating,
      title: pick(random, TITLES[rating]),
      body: withContext,
      createdAt: new Date(CATALOG_DATE.getTime() - daysAgo * 86400000)
        .toISOString()
        .slice(0, 10),
      // Most reviews come from orders we can match; a minority do not.
      verifiedPurchase: random() < 0.86,
      helpfulCount: intBetween(random, 0, 240),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildLongDescription(concept, brand, tier, categoryName) {
  const opening = `${concept.blurb} Built by ${brand} for the ${categoryName.toLowerCase()} range, this is ${tier.note}.`;
  const middle = `We specify it because the parts that usually fail first — the ones you never see on a spec sheet — are the ones ${brand} over-engineers. ${concept.features[0]}, and ${concept.features[1].charAt(0).toLowerCase()}${concept.features[1].slice(1)}.`;
  const close =
    "Every unit is checked before it leaves the warehouse, ships within 48 hours, and is covered by a 30-day no-questions return window. Spare parts and consumables stay available long after the model is superseded.";
  return `${opening}\n\n${middle}\n\n${close}`;
}

/* -------------------------------------------------------------------------- */
/*  Build                                                                      */
/* -------------------------------------------------------------------------- */

const products = [];
const seenSlugs = new Set();
let globalIndex = 0;

for (const categorySlug of CATEGORY_ORDER) {
  const source = SOURCES[categorySlug];
  if (!source) throw new Error(`No source data for category "${categorySlug}"`);

  const categoryName = CATEGORY_NAMES[categorySlug];
  const perCategory = [];

  source.concepts.forEach((concept, conceptIndex) => {
    TIERS.forEach((tier, tierIndex) => {
      const name = tier.suffix ? `${concept.name} ${tier.suffix}` : concept.name;
      // Stride 5 is co-prime with the 8-brand pools, so consecutive concepts
      // never land on the same brand for the same tier.
      const brand = source.brands[(conceptIndex * 5 + tierIndex) % source.brands.length];
      const seed = hash(`${categorySlug}:${name}:${brand}`);
      const random = rng(seed);

      let slug = slugify(`${brand} ${name}`);
      if (seenSlugs.has(slug)) slug = `${slug}-${categorySlug}`;
      if (seenSlugs.has(slug)) slug = `${slug}-${globalIndex}`;
      seenSlugs.add(slug);

      const price = priceCents(concept.price, tier.multiplier);
      const discountPercent = pick(random, DISCOUNTS);
      const compareAtPrice =
        discountPercent > 0
          ? Math.round(price / (1 - discountPercent / 100) / 100) * 100 - 1
          : undefined;

      const rating = Number((3.7 + random() * 1.2).toFixed(1));
      const reviewCount = intBetween(random, 12, tier.reviewBase);

      const stockRoll = random();
      const stockStatus =
        stockRoll < 0.05 ? "out_of_stock" : stockRoll < 0.18 ? "low_stock" : "in_stock";
      const stockCount =
        stockStatus === "out_of_stock"
          ? 0
          : stockStatus === "low_stock"
            ? intBetween(random, 1, 9)
            : intBetween(random, 20, 640);

      const ageDays = intBetween(random, 3, 620);
      const releasedAt = new Date(CATALOG_DATE.getTime() - ageDays * 86400000)
        .toISOString()
        .slice(0, 10);

      const variantSet = ALL_VARIANT_SETS[concept.variants] ?? null;
      const variants = variantSet
        ? variantSet.map((option) => ({ ...option }))
        : [{ id: "standard", label: "Standard" }];

      const gradient = source.gradients[conceptIndex % source.gradients.length];
      const indexInCategory = perCategory.length;
      const images = buildImages(categorySlug, indexInCategory, { slug, name, brand, gradient });

      const sku = [
        categorySlug.slice(0, 3).toUpperCase(),
        initials(concept.name),
        String(conceptIndex + 1).padStart(2, "0"),
        tier.sku,
      ].join("-");

      const product = {
        id: `p-${String(globalIndex + 1).padStart(4, "0")}`,
        slug,
        name,
        brand,
        sku,
        shortDescription: concept.blurb,
        longDescription: buildLongDescription(concept, brand, tier, categoryName),
        features: [...concept.features, ...source.commonFeatures],
        specifications: [
          ...concept.specs.map(([label, value]) => ({ label, value })),
          ...source.commonSpecs.map(([label, value]) => ({ label, value })),
          { label: "SKU", value: sku },
        ],
        price,
        ...(compareAtPrice ? { compareAtPrice } : {}),
        discountPercent,
        rating,
        reviewCount,
        stockStatus,
        stockCount,
        category: categorySlug,
        subcategory: concept.sub,
        images,
        variants,
        tags: [
          categoryName,
          concept.sub,
          brand,
          tier.suffix || "Standard",
          ...concept.name.split(" ").filter((word) => word.length > 3),
        ],
        releasedAt,
        gradient,
        // Warranty and returns are structured so the PDP can render them
        // without parsing the specification strings.
        warrantyMonths: tier.warrantyMonths,
        returnWindowDays: 30,
        dispatchHours: 48,
        // Placeholder for the product video slot on the PDP.
        hasVideo: conceptIndex % 3 === 0,
        // Filled in below, once the category is complete.
        featured: false,
        bestSeller: false,
        newArrival: false,
        trending: false,
      };

      // `reviewCount` is the aggregate; `reviews` is the published sample.
      product.reviews = buildReviews(product, rng(hash(`reviews:${slug}`)));

      perCategory.push(product);
      globalIndex += 1;
    });
  });

  // Flags are relative to the category so every department has a full set.
  [...perCategory]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)
    .forEach((product) => {
      product.featured = true;
    });

  [...perCategory]
    .filter((product) => product.rating >= 4.2)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8)
    .forEach((product) => {
      product.bestSeller = true;
    });

  [...perCategory]
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
    .slice(0, 8)
    .forEach((product) => {
      product.newArrival = true;
    });

  // "Trending" is recent momentum rather than all-time volume: reviews per day
  // since release, restricted to products people actually rate well.
  const age = (product) =>
    Math.max(1, (CATALOG_DATE.getTime() - new Date(product.releasedAt).getTime()) / 86400000);

  [...perCategory]
    .filter((product) => product.rating >= 4.0 && product.stockStatus !== "out_of_stock")
    .sort((a, b) => b.reviewCount / age(b) - a.reviewCount / age(a))
    .slice(0, 6)
    .forEach((product) => {
      product.trending = true;
    });

  products.push(...perCategory);
}

const catalog = {
  generatedFrom: "scripts/generate-catalog.mjs",
  catalogDate: CATALOG_DATE.toISOString().slice(0, 10),
  currency: "USD",
  count: products.length,
  products,
};

writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

const reviewTotal = products.reduce((total, product) => total + product.reviews.length, 0);
const imageTotal = products.reduce((total, product) => total + product.images.length, 0);
const brandTotal = new Set(products.map((product) => product.brand)).size;

console.log(`Wrote ${products.length} products to ${OUT}`);
console.log(`  ${imageTotal} images · ${reviewTotal} reviews · ${brandTotal} brands`);
console.log(`  ${seenSlugs.size} unique slugs (expected ${products.length})`);
for (const slug of CATEGORY_ORDER) {
  const inCategory = products.filter((product) => product.category === slug);
  console.log(
    `  ${slug.padEnd(24)} ${String(inCategory.length).padStart(3)} products · ` +
      `${new Set(inCategory.map((product) => product.name)).size} unique names`,
  );
}
