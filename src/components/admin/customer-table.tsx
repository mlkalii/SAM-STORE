"use client";

import { Users } from "lucide-react";
import Link from "next/link";

import { DataTable, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: string;
  active: boolean;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function CustomerTable({ rows }: { rows: AdminCustomerRow[] }) {
  const columns: Column<AdminCustomerRow>[] = [
    {
      id: "name",
      header: "Customer",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <Link href={`/admin/customers/${row.id}`} className="block truncate text-sm font-medium hover:underline">
            {row.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => (row.active ? "active" : "dormant"),
      cell: (row) => (
        <Pill tone={row.active ? "positive" : "neutral"}>{row.active ? "active" : "dormant"}</Pill>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      sortValue: (row) => row.orderCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-sm tabular-nums">{row.orderCount}</span>,
    },
    {
      id: "value",
      header: "Lifetime value",
      sortValue: (row) => row.lifetimeValue,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="font-mono text-sm tabular-nums">{formatPrice(row.lifetimeValue)}</span>
      ),
    },
    {
      id: "last",
      header: "Last order",
      sortValue: (row) => row.lastOrderAt,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {dateFormat.format(new Date(row.lastOrderAt))}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search by name or email…"
      emptyIcon={Users}
      emptyTitle="No customers yet"
      emptyDescription="Customers appear here once they have placed an order."
      initialSort={{ columnId: "value", direction: "desc" }}
    />
  );
}
