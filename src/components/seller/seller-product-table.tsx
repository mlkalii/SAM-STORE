"use client";

import { Package, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  deleteSellerProductAction,
  setSellerProductStatusAction,
} from "@/app/actions/seller";
import { DataTable, type BulkAction, type Column } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SellerProductRow {
  slug: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stockCount: number;
  status: "published" | "draft" | "archived";
  visible: boolean;
  image: string;
  gradient: string;
  rating: number;
  reviewCount: number;
}

const statusTone: Record<string, "positive" | "warning" | "neutral"> = {
  published: "positive",
  draft: "warning",
  archived: "neutral",
};

export function SellerProductTable({
  csrfToken,
  rows,
  threshold,
}: {
  csrfToken: string;
  rows: SellerProductRow[];
  threshold: number;
}) {
  const [pending, startTransition] = React.useTransition();

  function post(
    action: (prev: never, form: FormData) => Promise<{ ok: boolean; message?: string }>,
    entries: Record<string, string>,
  ) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const form = new FormData();
        form.set(CSRF_FIELD, csrfToken);
        for (const [key, value] of Object.entries(entries)) form.set(key, value);

        const result = await action(undefined as never, form);
        if (result.ok) toast.success(result.message ?? "Done");
        else toast.error(result.message ?? "That did not work");
        resolve();
      });
    });
  }

  const columns: Column<SellerProductRow>[] = [
    {
      id: "name",
      header: "Product",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "size-9 shrink-0 overflow-hidden rounded-lg bg-linear-to-br",
              row.gradient,
            )}
          >
            {row.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- thumbnails are already sized and come from the catalogue CDN
              <img src={row.image} alt="" className="size-full object-cover" loading="lazy" />
            ) : null}
          </span>
          <div className="min-w-0">
            <Link
              href={`/seller/products/${row.slug}`}
              className="block truncate text-sm font-medium hover:underline"
            >
              {row.name}
            </Link>
            <p className="truncate font-mono text-xs text-muted-foreground">{row.sku}</p>
          </div>
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
          {row.visible ? null : <Pill tone="neutral">hidden</Pill>}
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      sortValue: (row) => row.price,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="block">
          <span className="font-mono text-sm tabular-nums">{formatPrice(row.price)}</span>
          {row.compareAtPrice ? (
            <span className="block font-mono text-xs text-muted-foreground line-through">
              {formatPrice(row.compareAtPrice)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      sortValue: (row) => row.stockCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="flex items-center justify-end gap-2">
          <span className="font-mono text-sm tabular-nums">{row.stockCount}</span>
          {row.stockCount <= 0 ? (
            <Pill tone="danger">out</Pill>
          ) : row.stockCount <= threshold ? (
            <Pill tone="warning">low</Pill>
          ) : null}
        </span>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      sortValue: (row) => row.rating,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) =>
        row.reviewCount > 0 ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.rating.toFixed(1)}★ · {row.reviewCount.toLocaleString("en-US")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={pending}
            onClick={() =>
              post(setSellerProductStatusAction, {
                slug: row.slug,
                status: row.status === "published" ? "draft" : "published",
              })
            }
          >
            {row.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${row.name}`}
            render={<Link href={`/seller/products/${row.slug}`} />}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Delete ${row.name}`}
            disabled={pending}
            onClick={() => post(deleteSellerProductAction, { slug: row.slug })}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction<SellerProductRow>[] = [
    {
      id: "publish",
      label: "Publish",
      run: async (selected) => {
        for (const row of selected) {
          await post(setSellerProductStatusAction, { slug: row.slug, status: "published" });
        }
      },
    },
    {
      id: "draft",
      label: "Move to draft",
      run: async (selected) => {
        for (const row of selected) {
          await post(setSellerProductStatusAction, { slug: row.slug, status: "draft" });
        }
      },
    },
    {
      id: "archive",
      label: "Archive",
      destructive: true,
      run: async (selected) => {
        for (const row of selected) {
          await post(setSellerProductStatusAction, { slug: row.slug, status: "archived" });
        }
      },
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.slug}
      bulkActions={bulkActions}
      searchPlaceholder="Search your products…"
      emptyIcon={Package}
      emptyTitle="No products yet"
      emptyDescription="Add your first listing and it will appear here."
    />
  );
}
