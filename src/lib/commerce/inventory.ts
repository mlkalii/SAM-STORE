import type { LineAvailability } from "@/lib/commerce/types";
import type { Product } from "@/types";

/**
 * Inventory.
 *
 * The catalogue is the source of truth for on-hand stock; this layer tracks the
 * reservations placed on top of it, so two shoppers cannot both buy the last
 * unit. Reservations live in-memory keyed by `slug:variantId`.
 */

interface Reservation {
  quantity: number;
  /** Unix ms; reservations older than the window are treated as released. */
  expiresAt: number;
}

const RESERVATION_WINDOW_MS = 15 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;

const globalForInventory = globalThis as unknown as {
  __samruxReservations?: Map<string, Reservation>;
  __samruxSold?: Map<string, number>;
};

function state() {
  if (!globalForInventory.__samruxReservations) {
    globalForInventory.__samruxReservations = new Map();
  }
  return globalForInventory.__samruxReservations;
}

/**
 * Units already sold, keyed the same way as reservations.
 *
 * The catalogue's `stockCount` is a static figure, so without this a sale left
 * no trace anywhere: `commit()` released a reservation that was never taken
 * (nothing calls `reserve()`), and the next shopper saw the original count. A
 * product with three units could be bought indefinitely, and the low-stock and
 * out-of-stock states could never be reached by trading.
 */
function sold() {
  if (!globalForInventory.__samruxSold) globalForInventory.__samruxSold = new Map();
  return globalForInventory.__samruxSold;
}

function soldFor(slug: string, variantId: string) {
  return sold().get(key(slug, variantId)) ?? 0;
}

function key(slug: string, variantId: string) {
  return `${slug}:${variantId}`;
}

function reservedFor(slug: string, variantId: string) {
  const record = state().get(key(slug, variantId));
  if (!record) return 0;
  if (record.expiresAt < Date.now()) {
    state().delete(key(slug, variantId));
    return 0;
  }
  return record.quantity;
}

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock" | "backorder";

export interface StockSnapshot {
  level: StockLevel;
  onHand: number;
  reserved: number;
  available: number;
  /** Out-of-stock items we will still accept an order for. */
  backorderable: boolean;
}

/** Backorders are accepted where the product is well reviewed and restocking. */
function isBackorderable(product: Product) {
  return product.stockStatus === "out_of_stock" && product.rating >= 4.2;
}

export function snapshot(product: Product, variantId: string): StockSnapshot {
  const onHand = Math.max(0, product.stockCount - soldFor(product.slug, variantId));
  const reserved = reservedFor(product.slug, variantId);
  const available = Math.max(0, onHand - reserved);
  const backorderable = isBackorderable(product);

  const level: StockLevel =
    available <= 0
      ? backorderable
        ? "backorder"
        : "out-of-stock"
      : available <= LOW_STOCK_THRESHOLD
        ? "low-stock"
        : "in-stock";

  return { level, onHand, reserved, available, backorderable };
}

/** What a given quantity request can actually be fulfilled with. */
export function availabilityFor(
  product: Product,
  variantId: string,
  quantity: number,
): LineAvailability {
  const stock = snapshot(product, variantId);

  if (stock.available >= quantity) {
    return { status: "available", availableNow: quantity };
  }

  if (stock.available > 0) {
    return {
      status: "partial",
      availableNow: stock.available,
      message: `Only ${stock.available} of ${quantity} can ship immediately.`,
    };
  }

  if (stock.backorderable) {
    return {
      status: "backorder",
      availableNow: 0,
      message: "On backorder — ships in about two weeks.",
    };
  }

  return { status: "unavailable", availableNow: 0, message: "Out of stock." };
}

export const inventory = {
  snapshot,
  availabilityFor,

  /** Holds stock while a customer completes checkout. */
  reserve(slug: string, variantId: string, quantity: number) {
    const existing = reservedFor(slug, variantId);
    state().set(key(slug, variantId), {
      quantity: existing + quantity,
      expiresAt: Date.now() + RESERVATION_WINDOW_MS,
    });
  },

  release(slug: string, variantId: string, quantity: number) {
    const existing = reservedFor(slug, variantId);
    const next = Math.max(0, existing - quantity);
    if (next === 0) state().delete(key(slug, variantId));
    else state().set(key(slug, variantId), { quantity: next, expiresAt: Date.now() + RESERVATION_WINDOW_MS });
  },

  /** Converts a reservation into a sale once the order is placed. */
  commit(slug: string, variantId: string, quantity: number) {
    inventory.release(slug, variantId, quantity);
    sold().set(key(slug, variantId), soldFor(slug, variantId) + quantity);
  },

  /** Puts units back when an order is cancelled or refunded. */
  restock(slug: string, variantId: string, quantity: number) {
    const next = soldFor(slug, variantId) - quantity;
    if (next <= 0) sold().delete(key(slug, variantId));
    else sold().set(key(slug, variantId), next);
  },

  LOW_STOCK_THRESHOLD,
};
