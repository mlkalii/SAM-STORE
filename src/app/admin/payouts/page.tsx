import type { Metadata } from "next";

import { PayoutManager } from "@/components/admin/payout-manager";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { marketplaceEarnings, payoutStore } from "@/lib/marketplace/payouts";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Payouts" };

export default async function AdminPayoutsPage() {
  await requirePermission("payouts.view", "/admin/payouts");
  const csrfToken = await getCsrfToken();

  const payouts = payoutStore.all();
  const earnings = marketplaceEarnings();

  const rows = payouts.map((payout) => {
    const seller = sellerStore.find(payout.sellerId);
    return {
      id: payout.id,
      reference: payout.reference,
      sellerId: payout.sellerId,
      sellerName: seller?.storeName ?? payout.sellerId,
      amount: payout.amount,
      status: payout.status,
      destination: payout.destination,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
      processedBy: payout.processedBy,
      transactionRef: payout.transactionRef,
      note: payout.note,
    };
  });

  return (
    <>
      <PageHeader
        title="Payouts"
        description="Withdrawal requests from sellers. Approving one does not move money; marking it paid records the transfer against the ledger."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payouts" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting decision"
          value={rows.filter((row) => row.status === "requested").length}
          tone="warning"
        />
        <StatCard
          label="In flight"
          value={rows.filter((row) => row.status === "approved" || row.status === "processing").length}
          tone="info"
        />
        <StatCard label="Paid out" value={formatPrice(earnings.paidOut)} tone="positive" />
        <StatCard label="Owed to sellers" value={formatPrice(earnings.owed)} tone="gold" />
      </div>

      <PayoutManager csrfToken={csrfToken} rows={rows} />
    </>
  );
}
