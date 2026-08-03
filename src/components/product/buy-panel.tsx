"use client";

import { Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { useClientToday } from "@/hooks/use-client-today";
import { estimateDelivery } from "@/lib/delivery";
import { warrantyFor } from "@/config/warranty";
import { returnEligibility, returnPolicy } from "@/config/returns";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Price, variants, quantity, add-to-cart and buy-now.
 *
 * Shared by the PDP, the quick view and the sticky bar, so stock rules and
 * variant handling only exist once. `compact` trims the reassurance block for
 * the dialog; `hidePrice` suppresses the price header where the caller shows it.
 */
export function BuyPanel({
  product,
  compact = false,
  hidePrice = false,
  className,
}: {
  product: Product;
  compact?: boolean;
  hidePrice?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const today = useClientToday();
  const [variantId, setVariantId] = React.useState(product.variants[0].id);
  const [quantity, setQuantity] = React.useState(1);

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const soldOut = product.stockStatus === "out_of_stock";
  const lineTotal = product.price * quantity;
  const qualifiesForFreeShipping = lineTotal >= siteConfig.freeShippingThreshold;
  const hasSwatches = product.variants.some((option) => option.hex);
  const showVariants = product.variants.length > 1;
  const delivery = today ? estimateDelivery(product, today) : null;

  function addToCart() {
    add(product, variant, quantity);
    toast.success(`${product.name} added`, {
      description: `${quantity} × ${formatPrice(product.price)}`,
    });
  }

  return (
    <div className={cn("space-y-6", className)}>
      {hidePrice ? null : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={cn("font-mono tabular-nums", compact ? "text-2xl" : "text-3xl")}>
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice ? (
            <>
              <span className="font-mono text-base text-muted-foreground line-through tabular-nums">
                {formatPrice(product.compareAtPrice)}
              </span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                Save {formatPrice(product.compareAtPrice - product.price)}
              </span>
            </>
          ) : null}
        </div>
      )}

      {showVariants ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {hasSwatches ? "Finish" : "Option"} · {variant.label}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((option) =>
              option.hex ? (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVariantId(option.id)}
                  aria-label={option.label}
                  aria-pressed={option.id === variantId}
                  className={cn(
                    "relative size-9 rounded-full ring-1 ring-border transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    option.id === variantId &&
                      "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: option.hex }}
                >
                  {option.id === variantId ? (
                    <Check
                      className="absolute inset-0 m-auto size-4 text-white mix-blend-difference"
                      aria-hidden
                    />
                  ) : null}
                </button>
              ) : (
                <Button
                  key={option.id}
                  type="button"
                  variant={option.id === variantId ? "default" : "outline"}
                  size="sm"
                  aria-pressed={option.id === variantId}
                  onClick={() => setVariantId(option.id)}
                >
                  {option.label}
                </Button>
              ),
            )}
          </div>
        </div>
      ) : null}

      {compact ? null : <Separator />}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex h-11 items-center justify-between rounded-md border px-1 sm:w-32">
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              <Minus className="size-4" aria-hidden />
            </Button>
            <span className="font-mono text-sm tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Increase quantity"
              onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>

          <Button size="lg" className="h-11 flex-1" disabled={soldOut} onClick={addToCart}>
            <ShoppingBag className="size-4" aria-hidden />
            {soldOut ? "Out of stock" : `Add to cart — ${formatPrice(lineTotal)}`}
          </Button>
        </div>

        <Button
          size="lg"
          variant="secondary"
          className="h-11 w-full"
          disabled={soldOut}
          onClick={() => {
            add(product, variant, quantity);
            router.push("/cart");
          }}
        >
          <Zap className="size-4" aria-hidden />
          Buy now
        </Button>
      </div>

      {compact ? (
        delivery ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4 shrink-0" aria-hidden />
            {delivery.label}
          </p>
        ) : null
      ) : (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Truck className="size-4 shrink-0" aria-hidden />
            {delivery ? (
              <span>
                Estimated delivery <span className="text-foreground">{delivery.label}</span> ·{" "}
                {qualifiesForFreeShipping
                  ? "free on this order"
                  : `free over ${formatPrice(siteConfig.freeShippingThreshold)}`}
              </span>
            ) : (
              <span>
                {qualifiesForFreeShipping
                  ? "Free shipping on this order."
                  : `Free shipping over ${formatPrice(siteConfig.freeShippingThreshold)}.`}
              </span>
            )}
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" aria-hidden />
            {warrantyFor(product.category).label} ·{" "}
            {returnEligibility(product).returnable
              ? `${returnPolicy.windowDays}-day returns, handled by us`
              : "Non-returnable unless defective"}
          </p>
        </div>
      )}
    </div>
  );
}
