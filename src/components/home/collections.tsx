import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/common/container";
import { MotionLink } from "@/components/common/motion-link";
import { RevealGroup, revealItem } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { collections, inCollection } from "@/config/collections";
import { getProducts } from "@/data/products";
import { formatPrice, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Shop by collection.
 *
 * Departments answer "what kind of thing is this"; collections answer "what am
 * I trying to do". A shopper setting up a home office does not think in terms
 * of Office Products *and* Computers *and* Furniture — they think in terms of
 * the room. Each collection is a saved catalogue query, so nothing is curated
 * by hand and nothing can go stale.
 */

export async function Collections() {
  const products = await getProducts();

  const rows = collections.map((collection) => {
    const items = products.filter((product) => inCollection(product, collection));

    return {
      ...collection,
      href: `/shop?collection=${collection.slug}`,
      count: items.length,
      from: items.length > 0 ? Math.min(...items.map((product) => product.price)) : 0,
      // Three thumbnails give the tile a sense of what is inside without
      // committing the space a full product grid would need.
      thumbnails: items
        .filter((product) => product.featured && product.images[0])
        .slice(0, 3)
        .map((product) => ({ slug: product.slug, src: product.images[0].thumbnail })),
    };
  }).filter((collection) => collection.count > 0);

  if (rows.length === 0) return null;

  return (
    <Container as="section" className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Collections"
        title={
          <>
            Shop by <em className="italic">what you are doing</em>
          </>
        }
        description="Cross-department edits for the jobs people actually shop for, rather than the aisles a warehouse is organised into."
        action={
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-sm underline underline-offset-4"
          >
            Browse everything
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        }
      />

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2" stagger={0.06}>
        {rows.map((collection) => (
          <MotionLink
            key={collection.slug}
            href={collection.href}
            variants={revealItem}
            className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl p-6 text-white"
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 -z-10 bg-linear-to-br transition-transform duration-700 ease-out group-hover:scale-105",
                collection.gradient,
              )}
            />
            <span aria-hidden className="absolute inset-0 -z-10 bg-black/25" />

            {collection.thumbnails.length > 0 ? (
              <span aria-hidden className="absolute right-5 top-5 flex -space-x-3">
                {collection.thumbnails.map((thumb) => (
                  // eslint-disable-next-line @next/next/no-img-element -- already-sized catalogue thumbnails
                  <img
                    key={thumb.slug}
                    src={thumb.src}
                    alt=""
                    loading="lazy"
                    className="size-14 rounded-xl border-2 border-white/25 object-cover shadow-lg transition-transform duration-500 group-hover:-translate-y-0.5"
                  />
                ))}
              </span>
            ) : null}

            <h3 className="font-display text-2xl tracking-tight sm:text-3xl">{collection.title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80 text-pretty">
              {collection.blurb}
            </p>

            <p className="mt-4 flex items-center gap-3 text-xs text-white/70">
              <span>{pluralize(collection.count, "product")}</span>
              <span aria-hidden>·</span>
              <span>from {formatPrice(collection.from)}</span>
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </p>
          </MotionLink>
        ))}
      </RevealGroup>
    </Container>
  );
}
