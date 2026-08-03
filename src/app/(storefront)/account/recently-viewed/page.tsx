import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";

import { Panel } from "@/components/account/account-ui";
import { RecentlyViewedRail } from "@/components/product/recently-viewed";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Recently viewed", robots: { index: false } };

// The proxy already redirects anonymous traffic away from /account, but this
// page must not be reachable on the strength of one matcher alone: every other
// account page proves the session server-side, and a page that skips the check
// silently becomes the exception the next matcher edit exposes.
export default async function AccountRecentlyViewedPage() {
  await requireUser("/account/recently-viewed");

  return (
    <Panel title="Recently viewed" description="The products you have opened, newest first.">
      <RecentlyViewedRail
        title="Your history"
        emptyState={
          <div className="rounded-2xl border border-dashed p-12 text-center">
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
    </Panel>
  );
}
