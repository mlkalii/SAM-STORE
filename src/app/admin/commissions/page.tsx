import type { Metadata } from "next";

import { CommissionManager } from "@/components/admin/commission-manager";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { categories } from "@/data/categories";
import { requirePermission } from "@/lib/admin/auth";
import { commissionStore, DEFAULT_COMMISSION_RATE } from "@/lib/marketplace/commission";
import { marketplaceEarnings } from "@/lib/marketplace/payouts";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Commissions" };

export default async function AdminCommissionsPage() {
  await requirePermission("commissions.view", "/admin/commissions");
  const csrfToken = await getCsrfToken();

  const rules = commissionStore.all();
  const earnings = marketplaceEarnings();

  return (
    <>
      <PageHeader
        title="Commissions"
        description="How the marketplace takes its cut. Rules resolve most specific first: seller override, then department, then the standard rate."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Commissions" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commission earned" value={formatPrice(earnings.commission)} tone="gold" />
        <StatCard label="Gross through marketplace" value={formatPrice(earnings.gross)} />
        <StatCard label="Standard rate" value={`${DEFAULT_COMMISSION_RATE}%`} />
        <StatCard
          label="Active rules"
          value={rules.filter((rule) => rule.active).length}
          hint={`${rules.length} total`}
        />
      </div>

      <CommissionManager
        csrfToken={csrfToken}
        rules={rules}
        categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
        sellers={sellerStore
          .all()
          .map((seller) => ({ id: seller.id, name: seller.storeName, override: seller.commissionOverride }))}
      />
    </>
  );
}
