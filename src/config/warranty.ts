/**
 * Warranty policy, assigned automatically by department.
 *
 * A product never carries its own warranty text: the department decides, so a
 * new product inherits the right cover the moment it is filed. `warrantyFor`
 * is the only way anything reads it — product pages, the buy panel, the compare
 * table, invoices and the admin editor all call it.
 */

export type WarrantyKind =
  /** A fixed number of months of manufacturer cover. */
  | "months"
  /** Replaced only if it arrives faulty. */
  | "doa-replacement"
  /** No separate warranty; the return policy is the whole cover. */
  | "returns-only"
  /** Nothing beyond statutory rights — perishables. */
  | "none";

export interface WarrantyPolicy {
  kind: WarrantyKind;
  /** Months of cover. Zero for every kind other than `months`. */
  months: number;
  /** Short label for badges and table cells. */
  label: string;
  /** One sentence, shown on the product page. */
  summary: string;
}

const MONTHS = (months: number): WarrantyPolicy => ({
  kind: "months",
  months,
  label: `${months}-month warranty`,
  summary: `Covered by a ${months}-month manufacturer warranty against defects in materials and workmanship, starting on the delivery date.`,
});

const DOA: WarrantyPolicy = {
  kind: "doa-replacement",
  months: 0,
  label: "Replacement if defective on arrival",
  summary:
    "Replaced free of charge if it arrives defective. Report it within 30 days of delivery and we ship a replacement at no cost.",
};

const RETURNS_ONLY: WarrantyPolicy = {
  kind: "returns-only",
  months: 0,
  label: "Covered by the return policy",
  summary:
    "No separate warranty applies. The 30-day return policy is the cover: send it back within 30 days of delivery for a refund or exchange.",
};

const NONE: WarrantyPolicy = {
  kind: "none",
  months: 0,
  label: "No warranty",
  summary:
    "Perishable goods carry no warranty. Anything that arrives damaged, spoiled or past date is refunded in full.",
};

/**
 * Department → policy. Keys are category slugs from `data/categories`.
 * The comment beside each entry is the department's display name, so the table
 * can be checked against the policy document without a second lookup.
 */
const CATEGORY_WARRANTY: Record<string, WarrantyPolicy> = {
  electronics: MONTHS(12), //              Electronics
  "computers-accessories": MONTHS(12), //  Computers & Accessories (home appliances tier)
  "mobile-phones": MONTHS(6), //           Mobile Phones & Accessories
  "home-kitchen": MONTHS(6), //            Home & Kitchen
  "beauty-personal-care": DOA, //          Beauty & Personal Care
  "sports-outdoors": MONTHS(12), //        Sports & Outdoors
  "pet-supplies": MONTHS(6), //            Pet Supplies
  "baby-products": MONTHS(6), //           Baby Products
  "office-products": MONTHS(12), //        Office Products
  automotive: MONTHS(12), //               Automotive
  "tools-home-improvement": MONTHS(12), // Tools & Home Improvement
  fashion: RETURNS_ONLY, //                Fashion
  "grocery-gourmet-food": NONE, //         Grocery & Gourmet Food
  "toys-games": MONTHS(6), //              Toys & Games
};

/**
 * Extra departments named in the policy that do not map one-to-one onto a
 * catalogue slug yet. Kept here so adding the department later needs no code
 * change — only a `categories` entry.
 */
const NAMED_WARRANTY: Record<string, WarrantyPolicy> = {
  "home-appliances": MONTHS(12),
  furniture: MONTHS(12),
  kitchen: MONTHS(6),
};

/** Anything unfiled gets the conservative default. */
const DEFAULT_WARRANTY = MONTHS(12);

export function warrantyFor(categorySlug: string): WarrantyPolicy {
  return CATEGORY_WARRANTY[categorySlug] ?? NAMED_WARRANTY[categorySlug] ?? DEFAULT_WARRANTY;
}

/** Every distinct policy with the departments it covers — for the policy page. */
export function warrantyTable(
  departments: { slug: string; name: string }[],
): { policy: WarrantyPolicy; departments: string[] }[] {
  const groups = new Map<string, { policy: WarrantyPolicy; departments: string[] }>();

  for (const department of departments) {
    const policy = warrantyFor(department.slug);
    const key = `${policy.kind}:${policy.months}`;
    const existing = groups.get(key);
    if (existing) existing.departments.push(department.name);
    else groups.set(key, { policy, departments: [department.name] });
  }

  // Longest cover first, then the qualitative policies.
  return [...groups.values()].sort((a, b) => b.policy.months - a.policy.months);
}
