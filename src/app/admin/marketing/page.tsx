import type { Metadata } from "next";

import { MarketingManager } from "@/components/admin/marketing-manager";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { categories } from "@/data/categories";
import { requirePermission } from "@/lib/admin/auth";
import { giftCardStore } from "@/lib/commerce/gift-cards";
import { promotionStore } from "@/lib/commerce/promotions";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  await requirePermission("marketing.view", "/admin/marketing");
  const csrfToken = await getCsrfToken();

  const promotions = promotionStore.all();
  const giftCards = giftCardStore.all();
  const outstanding = giftCards.reduce((total, card) => total + card.balance, 0);

  return (
    <>
      <PageHeader
        title="Marketing"
        description="Coupons, automatic promotions, flash deals, bundles and gift cards."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Marketing" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active promotions"
          value={promotions.filter((promotion) => promotion.active).length}
          hint={`${promotions.length} total`}
          tone="positive"
        />
        <StatCard
          label="Coupon codes"
          value={promotions.filter((promotion) => promotion.code).length}
        />
        <StatCard
          label="Total redemptions"
          value={promotions.reduce((total, promotion) => total + promotion.usageCount, 0)}
        />
        <StatCard
          label="Gift card liability"
          value={formatPrice(outstanding)}
          hint={`${giftCards.filter((card) => card.active).length} active cards`}
          tone="gold"
        />
      </div>

      <MarketingManager
        csrfToken={csrfToken}
        promotions={promotions}
        giftCards={giftCards}
        categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
      />
    </>
  );
}
