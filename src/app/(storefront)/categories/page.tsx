import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryIcon } from "@/components/common/category-icon";
import { Container } from "@/components/common/container";
import { MotionLink } from "@/components/common/motion-link";
import { RevealGroup, revealItem } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { categories } from "@/data/categories";
import { getProducts } from "@/data/products";
import { formatPrice, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Categories",
  description: "Fifteen departments, each curated to a short list of things worth owning.",
};

export default async function CategoriesPage() {
  const products = await getProducts();

  return (
    <Container className="py-14">
      <SectionHeading
        as="h1"
        eyebrow={`${categories.length} departments`}
        title="Browse by department"
        description="Each department is capped deliberately. We would rather stock thirty things we can stand behind than three thousand we cannot."
      />

      <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const items = products.filter((product) => product.category === category.slug);
          const cheapest = Math.min(...items.map((product) => product.price));
          // A representative photograph behind the gradient. `featured` first,
          // so the buyer's pick fronts the department.
          const cover =
            items.find((product) => product.featured && product.images[0])?.images[0] ??
            items.find((product) => product.images[0])?.images[0];

          return (
            <MotionLink
              key={category.slug}
              href={`/categories/${category.slug}`}
              variants={revealItem}
              className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-3xl p-7 text-white"
            >
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 -z-10 bg-linear-to-br transition-transform duration-700 group-hover:scale-105",
                  category.gradient,
                )}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- already-sized catalogue photo
                  <img
                    src={cover.src}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover opacity-55 mix-blend-luminosity transition-opacity duration-700 group-hover:opacity-70"
                  />
                ) : null}
              </div>
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/35 to-black/15"
              />

              <CategoryIcon
                name={category.icon}
                className="absolute right-6 top-6 size-9 text-white/45"
              />

              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                {pluralize(items.length, "product")} · from {formatPrice(cheapest)}
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">{category.name}</h2>
              <p className="mt-2 text-sm text-white/80">{category.tagline}</p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                Shop {category.name}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </MotionLink>
          );
        })}
      </RevealGroup>

      <p className="mt-10 text-sm text-muted-foreground">
        Prefer everything at once?{" "}
        <Link href="/shop" className="underline underline-offset-4">
          Browse the full catalogue
        </Link>
        .
      </p>
    </Container>
  );
}
