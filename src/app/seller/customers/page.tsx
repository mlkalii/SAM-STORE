import type { Metadata } from "next";
import { Users } from "lucide-react";

import { Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { formatStoreDate } from "@/config/store";
import { adminOrders } from "@/lib/admin";
import { requireSeller } from "@/lib/marketplace/auth";
import { commissionFor } from "@/lib/marketplace/commission";
import { linesForSeller, ordersForSeller } from "@/lib/marketplace/settlement";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

export default async function SellerCustomersPage() {
  const { seller } = await requireSeller("/seller/customers");

  const orders = ordersForSeller(await adminOrders.all(), seller.id).filter(
    (order) => order.status !== "cancelled",
  );

  // Customers are derived from orders — a seller never sees a shopper who has
  // not bought from them.
  const byUser = new Map<
    string,
    { name: string; email: string; orders: number; spend: number; last: string }
  >();

  for (const order of orders) {
    const value = commissionFor(seller.id, linesForSeller(order, seller.id)).gross;
    const existing = byUser.get(order.userId) ?? {
      name: order.shippingAddress.recipient,
      email: order.email,
      orders: 0,
      spend: 0,
      last: order.placedAt,
    };

    existing.orders += 1;
    existing.spend += value;
    if (order.placedAt > existing.last) existing.last = order.placedAt;
    byUser.set(order.userId, existing);
  }

  const rows = [...byUser.entries()]
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.spend - a.spend);

  const totalSpend = rows.reduce((total, row) => total + row.spend, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has bought from your store, ranked by what they have spent with you."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Customers" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={rows.length} />
        <StatCard
          label="Repeat buyers"
          value={rows.filter((row) => row.orders > 1).length}
          tone="positive"
        />
        <StatCard label="Total spend" value={formatPrice(totalSpend)} tone="gold" />
        <StatCard
          label="Average per customer"
          value={formatPrice(rows.length > 0 ? Math.round(totalSpend / rows.length) : 0)}
        />
      </div>

      <Card bodyClassName="p-0">
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="They appear here as soon as someone buys from your store."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-medium">Customer</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Last order</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Orders</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Spent with you</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium">{row.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatStoreDate(row.last)}
                    </td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums">{row.orders}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs tabular-nums">
                      {formatPrice(row.spend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
