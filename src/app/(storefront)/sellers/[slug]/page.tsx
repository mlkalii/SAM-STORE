import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  MapPin,
  MessageSquare,
  Package,
  Star,
  Truck,
  Users,
} from "lucide-react";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { FollowButton } from "@/components/marketplace/follow-button";
import { AskSellerForm } from "@/components/marketplace/ask-seller-form";
import { SellerReviewList } from "@/components/marketplace/seller-review-list";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductRail } from "@/components/product/product-rail";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { returnPolicy } from "@/config/returns";
import { formatStoreDate } from "@/config/store";
import { getCurrentUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { storefrontFor } from "@/lib/marketplace";
import { followStore } from "@/lib/marketplace/follows";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/sellers/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const seller = sellerStore.findBySlug(slug);
  if (!seller) notFound();

  return {
    title: seller.storeName,
    description: seller.storeDescription.slice(0, 160),
    alternates: { canonical: `/sellers/${seller.slug}` },
    openGraph: {
      type: "profile",
      title: `${seller.storeName} — ${siteConfig.name}`,
      description: seller.storeDescription.slice(0, 200),
    },
  };
}

export default async function SellerStorefrontPage(
  props: PageProps<"/sellers/[slug]">,
) {
  const { slug } = await props.params;

  const [data, user, csrfToken] = await Promise.all([
    storefrontFor(slug),
    getCurrentUser(),
    getCsrfToken(),
  ]);

  if (!data) notFound();
  const { seller, products, featured, collections, reviews } = data;

  const following = user ? followStore.isFollowing(seller.id, user.id) : false;

  const initials = seller.storeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div>
      {/* Banner */}
      <div
        className={cn("relative h-48 bg-linear-to-br sm:h-64", seller.gradient)}
      >
        {seller.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-supplied banner
          <img
            src={seller.bannerUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : null}
      </div>

      <Container className="pb-16">
        {/*
          `relative` matters: the banner above is positioned, and a positioned
          element paints over a static sibling — without this the logo is drawn
          underneath the banner it is meant to overlap.
        */}
        <header className="relative">
          {/*
            Only the logo overlaps the banner. The store name and its stats sit
            below it on the page background, so they are never white-on-banner
            and never depend on the banner's contrast.
          */}
          <span
            aria-hidden
            className={cn(
              "-mt-14 flex size-28 items-center justify-center rounded-2xl border-4 border-background bg-linear-to-br text-2xl font-semibold text-white",
              seller.gradient,
            )}
          >
            {seller.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- seller-supplied logo
              <img
                src={seller.logoUrl}
                alt=""
                className="size-full rounded-xl object-cover"
              />
            ) : (
              initials
            )}
          </span>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-3xl tracking-tight sm:text-4xl">
                <span className="min-w-0 truncate">{seller.storeName}</span>
                {seller.verified ? (
                  <BadgeCheck
                    className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-label="Verified seller"
                  />
                ) : null}
              </h1>

              <dl className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {seller.rating > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Star
                      className="size-3.5 fill-gold text-gold"
                      aria-hidden
                    />
                    <dt className="sr-only">Rating</dt>
                    <dd>
                      {seller.rating.toFixed(1)} ·{" "}
                      {seller.reviewCount.toLocaleString("en-US")} reviews
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5" aria-hidden />
                  <dt className="sr-only">Followers</dt>
                  <dd>
                    {seller.followerCount.toLocaleString("en-US")} followers
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="size-3.5" aria-hidden />
                  <dt className="sr-only">Products</dt>
                  <dd>{products.length.toLocaleString("en-US")} products</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  <dt className="sr-only">Location</dt>
                  <dd>
                    {seller.city}, {seller.state}
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden />
                  <dt className="sr-only">Joined</dt>
                  <dd>Selling since {formatStoreDate(seller.joinedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 gap-2">
              <FollowButton
                csrfToken={csrfToken}
                sellerId={seller.id}
                following={following}
                followerCount={seller.followerCount}
                signedIn={Boolean(user)}
              />
              <Button variant="outline" render={<Link href="#contact" />}>
                <MessageSquare className="size-4" aria-hidden />
                Ask a question
              </Button>
            </div>
          </div>
        </header>

        <p className="mt-6 max-w-3xl text-lg text-muted-foreground text-pretty">
          {seller.storeDescription}
        </p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y py-4 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Truck className="size-4" aria-hidden />
            Dispatched within {seller.dispatchHours} hours
          </li>
          <li className="flex items-center gap-2">
            <Package className="size-4" aria-hidden />
            {seller.returnWindowDays}-day returns
          </li>
          <li className="flex items-center gap-2">
            <BadgeCheck className="size-4" aria-hidden />
            {seller.verified
              ? "Fully verified seller"
              : "Verification in progress"}
          </li>
        </ul>

        {featured.length > 0 ? (
          <section className="mt-14">
            <SectionHeading
              eyebrow="Featured"
              title={`Picked by ${seller.storeName}`}
            />
            <ProductRail className="mt-8" products={featured} />
          </section>
        ) : null}

        {collections.length > 1 ? (
          <section className="mt-14">
            <SectionHeading eyebrow="Collections" title="Shop by department" />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <li key={collection.slug}>
                  <Link
                    href={`/categories/${collection.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-gold/40 hover:bg-surface"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">
                      {collection.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {collection.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14">
          <SectionHeading
            eyebrow="Catalogue"
            title={`Everything from ${seller.storeName}`}
            description={`${products.length.toLocaleString("en-US")} products, all shipping from ${seller.city}, ${seller.state}.`}
          />
          <ProductGrid
            className="mt-10"
            products={products.slice(0, 24)}
            emptyMessage="This store has no live products right now."
          />

          {products.length > 24 ? (
            <div className="mt-10 text-center">
              <Button
                variant="outline"
                render={<Link href={`/search?seller=${seller.slug}`} />}
              >
                See all {products.length.toLocaleString("en-US")} products
              </Button>
            </div>
          ) : null}
        </section>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Reviews"
            title="What buyers say about this store"
            description={`Store reviews are separate from product reviews and can only be left after a delivered order. Refunds follow the marketplace ${returnPolicy.windowDays}-day policy.`}
          />
          <div className="mt-8">
            <SellerReviewList
              reviews={reviews.map((review) => ({
                id: review.id,
                authorName: review.authorName,
                rating: review.rating,
                title: review.title,
                body: review.body,
                createdAt: review.createdAt,
                verifiedPurchase: review.verifiedPurchase,
                reply: review.reply,
              }))}
              storeName={seller.storeName}
            />
          </div>
        </section>

        <section id="contact" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Contact"
            title={`Message ${seller.storeName}`}
            description="Questions go straight to the seller. Public questions and their answers appear on the product page for the next shopper."
          />
          <div className="mt-8 max-w-2xl">
            <AskSellerForm
              csrfToken={csrfToken}
              sellerId={seller.id}
              sellerName={seller.storeName}
              signedIn={Boolean(user)}
            />
          </div>
        </section>
      </Container>
    </div>
  );
}
