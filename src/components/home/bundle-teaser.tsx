import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { getBestSellers, getBundleCompanions } from "@/data/products";
import { formatPrice } from "@/lib/format";

/**
 * "Frequently bought together" on the homepage.
 *
 * Uses the same bundle logic as the product page, anchored to the current top
 * seller, and links through to the full interactive bundle rather than
 * duplicating the basket UI here.
 */
export async function BundleTeaser() {
  const [anchor] = await getBestSellers(1);
  if (!anchor) return null;

  const companions = await getBundleCompanions(anchor, 2);
  if (companions.length === 0) return null;

  const bundle = [anchor, ...companions];
  const total = bundle.reduce((sum, product) => sum + product.price, 0);
  const saving = Math.round(companions.reduce((sum, product) => sum + product.price, 0) * 0.1);

  return (
    <Container as="section" className="py-16 sm:py-20">
      <Reveal className="overflow-hidden rounded-3xl border bg-card p-6 shadow-premium sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
              <Layers className="size-3.5" aria-hidden />
              Frequently bought together
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              The {anchor.name}, and what people add to it
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Buy the three together and the add-ons come down by {formatPrice(saving)}. Untick
              anything you already own on the product page.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button render={<Link href={`/shop/${anchor.slug}`} />}>
                Build the bundle
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <span className="font-mono text-lg tabular-nums text-gold">
                {formatPrice(total - saving)}
              </span>
            </div>
          </div>

          <ul className="flex flex-wrap items-center gap-3">
            {bundle.map((product) => (
              <li key={product.slug}>
                <Link href={`/shop/${product.slug}`} aria-label={product.name}>
                  <ProductImage
                    src={product.images[0]?.thumbnail ?? ""}
                    alt={product.images[0]?.alt ?? product.name}
                    gradient={product.gradient}
                    category={product.category}
                    sizes="144px"
                    className="size-28 rounded-2xl sm:size-32"
                    imageClassName="transition-transform duration-500 hover:scale-105"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Container>
  );
}
