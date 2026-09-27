"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { revealItem } from "@/components/common/reveal";
import { BuyNowButton } from "@/components/product/buy-now-button";
import { CompareButton, WishlistButton } from "@/components/product/product-actions";
import { ProductBadges, StockBadge } from "@/components/product/product-badges";
import { ProductImage } from "@/components/product/product-image";
import { ProductChips } from "@/components/product/product-meta";
import { QuickAddButton } from "@/components/product/quick-add-button";
import { QuickViewTrigger } from "@/components/product/quick-view-trigger";
import { useClientToday } from "@/hooks/use-client-today";
import { shortDeliveryLabel } from "@/lib/delivery";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Product card.
 *
 * The hierarchy is the decision order a shopper actually uses: photograph →
 * name → who sells it → how it is rated → what it costs → when it arrives and
 * what it is covered by → buy. Brand sits above the name as a quiet eyebrow
 * because it qualifies the name rather than competing with it.
 *
 * Actions are always present rather than hover-only: hover is not a gesture a
 * touch device has, and a card whose primary action exists only under a mouse
 * is a card half the traffic cannot use. Hover still does the premium work —
 * the photo cross-fades to the second angle, the frame lifts, a gold hairline
 * warms in — but it never gates a control. `focus-within` mirrors every hover
 * rule, so the keyboard path is identical.
 */
export function ProductCard({
  product,
  priority = false,
  className,
  compact = false,
}: {
  product: Product;
  /** Set on the first row of the first grid on a page. */
  priority?: boolean;
  className?: string;
  /** Rails and cross-sells: drops the trust chips and the second action. */
  compact?: boolean;
}) {
  const today = useClientToday();
  const soldOut = product.stockStatus === "out_of_stock";
  const [lead, alternate] = product.images;
  const saving = discountPercent(product.price, product.compareAtPrice);

  return (
    <motion.article
      variants={revealItem}
      className={cn(
        "group/card @container/card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card",
        "transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:-translate-y-1 hover:border-gold/35 hover:shadow-premium",
        "focus-within:-translate-y-1 focus-within:border-gold/35 focus-within:shadow-premium",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-white">
        <Link href={`/shop/${product.slug}`} className="block" aria-label={product.name}>
          <div className="relative aspect-square w-full">
            {lead ? (
              <ProductImage
                src={lead.src}
                alt={lead.alt}
                gradient={lead.gradient}
                category={product.category}
                brand={product.brand}
                priority={priority}
                tone="studio"
                className={cn(
                  "absolute inset-0 size-full transition-opacity duration-700 ease-out",
                  alternate ? "group-hover/card:opacity-0" : "",
                  soldOut && "opacity-55 saturate-50",
                )}
                imageClassName="transition-transform duration-[900ms] ease-out group-hover/card:scale-[1.05]"
              />
            ) : (
              <div
                aria-hidden
                className={cn("absolute inset-0 size-full bg-linear-to-br", product.gradient)}
              />
            )}

            {/* Second angle, revealed on hover — the classic catalogue swap. */}
            {alternate ? (
              <ProductImage
                src={alternate.src}
                alt=""
                gradient={alternate.gradient}
                category={product.category}
                className={cn(
                  "absolute inset-0 size-full opacity-0 transition-opacity duration-700 ease-out group-hover/card:opacity-100",
                  soldOut && "saturate-50",
                )}
                imageClassName="scale-[1.03]"
              />
            ) : null}
          </div>
        </Link>

        <ProductBadges
          product={product}
          className="pointer-events-none absolute left-3 top-3 z-10"
        />

        {/* Save / compare rail, revealed on hover and by keyboard. */}
        <div
          className={cn(
            "absolute bottom-3 right-3 z-20 flex translate-y-2 flex-col gap-1.5 opacity-0 transition-all duration-300",
            "group-hover/card:translate-y-0 group-hover/card:opacity-100",
            "focus-within:translate-y-0 focus-within:opacity-100",
            // Touch has no hover, so on small screens the rail is simply there.
            "max-md:translate-y-0 max-md:opacity-100",
          )}
        >
          <WishlistButton product={product} />
          {compact ? null : <CompareButton product={product} />}
        </div>

        {soldOut ? (
          <span className="absolute inset-x-3 bottom-3 z-10 rounded-lg bg-background/90 px-3 py-1.5 text-center text-xs font-medium backdrop-blur-md">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {product.brand}
        </p>

        <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover/card:text-gold">
          <Link href={`/shop/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>


        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <StockBadge status={product.stockStatus} count={product.stockCount} />
        </div>

        {/* Price block: current price leads, the was-price sits beside it. */}
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "font-mono text-lg tabular-nums",
              saving ? "text-gold" : "text-foreground",
            )}
          >
            {formatPrice(product.price)}
          </span>

          {product.compareAtPrice ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>

        {compact ? null : (
          <ProductChips
            product={product}
            delivery={today && !soldOut ? shortDeliveryLabel(product, today) : null}
            className="mt-2"
          />
        )}

        {/* Actions pinned to the bottom so every card in a row lines up. */}
        <div className="relative z-10 mt-auto flex min-w-0 gap-1.5 pt-3.5">
          <QuickAddButton
            product={product}
            className="min-w-0 flex-1 max-[420px]:px-2.5"
          />
          {compact ? null : <BuyNowButton product={product} />}
          {/* Quick view is a pointer-device refinement; the PDP link covers it. */}
          <QuickViewTrigger
            product={product}
            className="max-sm:hidden @max-[14rem]/card:hidden"
          />
        </div>
      </div>
    </motion.article>
  );
}
