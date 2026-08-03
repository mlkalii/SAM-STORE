import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { FlashCountdown } from "@/components/home/flash-countdown";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getDeals } from "@/data/products";

/**
 * Flash deals: the four deepest current reductions, on a darker inset panel so
 * the block reads as a distinct event rather than another product row.
 */
export async function FlashDeals() {
  const deals = await getDeals(4);
  if (deals.length === 0) return null;

  const deepest = deals[0]?.discountPercent ?? 0;

  return (
    <Container as="section" className="py-16 sm:py-20">
      <Reveal className="relative overflow-hidden rounded-3xl border bg-surface p-6 shadow-premium sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/2 size-[30rem] -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
              <Zap className="size-3.5" aria-hidden />
              Flash deals
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">
              Today only, up to <span className="text-gold-gradient">{deepest}% off</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground text-pretty">
              A rotating handful of the deepest reductions in the catalogue. When the clock
              resets, so does the selection.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <FlashCountdown />
            <Button variant="outline" render={<Link href="/deals" />}>
              All reduced items
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <ProductGrid products={deals} className="relative mt-12" />
      </Reveal>
    </Container>
  );
}
