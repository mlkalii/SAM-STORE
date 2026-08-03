"use client";

import Link from "next/link";
import * as React from "react";

import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { useRecentlyViewed } from "@/hooks/use-product-lists";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Records a product view. Mounted on the PDP; writes to an external store, so
 * nothing re-renders as a result.
 */
export function RecordRecentlyViewed({ product }: { product: Product }) {
  const { record } = useRecentlyViewed();

  React.useEffect(() => {
    record(product);
  }, [record, product]);

  return null;
}

/**
 * Recently-viewed rail. Renders nothing until there is history to show, and
 * excludes the product currently on screen.
 */
export function RecentlyViewedRail({
  excludeSlug,
  className,
  title = "Recently viewed",
  emptyState = null,
}: {
  excludeSlug?: string;
  className?: string;
  title?: string;
  /**
   * Rendered instead of nothing when there is no history. The standalone
   * pages pass a real empty state; embeds keep the default and vanish.
   */
  emptyState?: React.ReactNode;
}) {
  const { items, clear } = useRecentlyViewed();
  const visible = items.filter((item) => item.slug !== excludeSlug);

  if (visible.length === 0) return <>{emptyState}</>;

  return (
    <section aria-labelledby="recently-viewed-heading" className={cn(className)}>
      <div className="flex items-end justify-between gap-4">
        <h2
          id="recently-viewed-heading"
          className="font-display text-3xl tracking-tight sm:text-4xl"
        >
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear history
        </Button>
      </div>

      <ul className="-mx-5 mt-8 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {visible.map((item) => (
          <li key={item.slug} className="w-40 shrink-0 sm:w-48">
            <Link href={`/shop/${item.slug}`} className="group block">
              <ProductImage
                src={item.image}
                alt={item.name}
                gradient={item.gradient}
                category={item.category}
                sizes="192px"
                className="aspect-square w-full rounded-xl"
                imageClassName="transition-transform duration-500 group-hover:scale-105"
              />
              <p className="mt-3 truncate text-xs text-muted-foreground">{item.brand}</p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
              <p className="mt-1 font-mono text-sm tabular-nums">{formatPrice(item.price)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
