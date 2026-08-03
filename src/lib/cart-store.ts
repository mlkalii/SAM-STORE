import type { CartLine } from "@/types";

const STORAGE_KEY = "samrux.cart.v2";
const EMPTY: CartLine[] = [];

type Listener = () => void;

let lines: CartLine[] = EMPTY;
let hydrated = false;
const listeners = new Set<Listener>();

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as CartLine;
  return (
    typeof line.slug === "string" &&
    typeof line.variantId === "string" &&
    typeof line.quantity === "number" &&
    typeof line.snapshot === "object" &&
    line.snapshot !== null &&
    typeof line.snapshot.name === "string" &&
    typeof line.snapshot.price === "number"
  );
}

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  lines = read();
  emit();
}

/**
 * The cart lives outside React so it can be read with `useSyncExternalStore`.
 * That keeps hydration free of a setState round trip and gives cross-tab sync
 * for free. Each line carries its own product snapshot, so the client bundle
 * never has to import the 300-product catalogue just to render the bag.
 */
export const cartStore = {
  subscribe(listener: Listener) {
    // The first subscriber pulls the persisted cart in. React re-reads the
    // snapshot right after subscribing, so this lands on the initial paint.
    if (!hydrated) {
      hydrated = true;
      lines = read();
      window.addEventListener("storage", onStorage);
    }

    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): CartLine[] {
    return lines;
  },

  getServerSnapshot(): CartLine[] {
    return EMPTY;
  },

  update(updater: (current: CartLine[]) => CartLine[]) {
    const next = updater(lines);
    if (next === lines) return;
    lines = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode or a full quota — the in-memory cart still works.
    }
    emit();
  },
};
