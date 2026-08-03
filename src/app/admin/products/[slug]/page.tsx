import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star } from "lucide-react";

import { ProductEditor } from "@/components/admin/product-editor";
import { Card, Detail, PageHeader, Pill } from "@/components/admin/ui";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { requirePermission } from "@/lib/admin/auth";
import { adminProducts } from "@/lib/admin";
import { stockStore } from "@/lib/admin/stores";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Edit product" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminProductPage(props: PageProps<"/admin/products/[slug]">) {
  const { slug } = await props.params;
  await requirePermission("products.view", `/admin/products/${slug}`);
  const csrfToken = await getCsrfToken();

  const product = await adminProducts.find(slug);
  if (!product) notFound();

  const movements = stockStore.movements(slug).slice(0, 8);
  const margin =
    product.meta.costPrice && product.meta.costPrice > 0
      ? ((product.price - product.meta.costPrice) / product.price) * 100
      : null;

  return (
    <>
      <PageHeader
        title={product.name}
        description={`${product.brand} · ${product.sku}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
        actions={
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/shop/${product.slug}`} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View on storefront
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card title="Product details" description="Changes go live on the storefront immediately.">
            <ProductEditor
              csrfToken={csrfToken}
              product={{
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                sku: product.sku,
                shortDescription: product.shortDescription,
                longDescription: product.longDescription,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                costPrice: product.meta.costPrice,
                barcode: product.meta.barcode,
                stockCount: product.stockCount,
                category: product.category,
                subcategory: product.subcategory,
                tags: product.tags,
                status: product.meta.status,
                visible: product.meta.visible,
                seoTitle: product.meta.seoTitle,
                seoDescription: product.meta.seoDescription,
                videoUrl: product.meta.videoUrl,
                featured: product.featured,
                trending: product.trending,
                newArrival: product.newArrival,
                bestSeller: product.bestSeller,
              }}
              categories={categories.map((category) => ({
                value: category.slug,
                label: category.name,
              }))}
            />
          </Card>

          <Card title="Gallery" description={`${product.images.length} images`}>
            <ul className="flex flex-wrap gap-3">
              {product.images.map((image) => (
                <li key={image.id}>
                  <ProductImage
                    src={image.thumbnail}
                    alt={image.alt}
                    gradient={image.gradient}
                    category={product.category}
                    sizes="96px"
                    className="size-20 rounded-lg"
                  />
                  <p className="mt-1 text-center text-[10px] capitalize text-muted-foreground">
                    {image.view.replaceAll("-", " ")}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Images come from the catalogue source. Upload replaces this list once the media
              service is connected — the `images[]` shape does not change.
            </p>
          </Card>

          <Card title="Reviews" description={`${product.reviews.length} published of ${product.reviewCount.toLocaleString("en-US")} ratings`}>
            {product.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No written reviews yet.</p>
            ) : (
              <ul className="divide-y">
                {product.reviews.slice(0, 5).map((review) => (
                  <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{review.title}</span>
                      <Pill tone={review.rating >= 4 ? "positive" : review.rating >= 3 ? "warning" : "danger"}>
                        {review.rating}★
                      </Pill>
                      {review.verifiedPurchase ? <Pill tone="info">verified</Pill> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{review.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {review.author} · {dateFormat.format(new Date(review.createdAt))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="At a glance">
            <dl className="divide-y">
              <Detail label="Status">
                <Pill tone={product.meta.status === "published" ? "positive" : "warning"}>
                  {product.meta.status}
                </Pill>
              </Detail>
              <Detail label="Effective stock">
                <span className="font-mono tabular-nums">{product.effectiveStock}</span>
              </Detail>
              <Detail label="Rating">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-current text-amber-500" aria-hidden />
                  {product.rating.toFixed(1)}
                </span>
              </Detail>
              <Detail label="Price">{formatPrice(product.price)}</Detail>
              {product.meta.costPrice ? (
                <Detail label="Cost">{formatPrice(product.meta.costPrice)}</Detail>
              ) : null}
              {margin !== null ? <Detail label="Margin">{margin.toFixed(1)}%</Detail> : null}
              <Detail label="Warranty">{product.warrantyMonths} months</Detail>
              {product.meta.updatedAt ? (
                <Detail label="Last edited">
                  <span className="text-xs">
                    {dateFormat.format(new Date(product.meta.updatedAt))}
                    {product.meta.updatedBy ? ` · ${product.meta.updatedBy}` : ""}
                  </span>
                </Detail>
              ) : null}
            </dl>
          </Card>

          <Card title="Variants" description={`${product.variants.length} option${product.variants.length === 1 ? "" : "s"}`}>
            <ul className="space-y-2">
              {product.variants.map((variant) => (
                <li key={variant.id} className="flex items-center gap-2.5 text-sm">
                  {variant.hex ? (
                    <span
                      aria-hidden
                      className="size-4 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: variant.hex }}
                    />
                  ) : (
                    <span aria-hidden className="size-4 rounded-full bg-muted" />
                  )}
                  {variant.label}
                  <code className="ml-auto text-[10px] text-muted-foreground">{variant.id}</code>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Stock history" description="Most recent adjustments">
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No adjustments recorded.</p>
            ) : (
              <ul className="space-y-2.5">
                {movements.map((movement) => (
                  <li key={movement.id} className="flex items-start gap-2 text-xs">
                    <span
                      className={
                        movement.delta > 0
                          ? "font-mono tabular-nums text-emerald-600 dark:text-emerald-400"
                          : "font-mono tabular-nums text-destructive"
                      }
                    >
                      {movement.delta > 0 ? "+" : ""}
                      {movement.delta}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block capitalize">{movement.reason.replaceAll("-", " ")}</span>
                      <span className="block text-muted-foreground">
                        {dateFormat.format(new Date(movement.at))}
                        {movement.by ? ` · ${movement.by}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
