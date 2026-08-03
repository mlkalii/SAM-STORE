import { NextResponse } from "next/server";

import { categories } from "@/data/categories";
import { getBestSellers, suggestBrands, suggestProducts } from "@/data/products";
import { searchInsights } from "@/lib/commerce/search-insights";
import { isFullyVerified, sellerStore } from "@/lib/marketplace/seller-store";

/**
 * Type-ahead endpoint for the header search field.
 *
 * Keeping suggestions on the server means the 300-product catalogue never
 * reaches the client bundle. Swap `suggestProducts` for a search service
 * (Algolia, Typesense, a database query) and the client stays unchanged.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  // Below two characters there is nothing to match on, so the field shows
  // trending terms and current best sellers instead of an empty dropdown.
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
      sellers: [],
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

  // Sellers are searchable too: a shopper who knows the store name should reach
  // the storefront, not scroll a product list.
  const sellers = sellerStore
    .approved()
    .filter(
      (seller) =>
        seller.storeName.toLowerCase().includes(needle) ||
        seller.storeDescription.toLowerCase().includes(needle) ||
        seller.business.city.toLowerCase().includes(needle),
    )
    .slice(0, 3)
    .map((seller) => ({
      id: seller.id,
      slug: seller.slug,
      storeName: seller.storeName,
      gradient: seller.gradient,
      rating: seller.rating,
      verified: isFullyVerified(seller),
    }));

  return NextResponse.json({
    q,
    products,
    categories: matchedCategories,
    brands,
    sellers,
    trending: [],
    popular: [],
  });
}
