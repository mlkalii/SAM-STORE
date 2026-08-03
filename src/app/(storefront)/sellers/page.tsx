import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Store } from "lucide-react";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { SellerCard } from "@/components/marketplace/seller-card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { sellerDirectory } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Sellers",
  description:
    "Every independent store trading on the SAMRUX marketplace, with ratings, departments and verification status.",
  alternates: { canonical: "/sellers" },
};

export default async function SellersPage() {
  const sellers = await sellerDirectory();
  const featured = sellers.filter((seller) => seller.featured);
  const rest = sellers.filter((seller) => !seller.featured);

  const totalProducts = sellers.reduce((total, seller) => total + seller.productCount, 0);
  const verified = sellers.filter((seller) => seller.verified).length;

  return (
    <div>
      <section className="border-b bg-surface">
        <Container className="py-14 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Marketplace
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl tracking-tight text-balance sm:text-5xl">
            {sellers.length} independent stores, one checkout
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
            Every seller on {siteConfig.name} is verified before they trade, holds the same
            30-day return promise, and ships to all fifty states. Buy from several in one
            basket and pay once.
          </p>

          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t pt-8">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Stores</dt>
              <dd className="mt-1 font-display text-3xl">{sellers.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Verified</dt>
              <dd className="mt-1 font-display text-3xl">{verified}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Products</dt>
              <dd className="mt-1 font-display text-3xl">{totalProducts.toLocaleString("en-US")}</dd>
            </div>
          </dl>
        </Container>
      </section>

      {featured.length > 0 ? (
        <section className="py-14 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Featured"
              title="Stores we recommend"
              description="Consistently high ratings, fast dispatch and a clean returns record."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="border-t bg-surface py-14 sm:py-20">
          <Container>
            <SectionHeading eyebrow="All stores" title="Every seller on SAMRUX" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t py-14 sm:py-20">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight sm:text-3xl">
              <Store className="size-5" aria-hidden />
              Sell on SAMRUX
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Reach every state, keep your own storefront, and get paid in USDT. Verification
              takes a couple of days and there is no listing fee.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="size-3.5" aria-hidden />
              Identity, business, tax and banking verification required before trading
            </p>
          </div>
          <Button size="lg" render={<Link href="/sell" />}>
            Start selling
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </Container>
      </section>
    </div>
  );
}
