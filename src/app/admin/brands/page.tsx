import type { Metadata } from "next";

import { BrandManager } from "@/components/admin/brand-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { brandStore } from "@/lib/admin/stores";
import { adminProducts } from "@/lib/admin";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  await requirePermission("brands.view", "/admin/brands");
  const csrfToken = await getCsrfToken();

  const products = await adminProducts.all();

  // Brands come from two places: those created here, and those inferred from
  // the catalogue. Showing both means the list is never misleadingly empty.
  const managed = brandStore.list();
  const managedNames = new Set(managed.map((brand) => brand.name));

  const inferred = [...new Set(products.map((product) => product.brand))]
    .filter((name) => !managedNames.has(name))
    .map((name) => ({
      id: "",
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: "",
      featured: false,
      createdAt: "",
      managed: false,
      productCount: products.filter((product) => product.brand === name).length,
    }));

  // Managed brands sort first so a brand you just created is on the first page
  // rather than buried behind eighty inferred ones.
  const rows = [
    ...managed
      .map((brand) => ({
        ...brand,
        managed: true,
        productCount: products.filter((product) => product.brand === brand.name).length,
      }))
      .sort((a, b) => b.productCount - a.productCount),
    ...inferred.sort((a, b) => b.productCount - a.productCount),
  ];

  return (
    <>
      <PageHeader
        title="Brands"
        description="Brands with a managed record get a logo, banner and description. The rest are inferred from the catalogue."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Brands" }]}
      />
      <BrandManager csrfToken={csrfToken} brands={rows} />
    </>
  );
}
