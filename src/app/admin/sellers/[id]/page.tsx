import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";

import { SellerVerificationPanel } from "@/components/admin/seller-verification-panel";
import { AdminForm, SelectInput, TextArea, TextInput } from "@/components/admin/form-shell";
import { setSellerCommissionAction, setSellerStatusAction } from "@/app/actions/admin";
import { Card, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatStoreDate, formatStoreDateTime, stateName } from "@/config/store";
import { requirePermission } from "@/lib/admin/auth";
import { adminOrders } from "@/lib/admin";
import { commissionFor, DEFAULT_COMMISSION_RATE } from "@/lib/marketplace/commission";
import { balanceFor, ledger, payoutStore } from "@/lib/marketplace/payouts";
import { reviewStore } from "@/lib/marketplace/reviews";
import { isFullyVerified, sellerStore } from "@/lib/marketplace/seller-store";
import { linesForSeller, ordersForSeller } from "@/lib/marketplace/settlement";
import { sellerCatalogue } from "@/lib/marketplace";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Seller" };

const statusTone: Record<string, "positive" | "warning" | "danger" | "neutral"> = {
  approved: "positive",
  pending: "warning",
  suspended: "danger",
  rejected: "danger",
  draft: "neutral",
};

export default async function AdminSellerPage(props: PageProps<"/admin/sellers/[id]">) {
  const { id } = await props.params;
  await requirePermission("sellers.view", `/admin/sellers/${id}`);
  const csrfToken = await getCsrfToken();

  const seller = sellerStore.find(id);
  if (!seller) notFound();

  const [catalogue, allOrders] = await Promise.all([sellerCatalogue(id), adminOrders.all()]);
  const orders = ordersForSeller(allOrders, id);
  const balance = balanceFor(id);

  const gross = orders
    .filter((order) => order.status !== "cancelled" && order.status !== "refunded")
    .reduce((total, order) => total + commissionFor(id, linesForSeller(order, id)).gross, 0);

  const reviews = reviewStore.forSeller(id, { includeUnpublished: true });

  return (
    <>
      <PageHeader
        title={seller.storeName}
        description={`${seller.business.legalName} · joined ${formatStoreDate(seller.joinedAt)}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Sellers", href: "/admin/sellers" },
          { label: seller.storeName },
        ]}
        actions={
          seller.status === "approved" ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/sellers/${seller.slug}`} target="_blank" />}
            >
              View storefront
              <ExternalLink className="size-3" aria-hidden />
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales" value={formatPrice(gross)} tone="gold" />
        <StatCard label="Commission taken" value={formatPrice(balance.lifetimeCommission)} />
        <StatCard label="Owed now" value={formatPrice(balance.available)} tone="info" />
        <StatCard label="Products" value={catalogue.length} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <SellerVerificationPanel
            csrfToken={csrfToken}
            sellerId={seller.id}
            records={seller.verification}
          />

          <Card title="Business record">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Legal name</dt>
                <dd className="text-sm">{seller.business.legalName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="text-sm capitalize">{seller.business.type.replaceAll("-", " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tax ID</dt>
                <dd className="font-mono text-sm">{seller.business.taxId}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Registration</dt>
                <dd className="text-sm">{seller.business.registrationNumber ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="text-sm">
                  {seller.business.addressLine1}
                  {seller.business.addressLine2 ? `, ${seller.business.addressLine2}` : ""},{" "}
                  {seller.business.city}, {stateName(seller.business.state)}{" "}
                  {seller.business.postcode}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contact</dt>
                <dd className="text-sm">
                  {seller.contact.name} · {seller.contact.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="text-sm">{seller.contact.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Payout destination</dt>
                <dd className="text-sm">
                  {seller.banking
                    ? `${seller.banking.accountName} · •••• ${seller.banking.accountLast4}${
                        seller.banking.walletAddress
                          ? ` · ${seller.banking.walletAddress.slice(0, 12)}…`
                          : ""
                      }`
                    : "Not provided"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Recent orders" bodyClassName="p-0">
            {orders.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {orders.slice(0, 10).map((order) => {
                  const breakdown = commissionFor(id, linesForSeller(order, id));
                  return (
                    <li key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs underline-offset-4 hover:underline"
                      >
                        {order.reference}
                      </Link>
                      <Pill tone="neutral">{order.status.replaceAll("-", " ")}</Pill>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatStoreDate(order.placedAt)}
                      </span>
                      <span className="w-24 text-right font-mono text-xs tabular-nums">
                        {formatPrice(breakdown.gross)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Ledger" description="Every movement on this seller's balance" bodyClassName="p-0">
            {ledger.forSeller(id).length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <ul className="divide-y">
                {ledger.forSeller(id).slice(0, 12).map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                    <Pill tone="neutral">{row.kind.replaceAll("-", " ")}</Pill>
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

        <div className="space-y-4">
          <Card title="Status">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Pill tone={statusTone[seller.status] ?? "neutral"}>{seller.status}</Pill>
              {isFullyVerified(seller) ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  fully verified
                </span>
              ) : null}
            </div>

            {seller.statusNote ? (
              <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/8 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                {seller.statusNote}
              </p>
            ) : null}

            <AdminForm
              action={setSellerStatusAction}
              csrfToken={csrfToken}
              hidden={{ id: seller.id }}
              submitLabel="Update status"
            >
              <SelectInput
                name="status"
                label="Status"
                defaultValue={seller.status}
                options={[
                  { value: "approved", label: "Approved — trading" },
                  { value: "pending", label: "Pending review" },
                  { value: "suspended", label: "Suspended" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <TextArea
                name="note"
                label="Note to the seller"
                rows={3}
                hint="Shown on their status page"
              />
            </AdminForm>
          </Card>

          <Card title="Commission">
            <AdminForm
              action={setSellerCommissionAction}
              csrfToken={csrfToken}
              hidden={{ id: seller.id }}
              submitLabel="Save rate"
            >
              <TextInput
                name="commissionOverride"
                label="Negotiated rate (%)"
                inputMode="decimal"
                defaultValue={
                  seller.commissionOverride !== undefined
                    ? String(seller.commissionOverride)
                    : ""
                }
                hint={`Blank uses the standard rules (${DEFAULT_COMMISSION_RATE}% plus department rates)`}
              />
            </AdminForm>
          </Card>

          <Card title="At a glance">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Rating</dt>
                <dd>{seller.rating > 0 ? `${seller.rating.toFixed(1)} ★` : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reviews</dt>
                <dd>{reviews.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Followers</dt>
                <dd>{seller.followerCount.toLocaleString("en-US")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Withdrawals</dt>
                <dd>{payoutStore.forSeller(id).length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Dispatch</dt>
                <dd>{seller.dispatchHours}h</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
