import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryIcon } from "@/components/common/category-icon";
import { Container } from "@/components/common/container";
import { RevealGroup, revealItem } from "@/components/common/reveal";
import { MotionLink } from "@/components/common/motion-link";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

/**
 * Quick-access department strip, directly under the hero.
 *
 * The single most valuable thing a store homepage can do above the fold
 * is answer "where do I go" in one glance. Compact icon tiles rather than
 * photographic cards: a shopper scanning for a department is reading the word,
 * and a photograph at this size adds weight without adding meaning.
 *
 * Server component — no interactivity beyond the links, so it costs the client
 * bundle nothing.
 */
export function FeaturedCategories() {
  return (
    <Container as="section" aria-label="Shop by department" className="py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Shop by department
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
            Start where you already know
          </h2>
        </div>

        <Link
          href="/categories"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          All 15 departments
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <RevealGroup
        className="mt-7 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8"
        stagger={0.03}
      >
        {categories.slice(0, 8).map((category) => (
          <MotionLink
            key={category.slug}
            href={`/categories/${category.slug}`}
            variants={revealItem}
            className={cn(
              "group flex flex-col items-center gap-2.5 rounded-2xl border bg-card px-2 py-4 text-center",
              "transition-[transform,box-shadow,border-color] duration-400 ease-out",
              "hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-premium",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-11 items-center justify-center rounded-xl bg-linear-to-br text-white",
                "transition-transform duration-500 ease-out group-hover:scale-105",
                category.gradient,
              )}
            >
              <CategoryIcon name={category.icon} className="size-5" />
            </span>

            <span className="line-clamp-2 text-[11px] font-medium leading-tight sm:text-xs">
              {category.name}
            </span>
          </MotionLink>
        ))}
      </RevealGroup>
    </Container>
  );
}
