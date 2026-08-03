import type { Metadata } from "next";

import { SellerOrderTable } from "@/components/seller/seller-order-table";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { adminOrders } from "@/lib/admin";
import { requireSeller } from "@/lib/marketplace/auth";
import { commissionFor } from "@/lib/marketplace/commission";
import { linesForSeller, ordersForSeller } from "@/lib/marketplace/settlement";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

export default async function SellerOrdersPage() {
  const { seller } = await requireSeller("/seller/orders");
  const csrfToken = await getCsrfToken();

  const orders = ordersForSeller(await adminOrders.all(), seller.id);

  const rows = orders.map((order) => {
    const lines = linesForSeller(order, seller.id);
    const breakdown = commissionFor(seller.id, lines);

    return {
      id: order.id,
      reference: order.reference,
      placedAt: order.placedAt,
      status: order.status,
      customer: order.shippingAddress.recipient,
      email: order.email,
      items: lines.reduce((total, line) => total + line.quantity, 0),
      gross: breakdown.gross,
      net: breakdown.net,
      trackingNumber: order.trackingNumber,
      needsReturn:
        order.returnRequest?.status === "requested" || order.refund?.status === "requested",
    };
  });

  const earning = rows.filter((row) => row.status !== "cancelled" && row.status !== "refunded");

  return (
    <>
      <PageHeader
        title="Orders"
        description="Only your lines. Other sellers' items in the same basket are not shown."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Orders" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All orders" value={rows.length} />
        <StatCard
          label="Awaiting action"
          value={rows.filter((row) => row.status === "processing").length}
          tone="warning"
        />
        <StatCard
          label="Returns to handle"
          value={rows.filter((row) => row.needsReturn).length}
          tone={rows.some((row) => row.needsReturn) ? "danger" : "neutral"}
        />
        <StatCard
          label="Your earnings"
          value={formatPrice(earning.reduce((total, row) => total + row.net, 0))}
          tone="gold"
        />
      </div>

      <Card bodyClassName="p-0">
        <SellerOrderTable csrfToken={csrfToken} rows={rows} />
      </Card>
    </>
  );
}
