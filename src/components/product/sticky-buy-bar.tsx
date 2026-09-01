"use client";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { ProductImage } from "@/components/product/product-image";
import { WishlistButton } from "@/components/product/product-actions";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

/**
 * Sticky purchase bar.
 *
 * Appears once the main buy panel has scrolled out of view, so the price and
 * the primary action stay reachable through the specs. Uses an
 * IntersectionObserver against a sentinel rather than scroll maths.
 */
export function StickyBuyBar({
  product,
  sentinelId,
}: {
  product: Product;
  /** Element that, once above the viewport, reveals the bar. */
  sentinelId: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [visible, setVisible] = React.useState(false);
  const soldOut = product.stockStatus === "out_of_stock";

  React.useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show only when the sentinel has left upwards, not on first paint.
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: "-80px 0px 0px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  const variant = product.variants[0];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 sm:px-8">
            <ProductImage
              src={product.images[0]?.thumbnail ?? ""}
              alt={product.images[0]?.alt ?? product.name}
              gradient={product.gradient}
              category={product.category}
              sizes="56px"
              className="hidden size-12 shrink-0 rounded-lg sm:block"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice ? (
                  <span className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <WishlistButton product={product} className="hidden sm:inline-flex" />

              <Button
                variant="outline"
                disabled={soldOut}
                onClick={() => {
                  add(product, variant);
                  toast.success(`${product.name} added`);
                }}
              >
                <ShoppingBag className="size-4" aria-hidden />
                <span className="hidden sm:inline">Add to cart</span>
              </Button>

              <Button
                disabled={soldOut}
                onClick={() => {
                  add(product, variant);
                  router.push("/cart");
                }}
              >
                <Zap className="size-4" aria-hidden />
                {soldOut ? "Sold out" : "Buy now"}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
