import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductRail } from "@/components/product/product-rail";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * A homepage product section.
 *
 * Eight of the homepage blocks are "heading + products + a link to more"; this
 * is that block, so the page file reads as an outline rather than a wall of
 * repeated markup. `layout` picks a grid or a horizontal rail, and `tone`
 * alternates the background so sections separate without rules everywhere.
 */
export function ProductSection({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  products,
  layout = "grid",
  tone = "plain",
  priority = false,
  id,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  href: string;
  linkLabel: string;
  products: Product[];
  layout?: "grid" | "rail";
  tone?: "plain" | "surface";
  priority?: boolean;
  id?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section id={id} className={cn(tone === "surface" && "bg-surface")}>
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={
            <Button variant="outline" render={<Link href={href} />}>
              {linkLabel}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          }
        />

        {layout === "rail" ? (
          <Reveal className="mt-12">
            <ProductRail products={products} />
          </Reveal>
        ) : (
          <ProductGrid products={products} className="mt-12" priority={priority} />
        )}
      </Container>
    </section>
  );
}
