import type { Metadata } from "next";
import { Tag } from "lucide-react";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { DepartmentRail } from "@/components/shop/department-rail";
import { ProductBrowser } from "@/components/shop/product-browser";
import { getDeals, queryProducts } from "@/data/products";
import {
  parseBrowseParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/browse-params";

export const metadata: Metadata = {
  title: "Deals",
  description: "Everything currently reduced across all ten SAMRUX departments.",
};

export default async function DealsPage(props: PageProps<"/deals">) {
  const searchParams = (await props.searchParams) as RawSearchParams;
  const state = parseBrowseParams(searchParams);
  const result = await queryProducts({
    ...toProductQuery(state, { scope: "deals" }),
    sort: state.sort ?? "discount",
  });

  const all = await getDeals();
  const deepest = all[0]?.discountPercent ?? 0;

  return (
    <Container className="py-14">
      <SectionHeading
        as="h1"
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5" aria-hidden />
            {all.length} reduced · up to {deepest}% off
          </span>
        }
        title={
          <>
            Current <em className="italic">deals</em>
          </>
        }
        description="Real reductions against the price we were charging last month — no inflated compare-at figures."
      />

      <DepartmentRail className="mt-10" />

      <ProductBrowser
        basePath="/deals"
        state={state}
        result={result}
        className="mt-10"
        emptyMessage="No deals match those filters right now."
      />
    </Container>
  );
}
