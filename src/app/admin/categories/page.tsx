import type { Metadata } from "next";

import { CategoryManager } from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { categoryStore } from "@/lib/admin/stores";
import { adminProducts } from "@/lib/admin";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requirePermission("categories.view", "/admin/categories");
  const csrfToken = await getCsrfToken();

  const products = await adminProducts.all();
  const categories = categoryStore.list().map((category) => ({
    ...category,
    productCount: products.filter((product) => product.category === category.slug).length,
  }));

  return (
    <>
      <PageHeader
        title="Categories"
        description="Departments shoppers browse by. Children nest under a parent; featured departments surface on the homepage."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Categories" }]}
      />
      <CategoryManager csrfToken={csrfToken} categories={categories} />
    </>
  );
}
