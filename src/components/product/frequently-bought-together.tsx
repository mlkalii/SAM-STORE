"use client";

import { Check, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { ProductImage } from "@/components/product/product-image";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Frequently bought together.
 *
 * The bundle is a real basket: each line can be unticked, the total recalculates
 * live, and "add all" adds exactly what is ticked. The bundle saving is applied
 * as a discount on the accessories, never invented on top of the main product.
 */
const BUNDLE_DISCOUNT = 0.1;

export function FrequentlyBoughtTogether({
  anchor,
  companions,
}: {
  anchor: Product;
  companions: Product[];
}) {
  const { add } = useCart();
  const all = React.useMemo(() => [anchor, ...companions], [anchor, companions]);

  const [selected, setSelected] = React.useState<string[]>(() =>
    all.filter((product) => product.stockStatus !== "out_of_stock").map((product) => product.slug),
  );

  if (companions.length === 0) return null;

  const chosen = all.filter((product) => selected.includes(product.slug));
  const subtotal = chosen.reduce((total, product) => total + product.price, 0);

  // Only the companions are discounted; the anchor keeps its shelf price.
  const companionTotal = chosen
    .filter((product) => product.slug !== anchor.slug)
    .reduce((total, product) => total + product.price, 0);
  const saving = Math.round(companionTotal * BUNDLE_DISCOUNT);

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug],
    );
  }

  function addAll() {
    for (const product of chosen) {
      add(product, product.variants[0]);
    }
    toast.success(`${chosen.length} items added`, {
      description: `Bundle saving of ${formatPrice(saving)} applied at checkout.`,
    });
  }

  return (
    <section
      aria-labelledby="fbt-heading"
      className="rounded-3xl border bg-surface/60 p-6 shadow-premium sm:p-8"
    >
      <h2 id="fbt-heading" className="font-display text-2xl tracking-tight sm:text-3xl">
        Frequently bought together
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Customers who bought the {anchor.name} usually add these. Untick anything you already own.
      </p>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Visual bundle */}
        <ul className="flex flex-wrap items-center gap-3">
          {all.map((product, index) => {
            const active = selected.includes(product.slug);
            return (
              <React.Fragment key={product.slug}>
                {index > 0 ? (
                  <li aria-hidden className="text-muted-foreground">
                    <Plus className="size-4" />
                  </li>
                ) : null}
                <li>
                  <Link
                    href={`/shop/${product.slug}`}
                    aria-label={product.name}
                    className={cn(
                      "block overflow-hidden rounded-xl ring-2 transition",
                      active ? "ring-gold/60" : "opacity-45 ring-transparent",
                    )}
                  >
                    <ProductImage
                      src={product.images[0]?.thumbnail ?? ""}
                      alt={product.images[0]?.alt ?? product.name}
                      gradient={product.gradient}
                      category={product.category}
                      sizes="112px"
                      className="size-24 sm:size-28"
                    />
                  </Link>
                </li>
              </React.Fragment>
            );
          })}
        </ul>

        {/* Line items */}
        <div className="min-w-0 flex-1">
          <ul className="space-y-2.5">
            {all.map((product) => {
              const active = selected.includes(product.slug);
              const soldOut = product.stockStatus === "out_of_stock";

              return (
                <li key={product.slug}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60",
                      soldOut && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      disabled={soldOut}
                      onChange={() => toggle(product.slug)}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                        active ? "border-gold bg-gold text-gold-foreground" : "border-input",
                      )}
                    >
                      {active ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">
                        {product.slug === anchor.slug ? (
                          <span className="text-muted-foreground">This item: </span>
                        ) : null}
                        {product.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">{product.brand}</span>
                    </span>

                    <span className="shrink-0 font-mono text-sm tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {chosen.length} item{chosen.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 flex items-baseline gap-2.5">
                <span className="font-mono text-2xl tabular-nums text-gold">
                  {formatPrice(subtotal - saving)}
                </span>
                {saving > 0 ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Save {formatPrice(saving)} on the add-ons
                  </span>
                ) : null}
              </p>
            </div>

            <Button size="lg" disabled={chosen.length === 0} onClick={addAll}>
              <ShoppingBag className="size-4" aria-hidden />
              Add {chosen.length} to cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
