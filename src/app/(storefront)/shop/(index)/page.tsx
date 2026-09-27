import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { DepartmentRail } from "@/components/shop/department-rail";
import { ProductBrowser } from "@/components/shop/product-browser";
import { getCatalogMeta, queryProducts } from "@/data/products";
import { categories } from "@/data/categories";
import { getCollection } from "@/config/collections";
import {
  parseBrowseParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/browse-params";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Every product SAMRUX stocks, across all fourteen departments.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = (await props.searchParams) as RawSearchParams;
  const state = parseBrowseParams(searchParams);
  const [result, meta] = await Promise.all([
    queryProducts(toProductQuery(state)),
    getCatalogMeta(),
  ]);

  // A collection in the URL is the subject of the page, so the
  // heading says so instead of pretending this is the whole catalogue.
  const collection = state.collection ? getCollection(state.collection) : undefined;

  return (
    <Container className="py-14">
      <SectionHeading
        as="h1"
        eyebrow={
          collection
            ? "Collection"
            : `${meta.count} products · ${categories.length} departments`
        }
        title={collection?.title ?? "Shop everything"}
        description={
          collection?.blurb ??
          "One catalogue, filtered however you like. Every listing shows the real stock position and the price we actually charge."
        }
      />

      <DepartmentRail className="mt-10" />

      <ProductBrowser
        basePath="/shop"
        state={state}
        result={result}
        className="mt-12"
        emptyMessage="No products match those filters. Try clearing one."
      />
    </Container>
  );
}
