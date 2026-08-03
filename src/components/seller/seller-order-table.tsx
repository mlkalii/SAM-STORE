"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { acceptOrderAction } from "@/app/actions/seller";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import { formatStoreDateTime } from "@/config/store";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_TONE } from "@/lib/status-tones";

export interface SellerOrderRow {
  id: string;
  reference: string;
  placedAt: string;
  status: string;
  customer: string;
  email: string;
  items: number;
  gross: number;
  net: number;
  trackingNumber?: string;
  needsReturn: boolean;
}


const FILTERS = ["all", "processing", "packed", "shipped", "delivered", "cancelled"] as const;

export function SellerOrderTable({
  csrfToken,
  rows,
}: {
  csrfToken: string;
  rows: SellerOrderRow[];
}) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");
  const [pending, startTransition] = React.useTransition();

  function accept(orderId: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("orderId", orderId);

      const result = await acceptOrderAction(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Accepted");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const visible = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  const columns: Column<SellerOrderRow>[] = [
    {
      id: "reference",
      header: "Order",
      sortValue: (row) => row.reference,
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/seller/orders/${row.id}`}
            className="block font-mono text-xs underline-offset-4 hover:underline"
          >
            {row.reference}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.customer}</p>
        </div>
      ),
    },
    {
      id: "placed",
      header: "Placed",
      sortValue: (row) => row.placedAt,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{formatStoreDateTime(row.placedAt)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Pill tone={ORDER_STATUS_TONE[row.status] ?? "neutral"}>{row.status.replaceAll("-", " ")}</Pill>
          {row.needsReturn ? <Pill tone="danger">return</Pill> : null}
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      sortValue: (row) => row.items,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-xs tabular-nums">{row.items}</span>,
    },
    {
      id: "net",
      header: "You earn",
      sortValue: (row) => row.net,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="block">
          <span className="font-mono text-sm tabular-nums">{formatPrice(row.net)}</span>
          <span className="block font-mono text-[11px] text-muted-foreground">
            of {formatPrice(row.gross)}
          </span>
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        row.status === "processing" ? (
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={pending}
            onClick={() => accept(row.id)}
          >
            Accept
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            render={<Link href={`/seller/orders/${row.id}`} />}
          >
            Open
          </Button>
        ),
    },
  ];

  return (
    <DataTable
      rows={visible}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search by reference, customer or email…"
      emptyIcon={ShoppingCart}
      emptyTitle="No orders"
      emptyDescription="Orders containing your products land here immediately."
      initialSort={{ columnId: "placed", direction: "desc" }}
      toolbar={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((entry) => (
            <Button
              key={entry}
              size="sm"
              variant={filter === entry ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs capitalize"
              onClick={() => setFilter(entry)}
            >
              {entry}
            </Button>
          ))}
        </div>
      }
    />
  );
}
