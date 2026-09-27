import { ArrowUpDown, X } from "lucide-react";
import Link from "next/link";

import { ProductGrid } from "@/components/product/product-grid";
import { FilterDrawer } from "@/components/shop/filter-drawer";
import { FilterPanel } from "@/components/shop/filter-panel";
import { Pagination } from "@/components/shop/pagination";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SORT_OPTIONS, type ProductQueryResult } from "@/data/products";
import {
  buildHref,
  countActiveFilters,
  toggleValue,
  withFilter,
  type BrowseState,
} from "@/lib/browse-params";
import { cn } from "@/lib/utils";

/**
 * The listing shell shared by /shop, /categories/[slug], /search, /deals,
 * and /new-arrivals: sidebar filters, sort, grid, pagination.
 */
export function ProductBrowser({
  basePath,
  state,
  result,
  showSubcategories = true,
  emptyMessage,
  className,
}: {
  basePath: string;
  state: BrowseState;
  result: ProductQueryResult;
  showSubcategories?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  const activeCount = countActiveFilters(state);
  const currentSort =
    SORT_OPTIONS.find((option) => option.key === (state.sort ?? (state.q ? "relevance" : "popular"))) ??
    SORT_OPTIONS[1];

  const firstOnPage = result.total === 0 ? 0 : (result.page - 1) * result.perPage + 1;
  const lastOnPage = Math.min(result.page * result.perPage, result.total);

  const panel = (
    <FilterPanel
      basePath={basePath}
      state={state}
      facets={result.facets}
      showSubcategories={showSubcategories}
    />
  );

  const chips: { label: string; href: string }[] = [
    ...state.subcategories.map((value) => ({
      label: value,
      href: buildHref(
        basePath,
        withFilter(state, { subcategories: toggleValue(state.subcategories, value) }),
      ),
    })),
    ...state.brands.map((value) => ({
      label: value,
      href: buildHref(basePath, withFilter(state, { brands: toggleValue(state.brands, value) })),
    })),
  ];

  if (typeof state.minPrice === "number" || typeof state.maxPrice === "number") {
    chips.push({
      label: "Price",
      href: buildHref(basePath, withFilter(state, { minPrice: undefined, maxPrice: undefined })),
    });
  }
  if (state.inStockOnly) {
    chips.push({
      label: "In stock",
      href: buildHref(basePath, withFilter(state, { inStockOnly: false })),
    });
  }
  if (state.onSaleOnly) {
    chips.push({
      label: "On sale",
      href: buildHref(basePath, withFilter(state, { onSaleOnly: false })),
    });
  }

  return (
    <div className={cn("grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12", className)}>
      <aside className="hidden lg:block">
        <div className="sticky top-32">{panel}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <FilterDrawer activeCount={activeCount} total={result.total}>
              {panel}
            </FilterDrawer>

            <p className="text-sm text-muted-foreground">
              {result.total === 0
                ? "No products"
                : `${firstOnPage.toLocaleString("en-US")}–${lastOnPage.toLocaleString("en-US")} of ${result.total.toLocaleString("en-US")}`}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" className="gap-1.5" />}
            >
              <ArrowUpDown className="size-3.5" aria-hidden />
              {currentSort.label}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {SORT_OPTIONS.filter((option) => option.key !== "relevance" || state.q).map(
                (option) => (
                  <DropdownMenuItem
                    key={option.key}
                    render={
                      <Link
                        href={buildHref(basePath, { ...state, sort: option.key, page: 1 })}
                        scroll={false}
                      />
                    }
                    className={cn(option.key === currentSort.key && "bg-muted font-medium")}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            {chips.map((chip) => (
              <Link key={chip.label} href={chip.href} scroll={false}>
                <Badge variant="outline" className="gap-1 py-1 pr-1.5">
                  {chip.label}
                  <X className="size-3" aria-hidden />
                </Badge>
              </Link>
            ))}
            <Link
              href={buildHref(basePath, { q: state.q, sort: state.sort, page: 1 })}
              scroll={false}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Clear all
            </Link>
          </div>
        ) : null}

        <ProductGrid products={result.items} className="mt-8" emptyMessage={emptyMessage} />

        <Pagination
          basePath={basePath}
          state={state}
          page={result.page}
          pageCount={result.pageCount}
        />
      </div>
    </div>
  );
}
