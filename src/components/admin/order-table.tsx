"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DataTable, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_TONE } from "@/lib/status-tones";

export interface AdminOrderRow {
  id: string;
  reference: string;
  email: string;
  placedAt: string;
  status: string;
  paymentStatus: string;
  paymentLabel: string;
  itemCount: number;
  total: number;
  needsAction: boolean;
}


const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS = ["all", "needs-action", "processing", "shipped", "delivered", "cancelled"] as const;

export function OrderTable({ rows }: { rows: AdminOrderRow[] }) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "needs-action") return rows.filter((row) => row.needsAction);
    return rows.filter((row) => row.status === filter);
  }, [rows, filter]);

  const columns: Column<AdminOrderRow>[] = [
    {
      id: "reference",
      header: "Order",
      sortValue: (row) => row.reference,
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/orders/${row.id}`}
            className="font-mono text-xs font-medium hover:underline"
          >
            {row.reference}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      id: "placedAt",
      header: "Placed",
      sortValue: (row) => row.placedAt,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {dateFormat.format(new Date(row.placedAt))}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <Pill tone={ORDER_STATUS_TONE[row.status] ?? "neutral"}>{row.status.replaceAll("-", " ")}</Pill>,
    },
    {
      id: "payment",
      header: "Payment",
      sortValue: (row) => row.paymentStatus,
      cell: (row) => (
        <div>
          <Pill tone={row.paymentStatus === "captured" ? "positive" : row.paymentStatus === "pending" ? "warning" : "danger"}>
            {row.paymentStatus}
          </Pill>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{row.paymentLabel}</p>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      sortValue: (row) => row.itemCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-xs tabular-nums">{row.itemCount}</span>,
    },
    {
      id: "total",
      header: "Total",
      sortValue: (row) => row.total,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="font-mono text-sm tabular-nums">{formatPrice(row.total)}</span>
      ),
    },
  ];

  return (
    <DataTable
      rows={filtered}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search by reference or email…"
      emptyIcon={ShoppingCart}
      emptyTitle="No orders match"
      emptyDescription="Try a different filter or search term."
      initialSort={{ columnId: "placedAt", direction: "desc" }}
      toolbar={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((entry) => (
            <Button
              key={entry}
              size="sm"
              variant={filter === entry ? "default" : "ghost"}
              className={cn("h-8 px-2.5 text-xs capitalize")}
              onClick={() => setFilter(entry)}
            >
              {entry.replaceAll("-", " ")}
            </Button>
          ))}
        </div>
      }
    />
  );
}
