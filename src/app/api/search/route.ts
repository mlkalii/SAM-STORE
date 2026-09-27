import { NextResponse } from "next/server";

import { categories } from "@/data/categories";
import { getBestSellers, suggestBrands, suggestProducts } from "@/data/products";
import { searchInsights } from "@/lib/commerce/search-insights";

/**
 * Type-ahead endpoint for the header search field.
 *
 * Keeping suggestions on the server means the product catalogue never
 * reaches the client bundle. Swap `suggestProducts` for a search service
 * (Algolia, Typesense, a database query) and the client stays unchanged.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  // Below two characters there is nothing to match on, so the field shows
  // trending terms and popular products instead of an empty dropdown.
  if (q.length < 2) {
    const popular = (await getBestSellers(4)).map((product) => ({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      category: product.category,
      gradient: product.gradient,
      image: product.images[0]?.thumbnail ?? "",
    }));

    return NextResponse.json({
      q,
      products: [],
      categories: [],
      brands: [],
      trending: searchInsights.trending(6),
      popular,
    });
  }

  searchInsights.record(q);

  const [matches, brands] = await Promise.all([suggestProducts(q, 6), suggestBrands(q, 4)]);

  const products = matches.map((product) => ({
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    category: product.category,
    gradient: product.gradient,
    image: product.images[0]?.thumbnail ?? "",
  }));

  const needle = q.toLowerCase();
  const matchedCategories = categories
    .filter(
      (category) =>
        category.name.toLowerCase().includes(needle) ||
        category.subcategories.some((sub) => sub.toLowerCase().includes(needle)),
    )
    .slice(0, 3)
    .map((category) => ({ slug: category.slug, name: category.name }));

  return NextResponse.json({
    q,
    products,
    categories: matchedCategories,
    brands,
    trending: [],
    popular: [],
  });
}
