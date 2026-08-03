import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ProductTable, type AdminProductRow } from "@/components/admin/product-table";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { can } from "@/config/admin";
import { requirePermission } from "@/lib/admin/auth";
import { adminProducts } from "@/lib/admin";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const staff = await requirePermission("products.view", "/admin/products");
  const csrfToken = await getCsrfToken();

  const products = await adminProducts.all();

  const rows: AdminProductRow[] = products.map((product) => ({
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    sku: product.sku,
    category: product.category,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    status: product.meta.status,
    visible: product.meta.visible,
    stock: product.effectiveStock,
    rating: product.rating,
    reviewCount: product.reviewCount,
  }));

  const published = rows.filter((row) => row.status === "published").length;
  const drafts = rows.filter((row) => row.status === "draft").length;
  const lowStock = rows.filter((row) => row.stock > 0 && row.stock <= 10).length;
  const outOfStock = rows.filter((row) => row.stock <= 0).length;

  return (
    <>
      <PageHeader
        title="Products"
        description="Every product in the catalogue, including drafts and archived items that shoppers never see."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Products" }]}
        actions={
          <Button size="sm" variant="outline" render={<Link href="/shop" target="_blank" rel="noreferrer" />}>
            <ExternalLink className="size-3.5" aria-hidden />
            View storefront
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={published} tone="positive" />
        <StatCard label="Drafts" value={drafts} tone="warning" />
        <StatCard label="Low stock" value={lowStock} tone="warning" />
        <StatCard label="Out of stock" value={outOfStock} tone={outOfStock > 0 ? "danger" : "neutral"} />
      </div>

      <Card bodyClassName="p-0">
        <ProductTable rows={rows} csrfToken={csrfToken} canDelete={can(staff.role, "products.delete")} />
      </Card>
    </>
  );
}
