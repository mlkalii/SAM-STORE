import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { DepartmentRail } from "@/components/shop/department-rail";
import { ProductBrowser } from "@/components/shop/product-browser";
import { getBestSellers, queryProducts } from "@/data/products";
import {
  parseBrowseParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/browse-params";

export const metadata: Metadata = {
  title: "Best sellers",
  description: "The products people reorder, ranked by verified review volume.",
};

export default async function BestSellersPage(props: PageProps<"/best-sellers">) {
  const searchParams = (await props.searchParams) as RawSearchParams;
  const state = parseBrowseParams(searchParams);
  const result = await queryProducts({
    ...toProductQuery(state, { scope: "best-sellers" }),
    sort: state.sort ?? "popular",
  });

  const all = await getBestSellers();

  return (
    <Container className="py-14">
      <SectionHeading
        as="h1"
        eyebrow={`${all.length} across fifteen departments`}
        title={
          <>
            Best <em className="italic">sellers</em>
          </>
        }
        description="Ranked by verified purchases and review volume, not by what we would like to move. Updated weekly."
      />

      <DepartmentRail className="mt-10" />

      <ProductBrowser
        basePath="/best-sellers"
        state={state}
        result={result}
        className="mt-10"
        emptyMessage="No best sellers match those filters."
      />
    </Container>
  );
}
