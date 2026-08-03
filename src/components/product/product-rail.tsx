"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Horizontal product rail.
 *
 * Used for trending on the homepage and for cross-sell / recommendations on the
 * PDP. Native scroll with CSS snap — so touch, trackpad and mouse-wheel all
 * behave the way the platform expects — with arrow buttons layered on for
 * pointer users. The arrows disable themselves at each end.
 */
export function ProductRail({
  products,
  className,
  itemClassName,
}: {
  products: Product[];
  className?: string;
  itemClassName?: string;
}) {
  const scroller = React.useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const sync = React.useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    setAtStart(node.scrollLeft < 8);
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    const node = scroller.current;
    if (!node) return;

    // Reading layout inside rAF keeps the first measurement off the paint path.
    const raf = window.requestAnimationFrame(sync);
    node.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    return () => {
      window.cancelAnimationFrame(raf);
      node.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function scrollByPage(direction: 1 | -1) {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={scroller}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
      >
        {products.map((product, index) => (
          <li
            key={product.slug}
            className={cn(
              "w-[62vw] shrink-0 snap-start sm:w-64 lg:w-72",
              itemClassName,
            )}
          >
            <ProductCard product={product} priority={index < 2} compact />
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute -top-14 right-0 hidden gap-2 sm:flex">
        <Button
          variant="outline"
          size="icon-sm"
          className="pointer-events-auto rounded-full"
          aria-label="Scroll left"
          disabled={atStart}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className="pointer-events-auto rounded-full"
          aria-label="Scroll right"
          disabled={atEnd}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
