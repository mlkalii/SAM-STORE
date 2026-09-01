"use client";

import { AnimatePresence, motion } from "motion/react";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-product-lists";
import { formatPrice, pluralize } from "@/lib/format";

export function WishlistView() {
  const { items, count, remove, clear } = useWishlist();

  if (count === 0) {
    return (
      <div className="mt-12 rounded-3xl border border-dashed p-16 text-center">
        <Heart className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-4 font-display text-2xl">Nothing saved yet</p>
        <p className="mt-2 text-muted-foreground">
          Tap the heart on any product to keep it here. Saved items persist in this browser.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/categories" />}>Browse departments</Button>
          <Button variant="outline" render={<Link href="/deals" />}>
            See current deals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pluralize(count, "saved item")}</p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear wishlist
        </Button>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="group relative flex flex-col"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <Link href={`/shop/${item.slug}`} aria-label={item.name}>
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    gradient={item.gradient}
                    category={item.category}
                    brand={item.brand}
                    className="aspect-square w-full"
                    imageClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>

                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute right-3 top-3 z-20 rounded-full shadow-sm"
                  aria-label={`Remove ${item.name} from wishlist`}
                  onClick={() => remove(item.slug)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>

              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {item.brand}
              </p>
              <h2 className="mt-1 text-sm font-medium leading-snug">
                <Link href={`/shop/${item.slug}`} className="after:absolute after:inset-0">
                  {item.name}
                </Link>
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-sm tabular-nums">{formatPrice(item.price)}</span>
                {item.compareAtPrice ? (
                  <span className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(item.compareAtPrice)}
                  </span>
                ) : null}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}
