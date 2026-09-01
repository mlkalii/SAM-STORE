"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BuyPanel } from "@/components/product/buy-panel";
import { CompareButton, ShareButton, WishlistButton } from "@/components/product/product-actions";
import { ProductBadges, StockBadge } from "@/components/product/product-badges";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Quick view: enough of the PDP to make a decision without leaving the grid.
 * Reuses `BuyPanel` verbatim so variant/price/stock logic exists in one place.
 *
 * Controlled, and loaded on demand by `QuickViewTrigger` — the dialog, the buy
 * panel and their dependencies stay out of the listing bundle until a shopper
 * actually opens one.
 */
export function QuickViewDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [active, setActive] = React.useState(0);
  const image = product.images[active] ?? product.images[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="bg-muted p-5">
            <ProductImage
              src={image.src}
              alt={image.alt}
              gradient={image.gradient}
              category={product.category}
              brand={product.brand}
              sizes="(min-width: 768px) 40vw, 90vw"
              className="aspect-square w-full rounded-xl"
            />

            <div className="mt-3 flex gap-2">
              {product.images.slice(0, 5).map((thumb, index) => (
                <button
                  key={thumb.id}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={thumb.alt}
                  aria-current={index === active}
                  className={cn(
                    "overflow-hidden rounded-lg ring-2 transition",
                    index === active ? "ring-foreground" : "opacity-60 ring-transparent hover:opacity-100",
                  )}
                >
                  <ProductImage
                    src={thumb.thumbnail}
                    alt={thumb.alt}
                    gradient={thumb.gradient}
                    category={product.category}
                    sizes="72px"
                    className="size-14"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <DialogHeader className="p-0 text-left">
              <ProductBadges product={product} className="mb-3" />
              <DialogTitle className="font-display text-2xl leading-tight">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-left">
                {product.brand} · {product.subcategory}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <StockBadge status={product.stockStatus} count={product.stockCount} />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.shortDescription}
            </p>

            <div className="mt-6">
              <BuyPanel product={product} compact />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <WishlistButton product={product} variant="labelled" className="flex-1" />
              <CompareButton product={product} variant="labelled" className="flex-1" />
              <ShareButton product={product} variant="icon" />
            </div>

            <Button
              variant="link"
              className="mt-4 px-0"
              render={<Link href={`/shop/${product.slug}`} onClick={() => onOpenChange(false)} />}
            >
              Full details and specifications
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
