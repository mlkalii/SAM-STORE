import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Personal, browser-local pages (wishlist, compare, recently viewed) and the
 * search/API endpoints are kept out of the index — they have no stable content
 * to rank and would only dilute the catalogue pages.
 *
 * The admin dashboard and account area are excluded outright: they are behind
 * authentication and there is nothing there for a crawler.
 *
 * The dashboard rules are written with a trailing slash plus an explicit `$`
 * anchor, because `robots.txt` matching is a prefix match and a bare `/admin`
 * would also cover any public route that happened to start with those letters.
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
