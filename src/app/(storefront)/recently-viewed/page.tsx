import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { RecentlyViewedRail } from "@/components/product/recently-viewed";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Recently viewed",
  description: "The products you have looked at in this browser.",
  robots: { index: false },
};

export default function RecentlyViewedPage() {
  return (
    <Container className="py-14">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Recently viewed</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Kept in this browser only — nothing is sent to a server, and clearing it is one click.
      </p>

      <RecentlyViewedRail
        className="mt-12"
        title="Your history"
        emptyState={
          <div className="mt-12 rounded-2xl border border-dashed p-16 text-center">
            <p className="font-display text-2xl">Nothing viewed yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Products you look at are remembered in this browser, so you can find your way back.
            </p>
            <Button className="mt-6" render={<Link href="/shop" />}>
              Browse the catalogue
            </Button>
          </div>
        }
      />
    </Container>
  );
}
