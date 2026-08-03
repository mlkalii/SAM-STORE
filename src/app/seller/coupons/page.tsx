import type { Metadata } from "next";

import { SellerCouponManager } from "@/components/seller/seller-coupon-manager";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { requireSeller } from "@/lib/marketplace/auth";
import { promotionStore } from "@/lib/commerce/promotions";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Coupons" };

export default async function SellerCouponsPage() {
  const { seller } = await requireSeller("/seller/coupons");
  const csrfToken = await getCsrfToken();

  // Seller coupons are namespaced by seller id, so a vendor only ever sees and
  // edits their own.
  const prefix = `seller-${seller.id}-`;
  const coupons = promotionStore
    .all()
    .filter((promotion) => promotion.id.startsWith(prefix))
    .map((promotion) => ({
      id: promotion.id,
      code: promotion.code ?? "",
      label: promotion.label.replace(`${seller.storeName}: `, ""),
      description: promotion.description,
      value: promotion.value,
      minSubtotal: promotion.minSubtotal,
      usageCount: promotion.usageCount,
      usageLimit: promotion.usageLimit,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      active: promotion.active,
    }));

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Percentage discounts that apply only to your products. Marketplace-wide promotions are set by SAMRUX."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Coupons" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Coupons" value={coupons.length} />
        <StatCard
          label="Active"
          value={coupons.filter((coupon) => coupon.active).length}
          tone="positive"
        />
        <StatCard
          label="Redemptions"
          value={coupons.reduce((total, coupon) => total + coupon.usageCount, 0)}
        />
        <StatCard
          label="Expiring soon"
          value={coupons.filter((coupon) => Boolean(coupon.endsAt)).length}
          tone="warning"
        />
      </div>

      <SellerCouponManager csrfToken={csrfToken} coupons={coupons} />
    </>
  );
}
