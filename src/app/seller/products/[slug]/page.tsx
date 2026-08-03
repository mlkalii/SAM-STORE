import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { SellerProductEditor } from "@/components/seller/seller-product-editor";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { warrantyFor } from "@/config/warranty";
import { formatStoreDateTime } from "@/config/store";
import { requireSeller } from "@/lib/marketplace/auth";
import { sellerCatalogue } from "@/lib/marketplace";
import { reviewStore } from "@/lib/marketplace/reviews";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Edit product" };

export default async function SellerProductPage(props: PageProps<"/seller/products/[slug]">) {
  const { slug } = await props.params;
  const { seller } = await requireSeller(`/seller/products/${slug}`);
  const csrfToken = await getCsrfToken();

  const catalogue = await sellerCatalogue(seller.id);
  const product = catalogue.find((entry) => entry.slug === slug);
  if (!product) notFound();

  const reviews = reviewStore.forProduct(slug, { includeUnpublished: true });

  return (
    <>
      <PageHeader
        title={product.name}
        description={product.sku}
        breadcrumbs={[
          { label: "Seller", href: "/seller" },
          { label: "Products", href: "/seller/products" },
          { label: product.name },
        ]}
        actions={
          product.meta.status === "published" ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/shop/${product.slug}`} target="_blank" />}
            >
              View live
              <ExternalLink className="size-3" aria-hidden />
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <SellerProductEditor
            csrfToken={csrfToken}
            categories={categories.map((category) => ({
              slug: category.slug,
              name: category.name,
              subcategories: category.subcategories,
            }))}
            warrantyLabel={warrantyFor(product.category).label}
            returnWindowDays={seller.returnWindowDays}
            product={{
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              sku: product.sku,
              shortDescription: product.shortDescription,
              longDescription: product.longDescription,
              features: product.features,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              costPrice: product.meta.costPrice,
              stockCount: product.stockCount,
              category: product.category,
              subcategory: product.subcategory,
              tags: product.tags,
              status: product.meta.status,
              visible: product.meta.visible,
              barcode: product.meta.barcode,
              videoUrl: product.meta.videoUrl,
              seoTitle: product.meta.seoTitle,
              seoDescription: product.meta.seoDescription,
            }}
          />
        </div>

        <div className="space-y-4">
          <Card title="At a glance">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Pill tone={product.meta.status === "published" ? "positive" : "warning"}>
                    {product.meta.status}
                  </Pill>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-mono text-xs">{formatPrice(product.price)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Stock</dt>
                <dd className="font-mono text-xs">{product.stockCount}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Warranty</dt>
                <dd className="text-right text-xs">{warrantyFor(product.category).label}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Last edited</dt>
                <dd className="text-right text-xs">
                  {product.meta.updatedAt ? formatStoreDateTime(product.meta.updatedAt) : "—"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title={`Reviews (${reviews.length})`} bodyClassName="p-0">
            {reviews.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No reviews for this product yet.</p>
            ) : (
              <ul className="divide-y">
                {reviews.slice(0, 6).map((review) => (
                  <li key={review.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{review.rating}★</span>
                      <span className="min-w-0 flex-1 truncate text-xs">{review.title}</span>
                      <Pill tone={review.status === "published" ? "positive" : "warning"}>
                        {review.status}
                      </Pill>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{review.body}</p>
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
