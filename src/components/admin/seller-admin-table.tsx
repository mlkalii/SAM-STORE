"use client";

import { BadgeCheck, Star, Store } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { setSellerFeaturedAction, setSellerStatusAction } from "@/app/actions/admin";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import { formatPrice } from "@/lib/format";

export interface SellerAdminRow {
  id: string;
  slug: string;
  storeName: string;
  contactEmail: string;
  status: string;
  featured: boolean;
  verified: boolean;
  pendingVerification: number;
  city: string;
  state: string;
  productCount: number;
  orderCount: number;
  gross: number;
  commission: number;
  owed: number;
  joinedAt: string;
}

const statusTone: Record<string, "positive" | "warning" | "danger" | "neutral"> = {
  approved: "positive",
  pending: "warning",
  suspended: "danger",
  rejected: "danger",
  draft: "neutral",
};

const FILTERS = ["all", "pending", "approved", "suspended"] as const;

export function SellerAdminTable({
  csrfToken,
  rows,
}: {
  csrfToken: string;
  rows: SellerAdminRow[];
}) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");
  const [pending, startTransition] = React.useTransition();

  function post(
    action: (prev: never, form: FormData) => Promise<{ ok: boolean; message?: string }>,
    entries: Record<string, string>,
  ) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      for (const [key, value] of Object.entries(entries)) form.set(key, value);

      const result = await action(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Done");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const visible = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  const columns: Column<SellerAdminRow>[] = [
    {
      id: "store",
      header: "Store",
      sortValue: (row) => row.storeName,
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/sellers/${row.id}`}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <span className="truncate">{row.storeName}</span>
            {row.verified ? (
              <BadgeCheck
                className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-label="Verified"
              />
            ) : null}
            {row.featured ? (
              <Star className="size-3 shrink-0 fill-gold text-gold" aria-label="Featured" />
            ) : null}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {row.contactEmail} · {row.city}, {row.state}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Pill tone={statusTone[row.status] ?? "neutral"}>{row.status}</Pill>
          {row.pendingVerification > 0 ? (
            <Pill tone="warning">{row.pendingVerification} to review</Pill>
          ) : null}
        </div>
      ),
    },
    {
      id: "products",
      header: "Products",
      sortValue: (row) => row.productCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-xs tabular-nums">{row.productCount}</span>,
    },
    {
      id: "orders",
      header: "Orders",
      sortValue: (row) => row.orderCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-xs tabular-nums">{row.orderCount}</span>,
    },
    {
      id: "gross",
      header: "Gross",
      sortValue: (row) => row.gross,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="block">
          <span className="font-mono text-sm tabular-nums">{formatPrice(row.gross)}</span>
          <span className="block font-mono text-[11px] text-muted-foreground">
            {formatPrice(row.commission)} commission
          </span>
        </span>
      ),
    },
    {
      id: "owed",
      header: "Owed",
      sortValue: (row) => row.owed,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs tabular-nums">{formatPrice(row.owed)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          {row.status === "pending" ? (
            <>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={pending}
                onClick={() => post(setSellerStatusAction, { id: row.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                disabled={pending}
                onClick={() => post(setSellerStatusAction, { id: row.id, status: "rejected" })}
              >
                Reject
              </Button>
            </>
          ) : row.status === "approved" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={pending}
                onClick={() => post(setSellerFeaturedAction, { id: row.id })}
              >
                {row.featured ? "Unfeature" : "Feature"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                disabled={pending}
                onClick={() => post(setSellerStatusAction, { id: row.id, status: "suspended" })}
              >
                Suspend
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={pending}
              onClick={() => post(setSellerStatusAction, { id: row.id, status: "approved" })}
            >
              Reinstate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      rows={visible}
      columns={columns}
      getRowId={(row) => row.id}
      searchPlaceholder="Search stores by name, email or city…"
      emptyIcon={Store}
      emptyTitle="No sellers"
      emptyDescription="Applications appear here the moment they are submitted."
      initialSort={{ columnId: "gross", direction: "desc" }}
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
