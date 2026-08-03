"use client";

import * as React from "react";

import { createPersistentListStore, isProductRef } from "@/lib/client-store";
import type { Product, ProductRef } from "@/types";

/** Compare is capped — the table stops being readable past four columns. */
export const COMPARE_LIMIT = 4;
const RECENTLY_VIEWED_LIMIT = 12;

const wishlistStore = createPersistentListStore<ProductRef>({
  storageKey: "samrux.wishlist.v1",
  prepend: true,
  validate: isProductRef,
});

const compareStore = createPersistentListStore<ProductRef>({
  storageKey: "samrux.compare.v1",
  limit: COMPARE_LIMIT,
  validate: isProductRef,
});

const recentlyViewedStore = createPersistentListStore<ProductRef>({
  storageKey: "samrux.recently-viewed.v1",
  limit: RECENTLY_VIEWED_LIMIT,
  prepend: true,
  validate: isProductRef,
});

/**
 * Client-side projection of a product. Cards and dialogs already hold the full
 * product, so nothing needs to be re-fetched to add to a list.
 */
export function toRef(product: Product, addedAt: number): ProductRef {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    ...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {}),
    image: product.images[0]?.thumbnail ?? "",
    gradient: product.gradient,
    category: product.category,
    rating: product.rating,
    addedAt,
  };
}

function useList(store: ReturnType<typeof createPersistentListStore<ProductRef>>) {
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useWishlist() {
  const items = useList(wishlistStore);

  return {
    items,
    count: items.length,
    has: React.useCallback(
      (slug: string) => items.some((entry) => entry.slug === slug),
      [items],
    ),
    toggle: React.useCallback(
      (product: Product) => wishlistStore.toggle(toRef(product, Date.now())),
      [],
    ),
    remove: wishlistStore.remove,
    clear: wishlistStore.clear,
  };
}

export function useCompare() {
  const items = useList(compareStore);
  const isFull = items.length >= COMPARE_LIMIT;

  return {
    items,
    count: items.length,
    isFull,
    has: React.useCallback(
      (slug: string) => items.some((entry) => entry.slug === slug),
      [items],
    ),
    /** Returns `false` when the tray is full and the product was not added. */
    toggle: React.useCallback(
      (product: Product) => {
        const already = items.some((entry) => entry.slug === product.slug);
        if (!already && items.length >= COMPARE_LIMIT) return null;
        return compareStore.toggle(toRef(product, Date.now()));
      },
      [items],
    ),
    remove: compareStore.remove,
    clear: compareStore.clear,
  };
}

export function useRecentlyViewed() {
  const items = useList(recentlyViewedStore);

  return {
    items,
    record: React.useCallback(
      (product: Product) => recentlyViewedStore.add(toRef(product, Date.now())),
      [],
    ),
    clear: recentlyViewedStore.clear,
  };
}
