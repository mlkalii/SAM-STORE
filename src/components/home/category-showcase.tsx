import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CategoryIcon } from "@/components/common/category-icon";
import { Container } from "@/components/common/container";
import { MotionLink } from "@/components/common/motion-link";
import { Reveal, RevealGroup, revealItem } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { categories } from "@/data/categories";
import { getProducts } from "@/data/products";
import { formatPrice, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Department grid. The first two tiles run wide so the block reads as an
 * editorial layout rather than a uniform marketplace wall.
 */
export async function CategoryShowcase() {
  const products = await getProducts();

  return (
    <Container as="section" className="py-24">
      <SectionHeading
        eyebrow="Departments"
        title={
          <>
            Fifteen departments, <em className="italic">each one capped</em>
          </>
        }
        description="Fifty-two products per department, and no more. When something better arrives, something else leaves — the shelf never just grows."
        action={
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
          >
            All departments
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => {
          const items = products.filter((product) => product.category === category.slug);
          const cheapest = Math.min(...items.map((product) => product.price));
          const wide = index < 2;
          const cover =
            items.find((product) => product.featured && product.images[0])?.images[0] ??
            items.find((product) => product.images[0])?.images[0];

          return (
            <MotionLink
              key={category.slug}
              href={`/categories/${category.slug}`}
              variants={revealItem}
              className={cn(
                "group relative flex flex-col justify-end overflow-hidden rounded-2xl p-6 text-white",
                wide ? "min-h-64 lg:col-span-2 lg:min-h-72" : "min-h-56",
              )}
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
                className={cn(
                  "absolute right-5 top-5 text-white/45",
                  wide ? "size-9" : "size-7",
                )}
              />

              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                {pluralize(items.length, "product")} · from {formatPrice(cheapest)}
              </p>
              <h3
                className={cn(
                  "mt-1.5 font-display tracking-tight",
                  wide ? "text-3xl" : "text-2xl",
                )}
              >
                {category.name}
              </h3>
              {wide ? (
                <p className="mt-2 max-w-sm text-sm text-white/80">{category.tagline}</p>
              ) : null}

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                Shop
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </MotionLink>
          );
        })}
      </RevealGroup>

      <Reveal className="mt-8">
        <p className="text-sm text-muted-foreground">
          Looking for something specific?{" "}
          <Link href="/search" className="underline underline-offset-4">
            Search all 780 products
          </Link>
          .
        </p>
      </Reveal>
    </Container>
  );
}
