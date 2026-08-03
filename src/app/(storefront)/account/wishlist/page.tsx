import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";

import { Panel } from "@/components/account/account-ui";
import { WishlistView } from "@/components/product/wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

// The proxy already redirects anonymous traffic away from /account, but this
// page must not be reachable on the strength of one matcher alone: every other
// account page proves the session server-side, and a page that skips the check
// silently becomes the exception the next matcher edit exposes.
export default async function AccountWishlistPage() {
  await requireUser("/account/wishlist");

  return (
    <Panel
      title="Wishlist"
      description="Saved in this browser. Sign-in on another device will sync it once the sync service is connected."
    >
      <WishlistView />
    </Panel>
  );
}
