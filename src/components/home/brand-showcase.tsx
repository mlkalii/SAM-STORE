import Link from "next/link";

import { Container } from "@/components/common/container";
import { MotionDiv } from "@/components/common/motion-div";
import { RevealGroup, revealItem } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { getProducts } from "@/data/products";
import { formatPrice } from "@/lib/format";

/**
 * Brand showcase.
 *
 * Ranked by catalogue depth and average rating rather than alphabetically, so
 * the block says something. Each tile links into a pre-filtered shop view.
 */
export async function BrandShowcase() {
  const products = await getProducts();

  const byBrand = new Map<
    string,
    { count: number; ratingSum: number; cheapest: number; departments: Set<string> }
  >();

  for (const product of products) {
    const entry = byBrand.get(product.brand) ?? {
      count: 0,
      ratingSum: 0,
      cheapest: Number.POSITIVE_INFINITY,
      departments: new Set<string>(),
    };
    entry.count += 1;
    entry.ratingSum += product.rating;
    entry.cheapest = Math.min(entry.cheapest, product.price);
    entry.departments.add(product.category);
    byBrand.set(product.brand, entry);
  }

  const brands = [...byBrand.entries()]
    .map(([brand, entry]) => ({
      brand,
      count: entry.count,
      rating: entry.ratingSum / entry.count,
      cheapest: entry.cheapest,
      departments: entry.departments.size,
    }))
    .sort((a, b) => b.count * b.rating - a.count * a.rating)
    .slice(0, 12);

  return (
    <Container as="section" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="House brands"
        title={
          <>
            The makers we <em className="italic">buy from twice</em>
          </>
        }
        description="Every brand here passed the same four tests — serviceable, honestly specified, properly supported, priced without theatre."
      />

      <RevealGroup
        className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3 lg:grid-cols-4"
        stagger={0.03}
      >
        {brands.map((entry) => (
          <MotionDiv key={entry.brand} variants={revealItem} className="bg-surface">
            <Link
              href={`/shop?brand=${encodeURIComponent(entry.brand)}`}
              className="group flex h-full flex-col justify-between gap-6 p-5 transition-colors hover:bg-surface-raised sm:p-6"
            >
              <span className="block font-display text-xl tracking-tight transition-colors group-hover:text-gold sm:text-2xl">
                {entry.brand}
              </span>

              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>{entry.count} products</span>
                <span aria-hidden className="text-gold/40">
                  ·
                </span>
                <span>from {formatPrice(entry.cheapest)}</span>
              </span>
            </Link>
          </MotionDiv>
        ))}
      </RevealGroup>
    </Container>
  );
}
