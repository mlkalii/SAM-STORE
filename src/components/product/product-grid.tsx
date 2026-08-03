import { RevealGroup } from "@/components/common/reveal";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductGrid({
  products,
  className,
  priority = false,
  emptyMessage = "Nothing matches those filters yet — try widening them.",
}: {
  products: Product[];
  className?: string;
  /** Preload the first row — set on the primary grid of a page. */
  priority?: boolean;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-16 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <RevealGroup
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      stagger={0.04}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          // The first row is above the fold on most viewports: preload it and
          // let the rest lazy-load.
          priority={priority && index < 4}
        />
      ))}
    </RevealGroup>
  );
}
