import type { Metadata } from "next";

import { OrderTable } from "@/components/admin/order-table";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminOrders } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requirePermission("orders.view", "/admin/orders");
  const orders = await adminOrders.all();

  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((total, order) => total + order.totals.grandTotal, 0);

  const rows = orders.map((order) => ({
    id: order.id,
    reference: order.reference,
    email: order.email,
    placedAt: order.placedAt,
    status: order.status,
    paymentStatus: order.payment.status,
    paymentLabel: order.payment.providerLabel,
    itemCount: order.lines.reduce((total, line) => total + line.quantity, 0),
    total: order.totals.grandTotal,
    needsAction:
      order.payment.status === "pending" ||
      order.returnRequest?.status === "requested" ||
      order.status === "processing",
  }));

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order placed through the storefront, newest first."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All orders" value={rows.length} />
        <StatCard label="Needs action" value={rows.filter((row) => row.needsAction).length} tone="warning" />
        <StatCard label="Delivered" value={rows.filter((row) => row.status === "delivered").length} tone="positive" />
        <StatCard label="Revenue" value={formatPrice(revenue)} tone="gold" />
      </div>

      <Card bodyClassName="p-0">
        <OrderTable rows={rows} />
      </Card>
    </>
  );
}
