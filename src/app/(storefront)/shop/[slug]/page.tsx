import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";

import { Container } from "@/components/common/container";
import { BuyPanel } from "@/components/product/buy-panel";
import { StockBadge } from "@/components/product/product-badges";
import { ProductGallery } from "@/components/product/product-gallery";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { storeConfig } from "@/config/store";
import { returnEligibility, returnPolicy } from "@/config/returns";
import { warrantyFor } from "@/config/warranty";
import { formatPrice } from "@/lib/format";
import { getCategory } from "@/data/categories";
import { getProduct, getProducts } from "@/data/products";
import { breadcrumbJsonLd, productJsonLd, jsonLd } from "@/lib/structured-data";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const title = product.name;

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

export default async function ProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);

  // What warranty the department carries and whether it can be returned at all.
  const warranty = warrantyFor(product.category);
  const eligibility = returnEligibility(product);

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
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-3 text-lg text-muted-foreground text-pretty">
              {product.shortDescription}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <StockBadge status={product.stockStatus} count={product.stockCount} />
              <span className="font-mono text-xs">SKU {product.sku}</span>
            </div>

            <div className="mt-8">
              <BuyPanel product={product} />
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Sold and shipped directly by {storeConfig.legalName}.
            </p>

            <Accordion className="mt-10">
              <AccordionItem value="description">
                <AccordionTrigger>Product details</AccordionTrigger>
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

              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping &amp; returns</AccordionTrigger>
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
    </>
  );
}
