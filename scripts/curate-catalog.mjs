/**
 * One-listing-per-photograph curation pass over `src/data/catalog.json`.
 *
 *   node scripts/curate-catalog.mjs
 *
 * The generated catalogue listed every product three times (Lite / standard /
 * Pro) under three different brand names, all sharing one photograph, so at
 * most one of each trio could match its picture. This pass keeps the standard
 * listing only, drops listings whose photograph does not show the titled
 * product, and removes options that the single photograph and single price
 * cannot support (colourways, pack sizes).
 *
 * Idempotent: running it on an already-curated file changes nothing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(here, "../src/data/catalog.json");

/** Standard-tier names that happen to end in a tier word. */
const TIER_EXEMPT = new Set(["Signal Webcam Pro", "Yoga Mat Pro"]);

/** Photograph shows a different item, an illustration, or contradicts the title/description. */
const PHOTO_MISMATCH = new Set([
  "Cadence Turntable", // illustration, not a product photo
  "Adjustable Dumbbell Set", // illustration
  "Ergonomic Mesh Chair", // illustration, and not a mesh chair
  "Pulse Wireless Charging Pad", // illustration
  "Machined Laptop Stand", // photo is a keyboard with a tablet rest
  "SIM Travel Case", // photo is loose SIM cards
  "Kettle One Gooseneck", // photo is a shelf with a moka pot
  "Lip Restore Balm Trio", // photo shows two items
  "Cascade Rain Shell", // photo is hi-vis workwear
  "Ceramic Slow Feeder Bowl", // photo is a plain steel bowl
  "Reflective Dog Harness", // photo is a dog coat
  "Hardcover Notebook Set", // photo is one open notebook
  "Rollerball Pen Set", // photo is a notepad and a single pen
  "Self-Levelling Laser Level", // photo is a surveying station
  "Adjustable Wrench Set", // photo is fixed ring spanners
  "Brushless Circular Saw", // photo is a corded saw
  "Solid Beech Workbench", // photo is a plywood bench
  "Cooperative Card Game — Signal", // photo is standard playing cards
  "Puzzle 1000 — Cartography", // photo is a blank puzzle
  "Garden Explorer Kit", // photo is a magnifying glass only
  "Halden Knife Block Set", // no block in the photo
  "Smoked Paprika Tin", // no tin in the photo
  "Flux GaN Charger 100W", // photo is a single-port charger
  "Ceramic Styling Brush", // photo is a paddle brush, listing is a round brush
  "Nordlight Floor Lamp", // photo is a tripod lamp, listing is an arc lamp
  "Timber Block Set", // photo is seven letter cubes, listing is 120 blocks
]);

const SUBCATEGORY_FIX = { "Traverse Selvedge Denim": "Denim" };

const STANDARD = [{ id: "standard", label: "Standard" }];
const isSize = (variant) => /^(Small|Medium|Large|X-Large|EU \d+)$/.test(variant.label);

const catalog = JSON.parse(readFileSync(FILE, "utf8"));
const before = catalog.products.length;
let tiers = 0;
let mismatched = 0;

const products = catalog.products
  .filter((product) => {
    const tiered = /\s(Lite|Pro)$/.test(product.name) && !TIER_EXEMPT.has(product.name);
    if (tiered) tiers += 1;
    return !tiered;
  })
  .filter((product) => {
    const drop = PHOTO_MISMATCH.has(product.name);
    if (drop) mismatched += 1;
    return !drop;
  })
  .map((product) => ({
    ...product,
    subcategory: SUBCATEGORY_FIX[product.name] ?? product.subcategory,
    tags: product.tags
      .filter((tag) => tag !== "Standard")
      .map((tag) =>
        tag === product.subcategory ? (SUBCATEGORY_FIX[product.name] ?? tag) : tag,
      ),
    // There is one configuration of each product now, so the copy stops
    // comparing it with the others.
    longDescription: product.longDescription.replace(
      ", this is the standard configuration, and the one most people should buy.",
      ".",
    ),
    // Warranty is assigned by department (`src/config/warranty.ts`); a
    // per-product row that says something else is a contradiction on the page.
    specifications: product.specifications.filter((spec) => spec.label !== "Warranty"),
    // One photograph and one price per listing: keep real sizes, drop the rest.
    variants: product.variants.every(isSize) ? product.variants : STANDARD,
  }));

catalog.products = products;
catalog.count = products.length;
writeFileSync(FILE, `${JSON.stringify(catalog, null, 1)}\n`);

console.log(`before ${before}, duplicate tiers removed ${tiers}, photo mismatches removed ${mismatched}, kept ${products.length}`);
