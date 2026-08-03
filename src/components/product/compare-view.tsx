"use client";

import { Check, GitCompare, Minus, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { ProductImage } from "@/components/product/product-image";
import { QuickAddButton } from "@/components/product/quick-add-button";
import { StockBadge } from "@/components/product/product-badges";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPARE_LIMIT, useCompare } from "@/hooks/use-product-lists";
import { formatWarranty } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Side-by-side comparison.
 *
 * The tray holds slugs only, so the full records are hydrated from
 * `/api/products` — the catalogue never reaches the client bundle.
 */
export function CompareView() {
  const { items, remove, clear } = useCompare();
  const [products, setProducts] = React.useState<Product[] | null>(null);

  const slugKey = items.map((item) => item.slug).join(",");

  React.useEffect(() => {
    if (!slugKey) return;

    const controller = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(slugKey)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((payload: { products: Product[] }) => setProducts(payload.products))
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setProducts([]);
      });

    return () => controller.abort();
  }, [slugKey]);

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-3xl border border-dashed p-16 text-center">
        <GitCompare className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-4 font-display text-2xl">Nothing to compare yet</p>
        <p className="mt-2 text-muted-foreground">
          Add up to {COMPARE_LIMIT} products from any grid to line up their specifications.
        </p>
        <Button className="mt-6" render={<Link href="/shop" />}>
          Browse the catalogue
        </Button>
      </div>
    );
  }

  const resolved = products ?? [];
  const loading = products === null;

  // Union of specification labels so every row lines up across columns.
  const specLabels = [
    ...new Set(resolved.flatMap((product) => product.specifications.map((spec) => spec.label))),
  ];

  const rows: { label: string; render: (product: Product) => React.ReactNode }[] = [
    {
      label: "Price",
      render: (product) => (
        <span className="font-mono text-base tabular-nums">{formatPrice(product.price)}</span>
      ),
    },
    {
      label: "Rating",
      render: (product) => (
        <StarRating rating={product.rating} reviewCount={product.reviewCount} showValue size="xs" />
      ),
    },
    {
      label: "Availability",
      render: (product) => (
        <StockBadge status={product.stockStatus} count={product.stockCount} />
      ),
    },
    { label: "Brand", render: (product) => product.brand },
    { label: "Type", render: (product) => product.subcategory },
    { label: "SKU", render: (product) => <span className="font-mono text-xs">{product.sku}</span> },
    {
      label: "Warranty",
      render: (product) => formatWarranty(product.warrantyMonths),
    },
    {
      label: "Returns",
      render: (product) => `${product.returnWindowDays} days`,
    },
    {
      label: "Discount",
      render: (product) =>
        product.discountPercent > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-500">
            −{product.discountPercent}%
          </span>
        ) : (
          <Minus className="size-4 text-muted-foreground" aria-label="None" />
        ),
    },
  ];

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} of {COMPARE_LIMIT} slots used
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>

      {/* Wide tables scroll inside their own container, never the page body. */}
      <div className="mt-8 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-3xl border-separate border-spacing-0">
          <caption className="sr-only">Product comparison</caption>

          <thead>
            <tr>
              <th scope="col" className="w-36 border-b p-3 text-left align-bottom">
                <span className="sr-only">Attribute</span>
              </th>
              {items.map((item) => {
                const product = resolved.find((entry) => entry.slug === item.slug);
                return (
                  <th
                    key={item.slug}
                    scope="col"
                    className="min-w-56 border-b p-3 text-left align-bottom"
                  >
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute -right-1 -top-1 z-10"
                        aria-label={`Remove ${item.name} from compare`}
                        onClick={() => remove(item.slug)}
                      >
                        <X className="size-4" aria-hidden />
                      </Button>

                      <Link href={`/shop/${item.slug}`} className="group block">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          gradient={item.gradient}
                          category={item.category}
                          sizes="224px"
                          className="aspect-square w-full rounded-xl"
                          imageClassName="transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {item.brand}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-snug">
                          {item.name}
                        </span>
                      </Link>

                      {product ? (
                        <QuickAddButton product={product} className="mt-3 w-full" />
                      ) : (
                        <Skeleton className="mt-3 h-8 w-full" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className={cn(rowIndex % 2 === 1 && "bg-muted/40")}>
                <th
                  scope="row"
                  className="p-3 text-left align-top font-mono text-[11px] uppercase tracking-[0.16em] font-normal text-muted-foreground"
                >
                  {row.label}
                </th>
                {items.map((item) => {
                  const product = resolved.find((entry) => entry.slug === item.slug);
                  return (
                    <td key={item.slug} className="p-3 align-top text-sm">
                      {loading ? (
                        <Skeleton className="h-5 w-24" />
                      ) : product ? (
                        row.render(product)
                      ) : (
                        <Minus className="size-4 text-muted-foreground" aria-label="Unavailable" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <th
                scope="row"
                className="p-3 text-left align-top font-mono text-[11px] uppercase tracking-[0.16em] font-normal text-muted-foreground"
              >
                Key features
              </th>
              {items.map((item) => {
                const product = resolved.find((entry) => entry.slug === item.slug);
                return (
                  <td key={item.slug} className="p-3 align-top text-sm">
                    {loading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <ul className="space-y-1.5">
                        {(product?.features ?? []).slice(0, 4).map((feature) => (
                          <li key={feature} className="flex gap-2 text-muted-foreground">
                            <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                );
              })}
            </tr>

            {specLabels.map((label, index) => (
              <tr key={label} className={cn(index % 2 === 0 && "bg-muted/40")}>
                <th
                  scope="row"
                  className="p-3 text-left align-top font-mono text-[11px] uppercase tracking-[0.16em] font-normal text-muted-foreground"
                >
                  {label}
                </th>
                {items.map((item) => {
                  const product = resolved.find((entry) => entry.slug === item.slug);
                  const spec = product?.specifications.find((entry) => entry.label === label);
                  return (
                    <td key={item.slug} className="p-3 align-top text-sm">
                      {spec ? (
                        spec.value
                      ) : (
                        <Minus className="size-4 text-muted-foreground" aria-label="Not specified" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
