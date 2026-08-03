import type { Metadata } from "next";

import { SellerPayoutPanel } from "@/components/seller/seller-payout-panel";
import { Card, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { formatStoreDateTime } from "@/config/store";
import { requireSeller } from "@/lib/marketplace/auth";
import { balanceFor, ledger, MINIMUM_PAYOUT, payoutStore } from "@/lib/marketplace/payouts";
import { DEFAULT_COMMISSION_RATE } from "@/lib/marketplace/commission";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Payouts" };

const kindTone: Record<string, "positive" | "danger" | "neutral" | "warning"> = {
  sale: "positive",
  commission: "warning",
  refund: "danger",
  "commission-reversal": "positive",
  payout: "neutral",
  adjustment: "neutral",
};

const payoutTone: Record<string, "positive" | "warning" | "info" | "danger"> = {
  requested: "warning",
  approved: "info",
  processing: "info",
  paid: "positive",
  rejected: "danger",
};

export default async function SellerPayoutsPage() {
  const { seller } = await requireSeller("/seller/payouts");
  const csrfToken = await getCsrfToken();

  const balance = balanceFor(seller.id);
  const payouts = payoutStore.forSeller(seller.id);
  const transactions = ledger.forSeller(seller.id);

  return (
    <>
      <PageHeader
        title="Payouts"
        description="Your earnings, your withdrawals and every transaction behind them."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Payouts" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available" value={formatPrice(balance.available)} tone="gold" />
        <StatCard label="Pending withdrawal" value={formatPrice(balance.pending)} tone="warning" />
        <StatCard label="Paid out" value={formatPrice(balance.paidOut)} tone="positive" />
        <StatCard
          label="Commission paid"
          value={formatPrice(balance.lifetimeCommission)}
          hint={
            seller.commissionOverride !== undefined
              ? `${seller.commissionOverride}% negotiated`
              : `${DEFAULT_COMMISSION_RATE}% standard`
          }
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <Card title="Withdrawals" bodyClassName="p-0">
            {payouts.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No withdrawals yet. Request one once your balance passes{" "}
                {formatPrice(MINIMUM_PAYOUT)}.
              </p>
            ) : (
              <ul className="divide-y">
                {payouts.map((payout) => (
                  <li key={payout.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <code className="font-mono text-xs">{payout.reference}</code>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">{payout.destination}</p>
                      {payout.transactionRef ? (
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {payout.transactionRef}
                        </p>
                      ) : null}
                    </div>
                    <Pill tone={payoutTone[payout.status] ?? "neutral"}>{payout.status}</Pill>
                    <span className="text-xs text-muted-foreground">
                      {formatStoreDateTime(payout.requestedAt)}
                    </span>
                    <span className="w-24 text-right font-mono text-sm tabular-nums">
                      {formatPrice(payout.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Transaction history"
            description="Every movement on your balance"
            bodyClassName="p-0"
          >
            {transactions.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                Nothing yet. Sales, commission and withdrawals all appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {transactions.slice(0, 40).map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                    <Pill tone={kindTone[row.kind] ?? "neutral"}>
                      {row.kind.replaceAll("-", " ")}
                    </Pill>
                    <span className="min-w-0 flex-1 truncate text-xs">{row.description}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatStoreDateTime(row.createdAt)}
                    </span>
                    <span
                      className={
                        row.amount >= 0
                          ? "w-24 text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400"
                          : "w-24 text-right font-mono text-xs tabular-nums text-destructive"
                      }
                    >
                      {row.amount >= 0 ? "+" : "−"}
                      {formatPrice(Math.abs(row.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <SellerPayoutPanel
          csrfToken={csrfToken}
          available={balance.available}
          minimum={MINIMUM_PAYOUT}
          banking={
            seller.banking
              ? {
                  accountName: seller.banking.accountName,
                  accountLast4: seller.banking.accountLast4,
                  walletAddress: seller.banking.walletAddress,
                }
              : null
          }
        />
      </div>
    </>
  );
}
