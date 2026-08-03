import type { Metadata } from "next";

import { SellerShell } from "@/components/seller/seller-shell";
import { messaging } from "@/lib/marketplace/messaging";
import { requireSeller } from "@/lib/marketplace/auth";
import { reviewStore } from "@/lib/marketplace/reviews";
import { isFullyVerified, sellerInitials } from "@/lib/marketplace/seller-store";
import { adminOrders } from "@/lib/admin";
import { ordersForSeller } from "@/lib/marketplace/settlement";

export const metadata: Metadata = {
  title: { default: "Seller dashboard", template: "%s — SAMRUX Seller" },
  robots: { index: false, follow: false },
};

/**
 * Seller shell layout.
 *
 * `requireSeller()` runs here, so every nested page is guaranteed an approved
 * store without repeating the check — and a suspended seller is bounced to the
 * status page before any dashboard markup is produced.
 */
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { seller } = await requireSeller();

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
