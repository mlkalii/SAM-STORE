import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { SellerProductTable } from "@/components/seller/seller-product-table";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { settingsStore } from "@/lib/admin/stores";
import { requireSeller } from "@/lib/marketplace/auth";
import { sellerCatalogue } from "@/lib/marketplace";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

export default async function SellerProductsPage() {
  const { seller } = await requireSeller("/seller/products");
  const csrfToken = await getCsrfToken();

  const catalogue = await sellerCatalogue(seller.id);
  const threshold = settingsStore.get().lowStockThreshold;

  const rows = catalogue.map((product) => ({
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    sku: product.sku,
    category: product.category,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stockCount: product.stockCount,
    status: product.meta.status,
    visible: product.meta.visible,
    image: product.images[0]?.thumbnail ?? "",
    gradient: product.gradient,
    rating: product.rating,
    reviewCount: product.reviewCount,
  }));

  const stockValue = rows.reduce(
    (total, row) => total + row.price * Math.max(0, row.stockCount),
    0,
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything you list on SAMRUX. Drafts are only visible to you."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Products" }]}
        actions={
          <Button size="sm" render={<Link href="/seller/products/new" />}>
            <Plus className="size-3.5" aria-hidden />
            New product
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Listings" value={rows.length} />
        <StatCard
          label="Published"
          value={rows.filter((row) => row.status === "published").length}
          tone="positive"
        />
        <StatCard label="Stock value" value={formatPrice(stockValue)} tone="gold" />
        <StatCard
          label="Needs restocking"
          value={rows.filter((row) => row.stockCount <= threshold).length}
          tone="warning"
        />
      </div>

      <Card bodyClassName="p-0">
        <SellerProductTable csrfToken={csrfToken} rows={rows} threshold={threshold} />
      </Card>
    </>
  );
}
