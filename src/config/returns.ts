/**
 * Official SAMRUX return policy.
 *
 * The numbers here drive the returns page, the product assurances strip, the
 * checkout summary, the customer's return request, the admin return queue
 * and the admin refund screen — so the window quoted to a customer is always
 * the window the system enforces.
 */

export const returnPolicy = {
  /** Days after delivery in which a return may be started. */
  windowDays: 30,
  /** Business days from approval to the money leaving us. */
  refundBusinessDaysMin: 5,
  refundBusinessDaysMax: 10,
  /** Refunds always go back the way the money came in. */
  refundTo: "the original payment method",
  restockingFee: 0,
} as const;

export const returnConditions = [
  "Products should be unused and in their original packaging wherever possible.",
  "Incorrect or defective products qualify for free return shipping.",
  `Refunds are issued to ${returnPolicy.refundTo} within ${returnPolicy.refundBusinessDaysMin}–${returnPolicy.refundBusinessDaysMax} business days after approval.`,
];

/**
 * Categories of goods that cannot be returned unless they are defective.
 * `matches` is checked against a product's category slug and its tags, so a
 * hygiene item in any department is caught.
 */
export interface NonReturnableRule {
  id: string;
  label: string;
  reason: string;
  categories: string[];
  tags: string[];
}

export const NON_RETURNABLE: NonReturnableRule[] = [
  {
    id: "personalised",
    label: "Personalised and made-to-order",
    reason: "Made specifically for you, so it cannot be resold.",
    categories: [],
    tags: ["personalised", "made-to-order", "custom", "engraved"],
  },
  {
    id: "digital",
    label: "Digital products",
    reason: "Delivered instantly and cannot be returned once accessed.",
    categories: [],
    tags: ["digital", "download", "licence", "gift-card"],
  },
  {
    id: "hygiene",
    label: "Hygiene and personal care",
    reason: "Cannot be resold once the hygiene seal is broken.",
    categories: ["beauty-personal-care"],
    tags: ["hygiene", "personal-care", "sealed", "cosmetic"],
  },
  {
    id: "final-sale",
    label: "Final sale",
    reason: "Marked final sale at the point of purchase.",
    categories: [],
    tags: ["final-sale", "clearance"],
  },
  {
    id: "perishable",
    label: "Perishable food",
    reason: "Food safety rules prevent resale once it has left us.",
    categories: ["grocery-gourmet-food"],
    tags: ["perishable", "fresh", "chilled"],
  },
];

export interface ReturnEligibility {
  returnable: boolean;
  /** Present when `returnable` is false. */
  rule?: NonReturnableRule;
  windowDays: number;
  note: string;
}

/**
 * Whether a product may be returned for any reason.
 *
 * Defective goods are always returnable — that is a separate route, handled by
 * the warranty and by `freeReturnShipping`, and this function never blocks it.
 */
export function returnEligibility(product: {
  category: string;
  tags: string[];
}): ReturnEligibility {
  const tags = product.tags.map((tag) => tag.toLowerCase());

  const rule = NON_RETURNABLE.find(
    (entry) =>
      entry.categories.includes(product.category) ||
      entry.tags.some((tag) => tags.includes(tag)),
  );

  if (rule) {
    return {
      returnable: false,
      rule,
      windowDays: 0,
      note: `${rule.label}: non-returnable unless defective. ${rule.reason}`,
    };
  }

  return {
    returnable: true,
    windowDays: returnPolicy.windowDays,
    note: `${returnPolicy.windowDays}-day returns from the delivery date.`,
  };
}

/** Reasons a customer can pick when starting a return. */
export const RETURN_REASONS = [
  { id: "defective", label: "Arrived damaged or defective", freeShipping: true },
  { id: "incorrect", label: "Wrong item sent", freeShipping: true },
  { id: "not-as-described", label: "Not as described", freeShipping: true },
  { id: "changed-mind", label: "Changed my mind", freeShipping: false },
  { id: "better-price", label: "Found a better price", freeShipping: false },
  { id: "no-longer-needed", label: "No longer needed", freeShipping: false },
] as const;

export type ReturnReasonId = (typeof RETURN_REASONS)[number]["id"];

/** Incorrect and defective goods ship back on us. */
export function freeReturnShipping(reasonId: string) {
  return RETURN_REASONS.some((reason) => reason.id === reasonId && reason.freeShipping);
}

/** Whether a delivered order is still inside the return window. */
export function withinReturnWindow(deliveredAt: string | Date, now: number) {
  const elapsedDays = (now - new Date(deliveredAt).getTime()) / 86400000;
  return elapsedDays <= returnPolicy.windowDays;
}
