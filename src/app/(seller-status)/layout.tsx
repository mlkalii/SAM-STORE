import type { Metadata } from "next";

import { SellerShell } from "@/components/seller/seller-shell";
import { sellerNav } from "@/components/seller/nav-config";
import { adminOrders } from "@/lib/admin";
import { requireSellerAccount } from "@/lib/marketplace/auth";
import { messaging } from "@/lib/marketplace/messaging";
import { reviewStore } from "@/lib/marketplace/reviews";
import { isFullyVerified, sellerInitials } from "@/lib/marketplace/seller-store";
import { ordersForSeller } from "@/lib/marketplace/settlement";

export const metadata: Metadata = {
  title: { default: "Seller", template: "%s — SAMRUX Seller" },
  robots: { index: false, follow: false },
};

/**
 * Layout for the two seller routes that must work before a store is approved:
 * the application status page and verification.
 *
 * It lives outside `app/seller` deliberately — that layout calls
 * `requireSeller()`, which redirects a non-approved store *to* these pages, so
 * rendering them inside it would loop forever. An approved seller still gets
 * the full dashboard chrome here, so `/seller/verification` looks the same
 * whichever side of approval you are on.
 */
export default async function SellerStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { seller } = await requireSellerAccount();

  // A pending or suspended store gets the bare page — the status page brings
  // its own chrome, and a sidebar full of links it cannot open would be a lie.
  if (seller.status !== "approved") return children;

  const orders = ordersForSeller(await adminOrders.all(), seller.id);

  return (
    <SellerShell
      store={{
        id: seller.id,
        slug: seller.slug,
        storeName: seller.storeName,
        initials: sellerInitials(seller.storeName),
        gradient: seller.gradient,
        logoUrl: seller.logoUrl,
        rating: seller.rating,
        verified: isFullyVerified(seller),
      }}
      nav={sellerNav}
      badges={{
        orders: orders.filter((order) => order.status === "processing").length,
        messages: messaging.unreadFor("seller", seller.id),
        reviews: reviewStore
          .forSeller(seller.id, { includeUnpublished: true })
          .filter((review) => review.status === "published" && !review.reply).length,
      }}
    >
      {children}
    </SellerShell>
  );
}
