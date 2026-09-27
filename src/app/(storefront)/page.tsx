import { BrandShowcase } from "@/components/home/brand-showcase";
import { BundleTeaser } from "@/components/home/bundle-teaser";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { Collections } from "@/components/home/collections";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FlashDeals } from "@/components/home/flash-deals";
import { Hero } from "@/components/home/hero";
import { HomeRecentlyViewed } from "@/components/home/home-recently-viewed";
import { Marquee } from "@/components/home/marquee";
import { Newsletter } from "@/components/home/newsletter";
import { PromoBanner } from "@/components/home/promo-banner";
import { ProductSection } from "@/components/home/section";
import { ValueProps } from "@/components/home/value-props";
import { categories } from "@/data/categories";
import {
  getBestSellers,
  getCatalogMeta,
  getDeals,
  getNewArrivals,
  getRecommended,
  getTrending,
} from "@/data/products";

export const metadata = {
  // Only the homepage claims "/" — a canonical set in the root layout would be
  // inherited by every page that does not override it, telling crawlers the
  // whole site is one page.
  alternates: { canonical: "/" },
};

/**
 * Homepage.
 *
 * The order is a shopping journey, not a stack of features:
 *
 *   1. Orientation — hero, then a compact department strip that answers
 *      "where do I go" in one glance, then the promo and trust marquee.
 *   2. Products — trending, deals, best sellers, flash offers, new arrivals,
 *      recommended. A returning shopper is looking for something to buy, and
 *      this is where they land.
 *   3. Browse — brands, collections, the full department wall. The browse
 *      layer for the visitor who did not find what they wanted above.
 *   4. Trust and continuation — value props, recently viewed, newsletter.
 *
 * Backgrounds alternate white → soft grey so the stacked sections read as
 * distinct without a rule between each one.
 */
export default async function HomePage() {
  const [deals, trending, bestSellers, newArrivals, meta] = await Promise.all([
    getDeals(8),
    getTrending(12),
    getBestSellers(8),
    getNewArrivals(8),
    getCatalogMeta(),
  ]);

  // "Recommended" is anchored to the best-selling product, so it reads as a genuine
  // follow-on rather than another arbitrary slice of the catalogue.
  const recommended = bestSellers[0] ? await getRecommended(bestSellers[0], 12) : [];

  return (
    <>
      {/* 1 — Orientation */}
      <Hero productCount={meta.count} departmentCount={categories.length} />
      <FeaturedCategories />
      <PromoBanner />
      <Marquee />

      {/* 2 — Products */}
      <ProductSection
        eyebrow="Trending now"
        title={
          <>
            Moving <em className="italic">fastest</em> this week
          </>
        }
        description="The products gaining the most attention this week, across every department."
        href="/shop?sort=popular"
        linkLabel="Browse all"
        products={trending}
        layout="rail"
        priority
      />

      <ProductSection
        id="todays-deals"
        eyebrow="Today's deals"
        title={
          <>
            Reduced <em className="italic">today</em>
          </>
        }
        description="Every product here is currently reduced from its regular price. The saving shown is the difference between the two."
        href="/deals"
        linkLabel="All deals"
        products={deals}
        tone="surface"
      />

      <ProductSection
        eyebrow="Best sellers"
        title={
          <>
            Popular <em className="italic">across the range</em>
          </>
        }
        description="A selection of popular products from all fourteen departments."
        href="/best-sellers"
        linkLabel="All best sellers"
        products={bestSellers}
      />

      <FlashDeals />

      <ProductSection
        eyebrow="Just landed"
        title={
          <>
            New this <em className="italic">month</em>
          </>
        }
        description="The newest additions to the range."
        href="/new-arrivals"
        linkLabel="All new arrivals"
        products={newArrivals}
      />

      <ProductSection
        eyebrow="Recommended"
        title={
          <>
            Chosen <em className="italic">for you</em>
          </>
        }
        description="Strong products from across the catalogue in a comparable price band to what sells best."
        href="/shop"
        linkLabel="See more"
        products={recommended}
        layout="rail"
        tone="surface"
      />

      <BundleTeaser />

      {/* 3 — Browse the range */}
      <BrandShowcase />
      <Collections />
      <CategoryShowcase />

      {/* 4 — Trust and continuation */}
      <ValueProps />
      <HomeRecentlyViewed />
      <Newsletter />
    </>
  );
}
