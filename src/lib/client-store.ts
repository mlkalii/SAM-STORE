"use client";

import type { ProductRef } from "@/types";

/**
 * A tiny persistent list store, shared by the wishlist, compare tray and
 * recently-viewed rail.
 *
 * Same shape as the cart store: state lives outside React so it can be read
 * with `useSyncExternalStore` (no hydration round trip, no setState-in-effect),
 * persists to `localStorage`, and syncs across browser tabs.
 */

export interface Identified {
  slug: string;
}

export interface PersistentListStore<T extends Identified> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T[];
  getServerSnapshot: () => T[];
  add: (item: T) => void;
  remove: (slug: string) => void;
  toggle: (item: T) => boolean;
  clear: () => void;
}

export function createPersistentListStore<T extends Identified>(options: {
  storageKey: string;
  /** Drop the oldest entries beyond this count. */
  limit?: number;
  /** Newest first (recently viewed) or append (wishlist). */
  prepend?: boolean;
  validate: (value: unknown) => value is T;
}): PersistentListStore<T> {
  const { storageKey, limit, prepend = false, validate } = options;
  const EMPTY: T[] = [];

  let items: T[] = EMPTY;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function read(): T[] {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return EMPTY;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(validate) : EMPTY;
    } catch {
      return EMPTY;
    }
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey) return;
    items = read();
    emit();
  }

  function commit(next: T[]) {
    items = limit ? next.slice(0, limit) : next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Private mode or a full quota — the in-memory list still works.
    }
    emit();
  }

  return {
    subscribe(listener) {
      if (!hydrated) {
        hydrated = true;
        items = read();
        window.addEventListener("storage", onStorage);
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot: () => items,
    getServerSnapshot: () => EMPTY,

    add(item) {
      const without = items.filter((entry) => entry.slug !== item.slug);
      commit(prepend ? [item, ...without] : [...without, item]);
    },

    remove(slug) {
      if (!items.some((entry) => entry.slug === slug)) return;
      commit(items.filter((entry) => entry.slug !== slug));
    },

    toggle(item) {
      const exists = items.some((entry) => entry.slug === item.slug);
      if (exists) {
        commit(items.filter((entry) => entry.slug !== item.slug));
        return false;
      }
      const next = prepend ? [item, ...items] : [...items, item];
      commit(next);
      return true;
    },

    clear() {
      if (items.length === 0) return;
      commit([]);
    },
  };
}

/** Shared runtime guard for the `ProductRef` shape these stores hold. */
export function isProductRef(value: unknown): value is ProductRef {
  if (typeof value !== "object" || value === null) return false;
  const ref = value as ProductRef;
  return (
    typeof ref.slug === "string" &&
    typeof ref.name === "string" &&
    typeof ref.price === "number" &&
    typeof ref.brand === "string"
  );
}
