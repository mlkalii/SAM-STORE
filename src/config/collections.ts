/**
 * Curated cross-department collections.
 *
 * Departments answer "what kind of thing is this"; a collection answers "what
 * am I trying to do". Someone setting up a home office does not think in terms
 * of Office Products *and* Computers *and* Electronics — they think in terms of
 * the room.
 *
 * Each collection is a saved query rather than a hand-picked list, so nothing
 * here goes stale when the catalogue changes. The homepage tiles and the
 * `/shop?collection=` filter both read this file, so they cannot disagree.
 */
export interface Collection {
  slug: string;
  title: string;
  blurb: string;
  gradient: string;
  /** Departments this collection draws from. */
  categories: string[];
  /** Narrows further where a department alone is too broad. */
  tags?: string[];
}

export const collections: Collection[] = [
  {
    slug: "home-office",
    title: "The home office",
    blurb: "Desk, chair, light, screen and the small things that make a room work all day.",
    gradient: "from-slate-900 to-slate-700",
    categories: ["office-products", "computers-accessories", "electronics"],
  },
  {
    slug: "kitchen-essentials",
    title: "A kitchen that lasts",
    blurb: "Pans, knives and appliances chosen because they can be repaired, not replaced.",
    gradient: "from-amber-900 to-orange-700",
    categories: ["home-kitchen", "grocery-gourmet-food"],
  },
  {
    slug: "everyday-carry",
    title: "Everyday carry",
    blurb: "Audio, power and the pocket things you replace least often when they are good.",
    gradient: "from-indigo-900 to-violet-700",
    categories: ["mobile-phones", "electronics"],
  },
  {
    slug: "the-weekend",
    title: "The weekend",
    blurb: "Outdoor kit, sport and everything that goes in the boot on a Friday night.",
    gradient: "from-emerald-900 to-teal-700",
    categories: ["sports-outdoors", "automotive", "pet-supplies"],
  },
];

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

/** Whether a product belongs to a collection. Used by the query engine. */
export function inCollection(
  product: { category: string; tags: string[] },
  collection: Collection,
) {
  if (!collection.categories.includes(product.category)) return false;
  if (!collection.tags) return true;
  return collection.tags.some((tag) => product.tags.includes(tag));
}
