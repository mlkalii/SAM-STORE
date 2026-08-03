import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { CategoryIcon } from "@/components/common/category-icon";
import { Container } from "@/components/common/container";
import { DepartmentRail } from "@/components/shop/department-rail";
import { ProductBrowser } from "@/components/shop/product-browser";
import { categories, getCategory } from "@/data/categories";
import { getProductsByCategory, queryProducts } from "@/data/products";
import {
  parseBrowseParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/browse-params";
import { formatPrice, pluralize } from "@/lib/format";
import { breadcrumbJsonLd, categoryJsonLd, jsonLd } from "@/lib/structured-data";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(
  props: PageProps<"/categories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = getCategory(slug);
  if (!category) notFound();

  return {
    title: category.name,
    description: category.description,
    openGraph: { title: `${category.name} — SAMRUX`, description: category.description },
  };
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const category = getCategory(slug);
  if (!category) notFound();

  const searchParams = (await props.searchParams) as RawSearchParams;
  const state = parseBrowseParams(searchParams);
  const [result, all] = await Promise.all([
    queryProducts(toProductQuery(state, { category: category.slug })),
    getProductsByCategory(category.slug),
  ]);

  const cheapest = Math.min(...all.map((product) => product.price));
  const onSale = all.filter((product) => product.discountPercent > 0).length;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(categoryJsonLd(category, all, siteConfig.url)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: "Categories", url: "/categories" },
                { name: category.name, url: `/categories/${category.slug}` },
              ],
              siteConfig.url,
            ),
          ),
        }}
      />

      {/* Banner */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className={cn("absolute inset-0 -z-10 bg-linear-to-br", category.gradient)}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/35" />

        <Container className="py-16 text-white sm:py-20">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-white/70"
          >
            <Link href="/categories" className="hover:text-white">
              Categories
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-white">{category.name}</span>
          </nav>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <CategoryIcon name={category.icon} className="size-10 text-white/70" />
              <h1 className="mt-5 font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl">
                {category.name}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/85 text-pretty">
                {category.description}
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-6 lg:text-right">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Products
                </dt>
                <dd className="mt-1 font-display text-3xl">{all.length}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                  From
                </dt>
                <dd className="mt-1 font-display text-3xl">{formatPrice(cheapest)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                  On sale
                </dt>
                <dd className="mt-1 font-display text-3xl">{onSale}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
            {category.subcategories.join(" · ")}
          </p>
        </Container>
      </section>

      <Container className="py-12">
        <DepartmentRail activeSlug={category.slug} />

        <ProductBrowser
          basePath={`/categories/${category.slug}`}
          state={state}
          result={result}
          className="mt-10"
          emptyMessage={`Nothing in ${category.name} matches those filters — try clearing one.`}
        />

        <p className="mt-12 text-sm text-muted-foreground">
          {pluralize(all.length, "product")} in {category.name}.{" "}
          <Link href="/shop" className="underline underline-offset-4">
            Search the whole catalogue
          </Link>{" "}
          instead.
        </p>
      </Container>
    </>
  );
}
