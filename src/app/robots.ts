import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Personal, browser-local pages (wishlist, compare, recently viewed) and the
 * search/API endpoints are kept out of the index — they have no stable content
 * to rank and would only dilute the catalogue pages.
 *
 * The admin and seller dashboards are excluded outright: they are behind
 * authentication and there is nothing there for a crawler.
 *
 * The dashboard rules are written with a trailing slash plus an explicit `$`
 * anchor. `robots.txt` matching is a prefix match, so a bare `/seller` would
 * also cover `/sellers` and `/sellers/<shop>` — de-indexing the entire public
 * seller directory and every storefront on the marketplace, which is the
 * opposite of what this file is for.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/cart",
          "/wishlist",
          "/compare",
          "/recently-viewed",
          "/search?",
          "/admin$",
          "/admin/",
          "/seller$",
          "/seller/",
          "/account$",
          "/account/",
          "/checkout",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
