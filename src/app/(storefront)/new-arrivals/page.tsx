import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { DepartmentRail } from "@/components/shop/department-rail";
import { ProductBrowser } from "@/components/shop/product-browser";
import { getNewArrivals, queryProducts } from "@/data/products";
import {
  parseBrowseParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/browse-params";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The most recent additions to the SAMRUX catalogue.",
};

export default async function NewArrivalsPage(props: PageProps<"/new-arrivals">) {
  const searchParams = (await props.searchParams) as RawSearchParams;
  const state = parseBrowseParams(searchParams);
  const result = await queryProducts({
    ...toProductQuery(state, { scope: "new" }),
    sort: state.sort ?? "new",
  });

  const all = await getNewArrivals();

  return (
    <Container className="py-14">
      <SectionHeading
        as="h1"
        eyebrow={`${all.length} recently added`}
        title={
          <>
            New <em className="italic">arrivals</em>
          </>
        }
        description="Six new products per department, added as they clear evaluation. Nothing lands here until we have used it ourselves."
      />

      <DepartmentRail className="mt-10" />

      <ProductBrowser
        basePath="/new-arrivals"
        state={state}
        result={result}
        className="mt-10"
        emptyMessage="No new arrivals match those filters."
      />
    </Container>
  );
}
