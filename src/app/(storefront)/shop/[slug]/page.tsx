import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { BuyPanel } from "@/components/product/buy-panel";
import { CompareButton, CopySkuButton, ShareButton, WishlistButton } from "@/components/product/product-actions";
import { DeliveryLine, ProductAssurances } from "@/components/product/product-assurances";
import { ProductBadges, StockBadge } from "@/components/product/product-badges";
import { ProductGallery } from "@/components/product/product-gallery";
import { FrequentlyBoughtTogether } from "@/components/product/frequently-bought-together";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductRail } from "@/components/product/product-rail";
import { UpsellCard } from "@/components/product/upsell-card";
import { RecentlyViewedRail, RecordRecentlyViewed } from "@/components/product/recently-viewed";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { returnEligibility, returnPolicy } from "@/config/returns";
import { warrantyFor } from "@/config/warranty";
import { getCurrentUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { messaging } from "@/lib/marketplace/messaging";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { toPublicSeller } from "@/lib/marketplace/seller-store";
import { SellerBlock } from "@/components/marketplace/seller-block";
import { formatPrice } from "@/lib/format";
import { getCategory } from "@/data/categories";
import {
  getBundleCompanions,
  getByBrand,
  getProduct,
  getProducts,
  getRecommended,
  getRelated,
  getUpsell,
} from "@/data/products";
import { breadcrumbJsonLd, productJsonLd, jsonLd } from "@/lib/structured-data";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const title = `${product.name} — ${product.brand}`;

  return {
    title,
    description: product.shortDescription,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description: product.shortDescription,
      ...(product.images[0]
        ? {
            images: [
              {
                url: product.images[0].src,
                width: 1200,
                height: 1200,
                alt: product.images[0].alt,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.shortDescription,
      ...(product.images[0] ? { images: [product.images[0].src] } : {}),
    },
  };
}

const BUY_SENTINEL = "buy-panel-sentinel";

export default async function ProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const [related, sameBrand, companions, recommended, upsell] = await Promise.all([
    getRelated(product, 4),
    getByBrand(product.brand, product.slug, 4),
    getBundleCompanions(product, 2),
    getRecommended(product, 10),
    getUpsell(product),
  ]);

  // Marketplace context: who sells it, what warranty the department carries and
  // whether it can be returned at all.
  const seller = product.sellerId ? sellerStore.find(product.sellerId) : undefined;
  const warranty = warrantyFor(product.category);
  const eligibility = returnEligibility(product);
  const [user, csrfToken] = await Promise.all([getCurrentUser(), getCsrfToken()]);
  const questions = messaging.publicQuestions(product.slug);

  const breadcrumbs = [
    { name: "Shop", url: "/shop" },
    { name: category?.name ?? product.category, url: `/categories/${product.category}` },
    { name: product.name, url: `/shop/${product.slug}` },
  ];

  return (
    <>
      {/* Rich result markup for the product and its offer. */}
      <script
        type="application/ld+json"
        // Serialised server-side from our own data — no user input involved.
        dangerouslySetInnerHTML={{
          __html: jsonLd(productJsonLd(product, siteConfig.url)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(breadcrumbJsonLd(breadcrumbs, siteConfig.url)),
        }}
      />

      <RecordRecentlyViewed product={product} />

      <Container className="py-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={`/categories/${product.category}`} className="hover:text-foreground">
            {category?.name ?? product.category}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link
            href={`/categories/${product.category}?sub=${encodeURIComponent(product.subcategory)}`}
            className="hover:text-foreground"
          >
            {product.subcategory}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          <ProductGallery product={product} />

          <div className="lg:sticky lg:top-32 lg:self-start">
            <ProductBadges product={product} limit={3} />

            <p className="mt-4">
              <Link
                href={`/shop?brand=${encodeURIComponent(product.brand)}`}
                className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {product.brand}
              </Link>
            </p>

            <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-3 text-lg text-muted-foreground text-pretty">
              {product.shortDescription}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <StockBadge status={product.stockStatus} count={product.stockCount} />
              <CopySkuButton sku={product.sku} />
            </div>

            <div className="mt-8">
              <BuyPanel product={product} />
            </div>

            <div id={BUY_SENTINEL} aria-hidden className="h-px" />

            <div className="mt-5 flex flex-wrap gap-2">
              <WishlistButton product={product} variant="labelled" className="flex-1" />
              <CompareButton product={product} variant="labelled" className="flex-1" />
              <ShareButton product={product} variant="labelled" className="flex-1" />
            </div>

            {upsell ? <UpsellCard current={product} upgrade={upsell} className="mt-5" /> : null}

            <div className="mt-5">
              <DeliveryLine product={product} />
            </div>

            <ProductAssurances product={product} className="mt-6" />

            <Accordion className="mt-10">
              <AccordionItem value="description">
                <AccordionTrigger>Description</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-muted-foreground">
                    {product.longDescription.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="leading-relaxed text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features">
                <AccordionTrigger>Features</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2.5">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="specifications">
                <AccordionTrigger>Specifications</AccordionTrigger>
                <AccordionContent>
                  <dl className="divide-y">
                    {product.specifications.map((spec) => (
                      <div
                        key={spec.label}
                        className="grid grid-cols-[9rem_1fr] gap-4 py-2.5 text-sm"
                      >
                        <dt className="text-muted-foreground">{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="brand">
                <AccordionTrigger>About {product.brand}</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed text-pretty">
                    {product.brand} builds for the {category?.name.toLowerCase() ?? "range"}{" "}
                    department under our standard supplier terms: published spare-part
                    availability, a named support contact, and a factory audit before the first
                    order. We stock {sameBrand.length + 1} of their products.
                  </p>
                  {sameBrand.length > 0 ? (
                    <Link
                      href={`/shop?brand=${encodeURIComponent(product.brand)}`}
                      className="inline-block text-foreground underline underline-offset-4"
                    >
                      See everything by {product.brand}
                    </Link>
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="seller">
                <AccordionTrigger>Sold and shipped by</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {seller ? (
                    <SellerBlock
                      seller={toPublicSeller(seller)}
                      csrfToken={csrfToken}
                      productSlug={product.slug}
                      signedIn={Boolean(user)}
                      questions={questions.map((thread) => ({
                        id: thread.id,
                        subject: thread.subject,
                        answer:
                          messaging
                            .messages(thread.id)
                            .filter((message) => message.authorRole === "seller")
                            .at(-1)?.body ?? "",
                      }))}
                    />
                  ) : (
                    <p>Sold and shipped by {siteConfig.name}.</p>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping, warranty &amp; returns</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p className="leading-relaxed">
                    Dispatched within {product.dispatchHours} hours on a tracked service to any of
                    the fifty US states, free over{" "}
                    {formatPrice(siteConfig.freeShippingThreshold)}.
                  </p>
                  {/* Warranty comes from the department, never from the product row. */}
                  <p className="leading-relaxed">{warranty.summary}</p>
                  <p className="leading-relaxed">
                    {eligibility.returnable
                      ? `${returnPolicy.windowDays} days from delivery to change your mind — unused and in its original packaging wherever possible. Incorrect or defective items ship back free, and refunds reach ${returnPolicy.refundTo} within ${returnPolicy.refundBusinessDaysMin}–${returnPolicy.refundBusinessDaysMax} business days of approval.`
                      : `${eligibility.rule?.label}: non-returnable unless defective. ${eligibility.rule?.reason}`}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Container>

      {companions.length > 0 ? (
        <Container as="section" className="py-16">
          <FrequentlyBoughtTogether anchor={product} companions={companions} />
        </Container>
      ) : null}

      <Container as="section" className="py-16">
        <SectionHeading
          eyebrow="You may also like"
          title="Recommended for you"
          description="Strong products from other departments in a similar price band."
        />
        <Reveal className="mt-12">
          <ProductRail products={recommended} />
        </Reveal>
      </Container>

      <Container as="section" className="py-16">
        <SectionHeading
          eyebrow={category?.name ?? "Related"}
          title="Pairs well with"
          description={`More from ${category?.name ?? "this department"}, chosen by the people who buy this one.`}
        />
        <Reveal className="mt-12">
          <ProductGrid products={related} />
        </Reveal>
      </Container>

      {sameBrand.length > 0 ? (
        <Container as="section" className="py-16">
          <SectionHeading eyebrow={product.brand} title={`More from ${product.brand}`} />
          <Reveal className="mt-12">
            <ProductGrid products={sameBrand} />
          </Reveal>
        </Container>
      ) : null}

      <Container as="section" className="py-16">
        <RecentlyViewedRail excludeSlug={product.slug} />
      </Container>

      <StickyBuyBar product={product} sentinelId={BUY_SENTINEL} />
    </>
  );
}
