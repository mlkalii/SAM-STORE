import "server-only";

import { randomUUID } from "node:crypto";

import { orderStore } from "@/lib/commerce/orders";
import { sellerStore } from "@/lib/marketplace/seller-store";
import type { MarketplaceReview, ReviewStatus, ReviewTarget } from "@/lib/marketplace/types";

/**
 * Product and seller reviews with moderation.
 *
 * "Verified purchase" is never taken from the client: it is decided here by
 * looking for a delivered order belonging to the author that contains the
 * product. A review that claims verification it cannot prove is simply filed
 * unverified.
 *
 * Reviews start `pending` and only a moderator publishes them, so nothing
 * reaches a product page without a human — or, later, a classifier — seeing it.
 */

interface State {
  reviews: Map<string, MarketplaceReview>;
}

const globalForReviews = globalThis as unknown as { __samruxReviews?: State };

function state(): State {
  if (!globalForReviews.__samruxReviews) {
    globalForReviews.__samruxReviews = { reviews: new Map() };
  }
  return globalForReviews.__samruxReviews;
}

/** Did this customer actually buy and receive this product? */
export function hasVerifiedPurchase(userId: string, productSlug: string) {
  return orderStore
    .forUser(userId)
    .some(
      (order) =>
        order.status === "delivered" && order.lines.some((line) => line.slug === productSlug),
    );
}

/** The delivered order that backs a verified review, for the audit trail. */
function verifyingOrder(userId: string, productSlug: string) {
  return orderStore
    .forUser(userId)
    .find(
      (order) =>
        order.status === "delivered" && order.lines.some((line) => line.slug === productSlug),
    );
}

export interface SubmitReviewInput {
  target: ReviewTarget;
  targetId: string;
  sellerId: string;
  authorId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}

export const reviewStore = {
  all(): MarketplaceReview[] {
    return [...state().reviews.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  find(id: string) {
    return state().reviews.get(id);
  },

  /** Everything awaiting a decision — the moderation queue. */
  pending(): MarketplaceReview[] {
    return this.all().filter((review) => review.status === "pending");
  },

  forProduct(slug: string, options: { includeUnpublished?: boolean } = {}) {
    return this.all().filter(
      (review) =>
        review.target === "product" &&
        review.targetId === slug &&
        (options.includeUnpublished || review.status === "published"),
    );
  },

  forSeller(sellerId: string, options: { includeUnpublished?: boolean } = {}) {
    return this.all().filter(
      (review) =>
        review.sellerId === sellerId &&
        (options.includeUnpublished || review.status === "published"),
    );
  },

  /** Reviews of the seller themselves, not of their products. */
  sellerReviews(sellerId: string, options: { includeUnpublished?: boolean } = {}) {
    return this.all().filter(
      (review) =>
        review.target === "seller" &&
        review.targetId === sellerId &&
        (options.includeUnpublished || review.status === "published"),
    );
  },

  byAuthor(authorId: string) {
    return this.all().filter((review) => review.authorId === authorId);
  },

  /** One review per author per target. */
  existing(authorId: string, target: ReviewTarget, targetId: string) {
    return this.all().find(
      (review) =>
        review.authorId === authorId && review.target === target && review.targetId === targetId,
    );
  },

  submit(input: SubmitReviewInput): MarketplaceReview {
    const verified =
      input.target === "product" && hasVerifiedPurchase(input.authorId, input.targetId);
    const order = verified ? verifyingOrder(input.authorId, input.targetId) : undefined;

    const review: MarketplaceReview = {
      id: `rev-${randomUUID().slice(0, 10)}`,
      target: input.target,
      targetId: input.targetId,
      sellerId: input.sellerId,
      authorId: input.authorId,
      authorName: input.authorName,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      title: input.title,
      body: input.body,
      verifiedPurchase: verified,
      orderId: order?.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
    };

    state().reviews.set(review.id, review);
    return review;
  },

  moderate(
    id: string,
    status: ReviewStatus,
    options: { by?: string; note?: string } = {},
  ): MarketplaceReview | undefined {
    const review = state().reviews.get(id);
    if (!review) return undefined;

    const next: MarketplaceReview = {
      ...review,
      status,
      moderatedAt: new Date().toISOString(),
      moderatedBy: options.by,
      moderationNote: options.note,
    };
    state().reviews.set(id, next);

    // Publishing or hiding a seller review changes the storefront score.
    if (next.target === "seller") recomputeSellerRating(next.targetId);
    return next;
  },

  /** The seller's public answer to a review. */
  reply(id: string, body: string): MarketplaceReview | undefined {
    const review = state().reviews.get(id);
    if (!review) return undefined;

    const next: MarketplaceReview = {
      ...review,
      reply: { body, at: new Date().toISOString() },
    };
    state().reviews.set(id, next);
    return next;
  },

  markHelpful(id: string) {
    const review = state().reviews.get(id);
    if (!review) return undefined;
    const next = { ...review, helpfulCount: review.helpfulCount + 1 };
    state().reviews.set(id, next);
    return next;
  },
};

/**
 * Folds published seller reviews into the storefront score.
 *
 * Seeded sellers carry a historical rating and review count from before the
 * marketplace launched; new reviews are blended with that history rather than
 * replacing it, so a single five-star review cannot move a 2,000-review store.
 */
export function recomputeSellerRating(sellerId: string) {
  const seller = sellerStore.find(sellerId);
  if (!seller) return;

  const reviews = reviewStore.sellerReviews(sellerId);
  if (reviews.length === 0) return;

  const submitted = reviews.reduce((total, review) => total + review.rating, 0);

  // Historical aggregate, minus anything already counted here.
  const historyCount = Math.max(0, seller.reviewCount - reviews.length);
  const historyTotal = historyCount * seller.rating;

  const count = historyCount + reviews.length;
  const rating = count > 0 ? (historyTotal + submitted) / count : 0;

  sellerStore.setRating(sellerId, Math.round(rating * 10) / 10, count);
}

/** Average of a product's published reviews — blended with catalogue history. */
export function productReviewSummary(
  slug: string,
  history: { rating: number; reviewCount: number },
) {
  const reviews = reviewStore.forProduct(slug);
  if (reviews.length === 0) return { ...history, submitted: 0 };

  const submitted = reviews.reduce((total, review) => total + review.rating, 0);
  const count = history.reviewCount + reviews.length;
  const rating = (history.rating * history.reviewCount + submitted) / count;

  return {
    rating: Math.round(rating * 10) / 10,
    reviewCount: count,
    submitted: reviews.length,
  };
}
