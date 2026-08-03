"use client";

import { Container } from "@/components/common/container";
import { RecentlyViewedRail } from "@/components/product/recently-viewed";

/**
 * Homepage recently-viewed block.
 *
 * Renders nothing at all until there is history, so a first-time visitor never
 * sees an empty shelf — which is why this is a thin client wrapper rather than
 * a `ProductSection`.
 */
export function HomeRecentlyViewed() {
  return (
    <Container as="section" className="py-16 sm:py-20 empty:hidden">
      <RecentlyViewedRail title="Pick up where you left off" />
    </Container>
  );
}
