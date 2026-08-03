"use client";

import { Boxes } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { adjustSellerStockAction } from "@/app/actions/seller";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_FIELD } from "@/config/auth";
import { formatPrice } from "@/lib/format";

interface InventoryRow {
  slug: string;
  name: string;
  sku: string;
  category: string;
  stockCount: number;
  price: number;
  status: string;
}

export function SellerInventoryManager({
  csrfToken,
  rows,
  threshold,
}: {
  csrfToken: string;
  rows: InventoryRow[];
  threshold: number;
}) {
  const [pending, startTransition] = React.useTransition();
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  function save(slug: string, value: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("slug", slug);
      form.set("stockCount", value);

      const result = await adjustSellerStockAction(undefined as never, form);
      if (result.ok) {
        toast.success(result.message ?? "Stock updated");
        // Clear the draft so the row falls back to the server value.
        setDrafts((current) => {
          const next = { ...current };
          delete next[slug];
          return next;
        });
      } else {
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  const columns: Column<InventoryRow>[] = [
    {
      id: "name",
      header: "Product",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/seller/products/${row.slug}`}
            className="block truncate text-sm hover:underline"
          >
            {row.name}
          </Link>
          <p className="truncate font-mono text-xs text-muted-foreground">{row.sku}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Listing",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Pill tone={row.status === "published" ? "positive" : "neutral"}>{row.status}</Pill>
      ),
    },
    {
      id: "value",
      header: "Value",
      sortValue: (row) => row.price * row.stockCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatPrice(row.price * Math.max(0, row.stockCount))}
        </span>
      ),
    },
    {
      id: "stock",
      header: "In stock",
      sortValue: (row) => row.stockCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => {
        const draft = drafts[row.slug];
        const value = draft ?? String(row.stockCount);
        const dirty = draft !== undefined && draft !== String(row.stockCount);

        return (
          <span className="flex items-center justify-end gap-2">
            {row.stockCount <= 0 ? (
              <Pill tone="danger">out</Pill>
            ) : row.stockCount <= threshold ? (
              <Pill tone="warning">low</Pill>
            ) : null}

            <Input
              type="number"
              min={0}
              value={value}
              aria-label={`Stock for ${row.name}`}
              className="h-8 w-20 text-right text-sm tabular-nums"
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [row.slug]: event.target.value }))
              }
            />

            <Button
              size="sm"
              variant={dirty ? "default" : "outline"}
              className="h-8 text-xs"
              disabled={pending || !dirty}
              onClick={() => save(row.slug, value)}
            >
              Save
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.slug}
      searchPlaceholder="Search by product or SKU…"
      emptyIcon={Boxes}
      emptyTitle="No stock to manage"
      emptyDescription="Add a product and its stock appears here."
      initialSort={{ columnId: "stock", direction: "asc" }}
    />
  );
}
