import { NextResponse } from "next/server";

import { getProductsBySlugs } from "@/data/products";

/** Hard ceiling so the endpoint can never be used to dump the catalogue. */
const MAX_SLUGS = 8;

/**
 * Hydrates a handful of products by slug.
 *
 * The compare tray and wishlist keep only slugs in `localStorage`; this turns
 * them back into full products without shipping the catalogue to the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugs = (searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, MAX_SLUGS);

  if (slugs.length === 0) return NextResponse.json({ products: [] });

  const products = await getProductsBySlugs(slugs);
  return NextResponse.json({ products });
}
