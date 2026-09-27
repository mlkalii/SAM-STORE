import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { categories } from "@/data/categories";
import { getProducts } from "@/data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  const staticRoutes = [
    "",
    "/shop",
    "/categories",
    "/deals",
    "/new-arrivals",
    "/best-sellers",
    "/search",
    "/about",
    "/contact",
    "/help",
    "/returns",
    "/warranty",
    "/privacy",
    "/terms",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...categories.map((category) => ({
      url: `${siteConfig.url}/categories/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/shop/${product.slug}`,
      lastModified: product.releasedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
