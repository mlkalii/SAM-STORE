import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { SearchBar } from "@/components/search/search-bar";
import { DepartmentRail } from "@/components/shop/department-rail";
import { ProductBrowser } from "@/components/shop/product-browser";
import { categoryBySlug } from "@/data/categories";
import { getCatalogMeta, queryProducts } from "@/data/products";
import {
  buildHref,
  parseBrowseParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/browse-params";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every SAMRUX product by name, brand, SKU or department.",
};

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = (await props.searchParams) as RawSearchParams;
  const state = parseBrowseParams(searchParams);
  const [result, meta] = await Promise.all([
    queryProducts(toProductQuery(state)),
    getCatalogMeta(),
  ]);

  const topCategories = result.facets.categories.slice(0, 5);

  return (
    <Container className="py-14">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
        {state.q ? (
          <>
            Results for <em className="italic">“{state.q}”</em>
          </>
        ) : (
          "Search"
        )}
      </h1>

      <p className="mt-3 text-muted-foreground">
        {state.q
          ? `${result.total.toLocaleString("en-US")} of ${meta.count} products match.`
          : `Search ${meta.count} products by name, brand, SKU or department.`}
      </p>

      <SearchBar className="mt-8 max-w-2xl" autoFocus={!state.q} />

      {state.q && topCategories.length > 0 ? (
        <nav aria-label="Matching departments" className="mt-6 flex flex-wrap gap-2">
          {topCategories.map((facet) => {
            const category = categoryBySlug.get(facet.value);
            if (!category) return null;
            return (
              <Link
                key={facet.value}
                href={buildHref(`/categories/${category.slug}`, { q: state.q })}
                className="rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                {category.name}
                <span className="ml-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {facet.count}
                </span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      {state.q ? (
        <ProductBrowser
          basePath="/search"
          state={state}
          result={result}
          className="mt-12"
          emptyMessage={`Nothing matched “${state.q}”. Check the spelling, or try a brand or department name.`}
        />
      ) : (
        <div className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Start with a department
          </p>
          <DepartmentRail className="mt-4" />
        </div>
      )}
    </Container>
  );
}
