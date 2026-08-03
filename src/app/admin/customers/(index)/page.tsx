import type { Metadata } from "next";

import { CustomerTable } from "@/components/admin/customer-table";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminCustomers } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await requirePermission("customers.view", "/admin/customers");

  const rows = await adminCustomers.rows();

  const totalValue = rows.reduce((total, row) => total + row.lifetimeValue, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has placed an order, ranked by lifetime value."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={rows.length} />
        <StatCard label="Active (30d)" value={rows.filter((row) => row.active).length} tone="positive" />
        <StatCard label="Lifetime value" value={formatPrice(totalValue)} tone="gold" />
        <StatCard
          label="Average value"
          value={formatPrice(rows.length > 0 ? Math.round(totalValue / rows.length) : 0)}
        />
      </div>

      <Card bodyClassName="p-0">
        <CustomerTable rows={rows} />
      </Card>
    </>
  );
}
