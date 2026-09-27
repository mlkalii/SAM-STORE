/**
 * Second photo-match pass over `src/data/catalog.json`.
 *
 *   node scripts/curate-catalog-photos.mjs
 *
 * Every listing was checked against its photograph at full size, title and
 * description together. Listings whose photograph cannot stand for the product
 * are removed. Where only the wording was wrong, the listing is rewritten to
 * say what the photograph shows and nothing more — no specification is kept
 * that the photograph cannot support.
 *
 * Idempotent: keyed on the original names, so a second run changes nothing.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(here, "../src/data/catalog.json");
const PHOTOS = resolve(here, "../public/products");
const ARCHIVE = resolve(here, "catalog-archive/unused-photos");

const REMOVE = new Set([
  "Aperture Mirrorless Camera", // a recognisable camera from another manufacturer
  "Kestrel Studio Microphone", // another manufacturer's logo is visible
  "Compact Stroller", // a recognisable stroller from another manufacturer
  "Relay Bluetooth Transmitter", // photo is a USB stick
  "Quill Mechanical Keyboard 65", // dark close-up of a full-size keyboard
  "Meridian 5G Handset", // the phone is barely visible
  "Radiance Vitamin C Drops", // three bottles, and the same bottle as the serum
  "Mineral Sunscreen SPF 50", // a child using a spray; product not shown
  "Infant Car Seat", // a family photo of a baby, not a product photo
  "Organic Cotton Swaddle Set", // a newborn in a hospital blanket
  "Woven Nursery Basket", // a small decorative bowl
  "Cross-Cut Shredder", // a hand-cranked mini shredder
  "Strategy Board Game — Meridian", // generic pawns, no game shown
]);

/** name → the listing as the photograph supports it. `price` in cents. */
const REWRITE = {
  "Corex Mechanical Keyboard": {
    short: "A compact mechanical keyboard with two-tone keycaps.",
    features: ["Compact layout", "Two-tone keycaps", "Mechanical switches"],
  },
  "Beacon Action Camera": {
    short: "A compact action camera supplied with a clear waterproof housing and mount.",
    features: ["Clear waterproof housing included", "Mounting bracket included"],
  },
  "Flux Power Bank 20K": {
    name: "Flux Power Bank",
    short: "A slim portable power bank with LED charge indicators.",
    features: ["LED charge-level indicators", "Slim case"],
  },
  "Competition Kettlebell": {
    name: "Vinyl Kettlebell 8 kg",
    short: "An 8 kg kettlebell with a coloured vinyl coating.",
    features: ["8 kg", "Vinyl-coated to protect floors"],
    price: 3499,
  },
  "Orthopedic Dog Bed": {
    name: "Bolster Dog Bed",
    short: "A round plush dog bed with a raised bolster edge.",
    features: ["Raised bolster edge", "Plush cover"],
    price: 6999,
  },
  "Travel Pet Carrier": {
    name: "Hard-Sided Pet Carrier",
    short: "A hard-sided plastic pet carrier with a wire door and a top-opening hatch.",
    features: ["Wire front door", "Top-opening hatch", "Carry handle"],
    price: 6999,
  },
  "Lumen Nursery Nightlight": {
    name: "Star Projector Nightlight",
    short: "A nursery nightlight that projects stars onto the wall and ceiling.",
    features: ["Projects a star pattern"],
  },
  "Desk Organiser Set": {
    short: "A set of desk trays and pen holders on a wooden base.",
    features: ["Pen holders and open trays", "Wooden base"],
  },
  "Cordless Tyre Inflator": {
    name: "12V Tyre Inflator",
    short: "A 12-volt tyre inflator with a built-in pressure gauge and a coiled air hose.",
    features: ["Built-in pressure gauge", "Coiled air hose"],
  },
  "Wash Sponge Set": {
    name: "Car Wash Sponge",
    short: "A large-cell car wash sponge that holds plenty of suds.",
    features: ["Large-cell foam"],
    price: 699,
  },
  "Vulcanised Court Sneaker": {
    name: "White Court Sneaker",
    short: "A white low-top lace-up sneaker.",
    features: ["Low-top", "Lace-up"],
  },
  "Slow-Cooked Fig Preserve": {
    name: "Plum Preserve",
    short: "A plum preserve in a clip-top glass jar.",
    features: ["Clip-top glass jar"],
  },
  "Wooden Train Set": {
    name: "Wooden Toy Train",
    short: "A painted wooden toy train engine with a carriage.",
    features: ["Painted wood", "Engine and carriage"],
    price: 2499,
  },
  "Kite — Delta Wing": {
    name: "Diamond Kite",
    short: "A classic diamond kite with a long ribbon tail.",
    features: ["Diamond shape", "Ribbon tail"],
    price: 2499,
  },
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const catalog = JSON.parse(readFileSync(FILE, "utf8"));
const creditsFile = resolve(PHOTOS, "CREDITS.json");
const credits = JSON.parse(readFileSync(creditsFile, "utf8"));
const archivedCreditsFile = resolve(ARCHIVE, "CREDITS.json");
const archivedCredits = JSON.parse(readFileSync(archivedCreditsFile, "utf8"));

const photoDir = (product) => product.images[0].src.split("/")[2];
const renamed = [];
let removed = 0;

const products = [];
for (const product of catalog.products) {
  if (REMOVE.has(product.name)) {
    const dir = photoDir(product);
    if (existsSync(resolve(PHOTOS, dir))) renameSync(resolve(PHOTOS, dir), resolve(ARCHIVE, dir));
    if (credits[dir]) {
      archivedCredits[dir] = credits[dir];
      delete credits[dir];
    }
    removed += 1;
    continue;
  }

  const fix = REWRITE[product.name];
  if (!fix) {
    products.push(product);
    continue;
  }

  const name = fix.name ?? product.name;
  const slug = fix.name ? `${slugify(product.brand)}-${slugify(name)}` : product.slug;
  const oldDir = photoDir(product);
  const dir = fix.name ? `${product.category}-${slugify(name)}` : oldDir;

  if (dir !== oldDir) {
    renameSync(resolve(PHOTOS, oldDir), resolve(PHOTOS, dir));
    credits[dir] = credits[oldDir];
    delete credits[oldDir];
  }
  if (slug !== product.slug) renamed.push({ from: product.slug, to: slug });

  const { compareAtPrice: _dropped, ...rest } = product;
  products.push({
    ...rest,
    slug,
    name,
    shortDescription: fix.short,
    longDescription: `${fix.short}\n\nSold and shipped directly by SAMRUX LLC.`,
    features: fix.features,
    // Only the row that is certainly true survives.
    specifications: product.specifications.filter((spec) => spec.label === "SKU"),
    price: fix.price ?? product.price,
    discountPercent: 0,
    variants: [{ id: "standard", label: "Standard" }],
    tags: [product.tags[0], product.subcategory, ...name.split(/\s+/).filter((w) => w.length > 2)],
    images: product.images.map((image) => ({
      ...image,
      id: `${slug}-main`,
      alt: `${name} — product photo`,
      src: image.src.replace(oldDir, dir),
      thumbnail: image.thumbnail.replace(oldDir, dir),
    })),
  });
}

catalog.products = products;
catalog.count = products.length;
writeFileSync(FILE, `${JSON.stringify(catalog, null, 1)}\n`);
writeFileSync(creditsFile, `${JSON.stringify(credits, null, 1)}\n`);
writeFileSync(archivedCreditsFile, `${JSON.stringify(archivedCredits, null, 1)}\n`);

console.log(`removed ${removed}, rewritten ${renamed.length} renamed, kept ${products.length}`);
for (const entry of renamed) console.log(`redirect /shop/${entry.from} -> /shop/${entry.to}`);
