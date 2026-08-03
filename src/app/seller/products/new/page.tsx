import type { Metadata } from "next";

import { SellerProductEditor } from "@/components/seller/seller-product-editor";
import { PageHeader } from "@/components/admin/ui";
import { categories } from "@/data/categories";
import { warrantyFor } from "@/config/warranty";
import { requireSeller } from "@/lib/marketplace/auth";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "New product" };

export default async function NewSellerProductPage() {
  const { seller } = await requireSeller("/seller/products/new");
  const csrfToken = await getCsrfToken();

  const first = categories[0];

  return (
    <>
      <PageHeader
        title="New product"
        description="Create a listing. Save it as a draft first if you are not ready to sell."
        breadcrumbs={[
          { label: "Seller", href: "/seller" },
          { label: "Products", href: "/seller/products" },
          { label: "New" },
        ]}
      />

      <SellerProductEditor
        csrfToken={csrfToken}
        categories={categories.map((category) => ({
          slug: category.slug,
          name: category.name,
          subcategories: category.subcategories,
        }))}
        warrantyLabel={warrantyFor(first.slug).label}
        returnWindowDays={seller.returnWindowDays}
        product={{
          name: "",
          brand: seller.storeName,
          sku: "",
          shortDescription: "",
          longDescription: "",
          features: [],
          price: 0,
          stockCount: 0,
          category: first.slug,
          subcategory: first.subcategories[0] ?? "",
          tags: [],
          status: "draft",
          visible: true,
        }}
      />
    </>
  );
}
