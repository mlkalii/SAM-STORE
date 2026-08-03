import { Check, Star } from "lucide-react";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import type { ProductQueryResult } from "@/data/products";
import {
  buildHref,
  toggleValue,
  withFilter,
  type BrowseState,
} from "@/lib/browse-params";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRICE_BANDS = [
  { label: `Under ${formatPrice(5000)}`, min: undefined, max: 4999 },
  { label: `${formatPrice(5000)} – ${formatPrice(15000)}`, min: 5000, max: 14999 },
  { label: `${formatPrice(15000)} – ${formatPrice(35000)}`, min: 15000, max: 34999 },
  { label: `${formatPrice(35000)} – ${formatPrice(70000)}`, min: 35000, max: 69999 },
  { label: `${formatPrice(70000)} and up`, min: 70000, max: undefined },
];

const RATINGS = [4.5, 4.0, 3.5];

function FilterRow({
  href,
  active,
  children,
  count,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          active ? "border-foreground bg-foreground text-background" : "border-input",
        )}
        aria-hidden
      >
        {active ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {typeof count === "number" ? (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{count}</span>
      ) : null}
    </Link>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 space-y-0.5">{children}</div>
    </div>
  );
}

/**
 * Filters are plain links, not client state — every combination is a real URL
 * that renders on the server and can be shared.
 */
export function FilterPanel({
  basePath,
  state,
  facets,
  showSubcategories = true,
}: {
  basePath: string;
  state: BrowseState;
  facets: ProductQueryResult["facets"];
  showSubcategories?: boolean;
}) {
  const priceActive = (band: (typeof PRICE_BANDS)[number]) =>
    state.minPrice === band.min && state.maxPrice === band.max;

  return (
    <div className="space-y-6">
      <Group title="Availability">
        <FilterRow
          href={buildHref(basePath, withFilter(state, { inStockOnly: !state.inStockOnly }))}
          active={state.inStockOnly}
        >
          In stock only
        </FilterRow>
        <FilterRow
          href={buildHref(basePath, withFilter(state, { onSaleOnly: !state.onSaleOnly }))}
          active={state.onSaleOnly}
        >
          On sale
        </FilterRow>
      </Group>

      <Separator />

      {showSubcategories && facets.subcategories.length > 1 ? (
        <>
          <Group title="Type">
            {facets.subcategories.slice(0, 12).map((facet) => (
              <FilterRow
                key={facet.value}
                count={facet.count}
                active={state.subcategories.includes(facet.value)}
                href={buildHref(
                  basePath,
                  withFilter(state, {
                    subcategories: toggleValue(state.subcategories, facet.value),
                  }),
                )}
              >
                {facet.value}
              </FilterRow>
            ))}
          </Group>
          <Separator />
        </>
      ) : null}

      <Group title="Price">
        {PRICE_BANDS.map((band) => {
          const active = priceActive(band);
          return (
            <FilterRow
              key={band.label}
              active={active}
              href={buildHref(
                basePath,
                withFilter(state, {
                  minPrice: active ? undefined : band.min,
                  maxPrice: active ? undefined : band.max,
                }),
              )}
            >
              {band.label}
            </FilterRow>
          );
        })}
      </Group>

      <Separator />

      <Group title="Rating">
        {RATINGS.map((rating) => (
          <FilterRow
            key={rating}
            active={state.minRating === rating}
            href={buildHref(
              basePath,
              withFilter(state, {
                minRating: state.minRating === rating ? undefined : rating,
              }),
            )}
          >
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 fill-current" aria-hidden />
              {rating.toFixed(1)} &amp; up
            </span>
          </FilterRow>
        ))}
      </Group>

      {/* Only meaningful when the listing spans more than one store. */}
      {facets.sellers.length > 1 ? (
        <>
          <Separator />
          <Group title="Sold by">
            {facets.sellers.slice(0, 8).map((facet) => (
              <FilterRow
                key={facet.value}
                count={facet.count}
                active={state.sellers.includes(facet.value)}
                href={buildHref(
                  basePath,
                  withFilter(state, { sellers: toggleValue(state.sellers, facet.value) }),
                )}
              >
                {facet.label ?? facet.value}
              </FilterRow>
            ))}
          </Group>
        </>
      ) : null}

      {facets.brands.length > 1 ? (
        <>
          <Separator />
          <Group title="Brand">
            {facets.brands.slice(0, 12).map((facet) => (
              <FilterRow
                key={facet.value}
                count={facet.count}
                active={state.brands.includes(facet.value)}
                href={buildHref(
                  basePath,
                  withFilter(state, { brands: toggleValue(state.brands, facet.value) }),
                )}
              >
                {facet.value}
              </FilterRow>
            ))}
          </Group>
        </>
      ) : null}

      {facets.priceRange.max > 0 ? (
        <p className="px-2 text-xs text-muted-foreground">
          Prices here run {formatPrice(facets.priceRange.min)} to{" "}
          {formatPrice(facets.priceRange.max)}.
        </p>
      ) : null}
    </div>
  );
}
