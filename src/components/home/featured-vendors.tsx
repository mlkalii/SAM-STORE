import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { SellerCard } from "@/components/marketplace/seller-card";
import { Button } from "@/components/ui/button";
import { sellerDirectory } from "@/lib/marketplace";

/**
 * Featured vendors.
 *
 * A marketplace homepage that never shows its sellers is a catalogue wearing a
 * marketplace's clothes. This block credits the independent stores by name,
 * with the numbers that let a shopper judge them — rating, review count,
 * catalogue size and verification.
 *
 * Reuses `SellerCard` from the seller directory rather than a homepage-only
 * variant, so the two can never drift apart.
 */
export async function FeaturedVendors() {
  const sellers = await sellerDirectory();
  const featured = sellers.filter((seller) => seller.featured).slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="bg-surface">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Featured vendors"
          title={
            <>
              Independent stores, <em className="italic">one checkout</em>
            </>
          }
          description={`${sellers.length} verified sellers trade on SAMRUX. Buy from several in one basket, pay once, and every order carries the same return promise.`}
          action={
            <Button variant="outline" render={<Link href="/sellers" />}>
              All sellers
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          }
        />

        <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </Reveal>

        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Store className="size-3.5" aria-hidden />
          Run a store?{" "}
          <Link href="/sell" className="underline underline-offset-4 hover:text-foreground">
            Sell on SAMRUX
          </Link>
        </p>
      </Container>
    </section>
  );
}
