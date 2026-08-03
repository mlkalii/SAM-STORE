import type { Metadata } from "next";

import { SellerAdminTable } from "@/components/admin/seller-admin-table";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { marketplaceOverview } from "@/lib/marketplace";
import { isFullyVerified } from "@/lib/marketplace/seller-store";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Sellers" };

export default async function AdminSellersPage() {
  await requirePermission("sellers.view", "/admin/sellers");
  const csrfToken = await getCsrfToken();

  const { rows, totals } = await marketplaceOverview();

  return (
    <>
      <PageHeader
        title="Sellers"
        description="Every store on the marketplace: applications, trading performance and what each is owed."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Sellers" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sellers" value={totals.sellers} hint={`${totals.approved} trading`} />
        <StatCard
          label="Awaiting approval"
          value={totals.pending}
          tone={totals.pending > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Marketplace commission" value={formatPrice(totals.commission)} tone="gold" />
        <StatCard label="Owed to sellers" value={formatPrice(totals.owed)} tone="info" />
      </div>

      <Card bodyClassName="p-0">
        <SellerAdminTable
          csrfToken={csrfToken}
          rows={rows.map((row) => ({
            id: row.seller.id,
            slug: row.seller.slug,
            storeName: row.seller.storeName,
            contactEmail: row.seller.contact.email,
            status: row.seller.status,
            featured: row.seller.featured,
            verified: isFullyVerified(row.seller),
            pendingVerification: row.pendingVerification,
            city: row.seller.business.city,
            state: row.seller.business.state,
            productCount: row.productCount,
            orderCount: row.orderCount,
            gross: row.gross,
            commission: row.commission,
            owed: row.balance.available,
            joinedAt: row.seller.joinedAt,
          }))}
        />
      </Card>
    </>
  );
}
