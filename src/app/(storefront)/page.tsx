import { FeaturedCategories } from "@/components/home/featured-categories";
import { Hero } from "@/components/home/hero";
import { ProductSection } from "@/components/home/section";
import { ValueProps } from "@/components/home/value-props";
import { categories } from "@/data/categories";
import { getCatalogMeta, getFeatured, getNewArrivals } from "@/data/products";

export const metadata = {
  // Only the homepage claims "/" — a canonical set in the root layout would be
  // inherited by every page that does not override it, telling crawlers the
  // whole site is one page.
  alternates: { canonical: "/" },
};

/**
 * Homepage — deliberately short: what the store is, where the departments
 * are, a few products, and the terms we sell on.
 */
export default async function HomePage() {
  const [featured, newArrivals, meta] = await Promise.all([
    getFeatured(8),
    getNewArrivals(8),
    getCatalogMeta(),
  ]);

  return (
    <>
      <Hero productCount={meta.count} departmentCount={categories.length} />
      <FeaturedCategories />

      <ProductSection
        eyebrow="Featured"
        title="Featured products"
        description="A selection from across the store, sold and shipped directly by SAMRUX LLC."
        href="/shop"
        linkLabel="Shop all products"
        products={featured}
        priority
      />

      <ProductSection
        eyebrow="New"
        title="Recently added"
        description="The newest additions to the range."
        href="/shop?sort=newest"
        linkLabel="Shop all products"
        products={newArrivals}
        tone="surface"
      />

      <ValueProps />
    </>
  );
}
