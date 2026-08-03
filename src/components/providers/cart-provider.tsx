"use client";

import * as React from "react";

import { cartStore } from "@/lib/cart-store";
import type { CartLineTotals, Product, ProductVariant } from "@/types";

interface CartContextValue {
  lines: CartLineTotals[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, variant: ProductVariant, quantity?: number) => void;
  /** Bulk add by slug — used by reorder. Resolves with how many were added. */
  addMany: (items: { slug: string; variantId: string; quantity: number }[]) => Promise<number>;
  remove: (slug: string, variantId: string) => void;
  setQuantity: (slug: string, variantId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = React.useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const [isOpen, setOpen] = React.useState(false);

  const add = React.useCallback(
    (product: Product, variant: ProductVariant, quantity = 1) => {
      cartStore.update((current) => {
        const index = current.findIndex(
          (line) => line.slug === product.slug && line.variantId === variant.id,
        );

        if (index === -1) {
          return [
            ...current,
            {
              slug: product.slug,
              variantId: variant.id,
              quantity,
              snapshot: {
                name: product.name,
                brand: product.brand,
                price: product.price,
                gradient: product.images[0]?.gradient ?? product.gradient,
                image: product.images[0]?.thumbnail ?? "",
                variantLabel: variant.label,
                category: product.category,
              },
            },
          ];
        }

        return current.map((line, position) =>
          position === index
            ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
            : line,
        );
      });
      setOpen(true);
    },
    [],
  );

  /**
   * Reorder support. The cart stores snapshots, so the products have to be
   * rehydrated from the catalogue before they can be added — and rehydrating
   * also means a discontinued or out-of-stock line is silently skipped rather
   * than resurrected at a stale price.
   */
  const addMany = React.useCallback(
    async (items: { slug: string; variantId: string; quantity: number }[]) => {
      if (items.length === 0) return 0;

      try {
        const slugs = [...new Set(items.map((item) => item.slug))].join(",");
        const response = await fetch(`/api/products?slugs=${encodeURIComponent(slugs)}`);
        if (!response.ok) return 0;

        const payload = (await response.json()) as { products: Product[] };
        const bySlug = new Map(payload.products.map((product) => [product.slug, product]));

        let added = 0;
        for (const item of items) {
          const product = bySlug.get(item.slug);
          if (!product || product.stockStatus === "out_of_stock") continue;

          const variant =
            product.variants.find((option) => option.id === item.variantId) ?? product.variants[0];
          add(product, variant, item.quantity);
          added += 1;
        }
        return added;
      } catch {
        return 0;
      }
    },
    [add],
  );

  const remove = React.useCallback((slug: string, variantId: string) => {
    cartStore.update((current) =>
      current.filter((line) => !(line.slug === slug && line.variantId === variantId)),
    );
  }, []);

  const setQuantity = React.useCallback(
    (slug: string, variantId: string, quantity: number) => {
      cartStore.update((current) =>
        quantity <= 0
          ? current.filter((line) => !(line.slug === slug && line.variantId === variantId))
          : current.map((line) =>
              line.slug === slug && line.variantId === variantId
                ? { ...line, quantity: Math.min(quantity, 99) }
                : line,
            ),
      );
    },
    [],
  );

  const clear = React.useCallback(() => cartStore.update(() => []), []);

  const value = React.useMemo<CartContextValue>(() => {
    const withTotals: CartLineTotals[] = lines.map((line) => ({
      ...line,
      lineTotal: line.snapshot.price * line.quantity,
    }));

    return {
      lines: withTotals,
      count: withTotals.reduce((total, line) => total + line.quantity, 0),
      subtotal: withTotals.reduce((total, line) => total + line.lineTotal, 0),
      isOpen,
      setOpen,
      add,
      addMany,
      remove,
      setQuantity,
      clear,
    };
  }, [lines, isOpen, add, addMany, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
