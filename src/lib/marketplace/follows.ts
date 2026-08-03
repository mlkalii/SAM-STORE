import "server-only";

import { sellerStore } from "@/lib/marketplace/seller-store";
import type { SellerFollow } from "@/lib/marketplace/types";

/**
 * Store followers.
 *
 * A follow is the lightest relationship in the marketplace, so it gets the
 * lightest store: a set keyed by `sellerId:userId`. The seller's cached
 * `followerCount` is refreshed on every change, because the storefront reads it
 * far more often than anyone follows.
 */

const globalForFollows = globalThis as unknown as { __samruxFollows?: Map<string, SellerFollow> };

function state() {
  if (!globalForFollows.__samruxFollows) globalForFollows.__samruxFollows = new Map();
  return globalForFollows.__samruxFollows;
}

const key = (sellerId: string, userId: string) => `${sellerId}:${userId}`;

export const followStore = {
  isFollowing(sellerId: string, userId: string) {
    return state().has(key(sellerId, userId));
  },

  forUser(userId: string): SellerFollow[] {
    return [...state().values()].filter((follow) => follow.userId === userId);
  },

  countFor(sellerId: string) {
    return [...state().values()].filter((follow) => follow.sellerId === sellerId).length;
  },

  /** Returns the new state, so the caller can render without a second read. */
  toggle(sellerId: string, userId: string): { following: boolean; followerCount: number } {
    const id = key(sellerId, userId);
    const seller = sellerStore.find(sellerId);
    // Seeded stores carry a historical follower count; new follows sit on top.
    const base = (seller?.followerCount ?? 0) - this.countFor(sellerId);

    if (state().has(id)) state().delete(id);
    else state().set(id, { sellerId, userId, followedAt: new Date().toISOString() });

    const followerCount = Math.max(0, base) + this.countFor(sellerId);
    sellerStore.setFollowerCount(sellerId, followerCount);

    return { following: state().has(id), followerCount };
  },
};
