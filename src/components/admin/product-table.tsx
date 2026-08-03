"use client";

import { Copy, Package, Pencil } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  deleteProductAction,
  duplicateProductAction,
  setProductStatusAction,
} from "@/app/actions/admin";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import { formatPrice } from "@/lib/format";

export interface AdminProductRow {
  slug: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  status: string;
  visible: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
}

/**
 * Product list.
 *
 * Bulk actions post to the same server actions the single-row controls use, so
 * publishing one product and publishing forty follow exactly one code path.
 */
export function ProductTable({
  rows,
  csrfToken,
  canDelete,
}: {
  rows: AdminProductRow[];
  csrfToken: string;
  canDelete: boolean;
}) {
  const [pending, startTransition] = React.useTransition();

  function run(
    action: (state: never, form: FormData) => Promise<{ ok: boolean; message?: string }>,
    fields: Record<string, string>,
  ) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      for (const [key, value] of Object.entries(fields)) form.set(key, value);

      const result = await action(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Done");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const columns: Column<AdminProductRow>[] = [
    {
      id: "name",
      header: "Product",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/products/${row.slug}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {row.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {row.brand} · <span className="font-mono">{row.sku}</span>
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
          <Pill
            tone={
              row.status === "published" ? "positive" : row.status === "draft" ? "warning" : "neutral"
            }
          >
            {row.status}
          </Pill>
          {!row.visible ? <Pill tone="neutral">hidden</Pill> : null}
        </div>
      ),
    },
    {
      id: "category",
      header: "Department",
      sortValue: (row) => row.category,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.category}</span>,
    },
    {
      id: "price",
      header: "Price",
      sortValue: (row) => row.price,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <div className="text-right">
          <span className="font-mono text-sm tabular-nums">{formatPrice(row.price)}</span>
          {row.compareAtPrice ? (
            <span className="block font-mono text-[10px] text-muted-foreground line-through tabular-nums">
              {formatPrice(row.compareAtPrice)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      sortValue: (row) => row.stock,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span
          className={
            row.stock <= 0
              ? "font-mono text-sm tabular-nums text-destructive"
              : row.stock <= 10
                ? "font-mono text-sm tabular-nums text-amber-600 dark:text-amber-400"
                : "font-mono text-sm tabular-nums"
          }
        >
          {row.stock}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${row.name}`}
            render={<Link href={`/admin/products/${row.slug}`} />}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Duplicate ${row.name}`}
            disabled={pending}
            onClick={() => run(duplicateProductAction, { slug: row.slug })}
          >
            <Copy className="size-3.5" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.slug}
      searchPlaceholder="Search by name, SKU or brand…"
      emptyIcon={Package}
      emptyTitle="No products match"
      emptyDescription="Try a different search, or clear the filters."
      initialSort={{ columnId: "name", direction: "asc" }}
      bulkActions={[
        {
          id: "publish",
          label: "Publish",
          run: (selected) =>
            run(setProductStatusAction, {
              slugs: selected.map((row) => row.slug).join(","),
              status: "published",
            }),
        },
        {
          id: "draft",
          label: "Move to draft",
          run: (selected) =>
            run(setProductStatusAction, {
              slugs: selected.map((row) => row.slug).join(","),
              status: "draft",
            }),
        },
        {
          id: "archive",
          label: "Archive",
          run: (selected) =>
            run(setProductStatusAction, {
              slugs: selected.map((row) => row.slug).join(","),
              status: "archived",
            }),
        },
        ...(canDelete
          ? [
              {
                id: "delete",
                label: "Delete",
                destructive: true,
                run: (selected: AdminProductRow[]) =>
                  run(deleteProductAction, {
                    slugs: selected.map((row) => row.slug).join(","),
                  }),
              },
            ]
          : []),
      ]}
    />
  );
}
