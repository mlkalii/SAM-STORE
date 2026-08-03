"use client";

import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { deleteBrandAction, saveBrandAction } from "@/app/actions/admin";
import { AdminForm, CheckboxInput, TextArea, TextInput } from "@/components/admin/form-shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";

export interface AdminBrandRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  featured: boolean;
  managed: boolean;
  productCount: number;
}

export function BrandManager({
  csrfToken,
  brands,
}: {
  csrfToken: string;
  brands: AdminBrandRow[];
}) {
  const [editing, setEditing] = React.useState<AdminBrandRow | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", id);
      const result = await deleteBrandAction(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Removed");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const columns: Column<AdminBrandRow>[] = [
    {
      id: "name",
      header: "Brand",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold">
            {row.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: "managed",
      header: "Record",
      sortValue: (row) => (row.managed ? "managed" : "inferred"),
      cell: (row) => (
        <div className="flex gap-1">
          <Pill tone={row.managed ? "positive" : "neutral"}>
            {row.managed ? "managed" : "inferred"}
          </Pill>
          {row.featured ? <Pill tone="gold">featured</Pill> : null}
        </div>
      ),
    },
    {
      id: "products",
      header: "Products",
      sortValue: (row) => row.productCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-sm tabular-nums">{row.productCount}</span>,
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
            onClick={() => {
              setAdding(false);
              setEditing(row);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          {row.managed ? (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Delete ${row.name}`}
              disabled={pending}
              onClick={() => remove(row.id)}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const open = adding || editing !== null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card
        bodyClassName="p-0"
        title={`${brands.length} brands`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            New brand
          </Button>
        }
      >
        <DataTable
          rows={brands}
          columns={columns}
          getRowId={(row) => row.id || row.slug}
          searchPlaceholder="Search brands…"
          emptyIcon={Tags}
          emptyTitle="No brands"
          emptyDescription="Brands appear here as soon as a product uses one."
        />
      </Card>

      <div>
        {open ? (
          <Card
            title={editing ? `Edit ${editing.name}` : "New brand"}
            actions={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Close"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            }
          >
            <AdminForm
              key={editing?.slug ?? "new"}
              action={saveBrandAction}
              csrfToken={csrfToken}
              hidden={editing?.id ? { id: editing.id } : {}}
              submitLabel={editing ? "Save brand" : "Create brand"}
            >
              <TextInput name="name" label="Brand name" defaultValue={editing?.name} required />
              <TextArea
                name="description"
                label="Description"
                rows={4}
                defaultValue={editing?.description}
              />
              <TextInput name="logoUrl" label="Logo URL" defaultValue={editing?.logoUrl} />
              <TextInput name="bannerUrl" label="Banner URL" defaultValue={editing?.bannerUrl} />
              <CheckboxInput
                name="featured"
                label="Featured brand"
                hint="Promoted in the homepage brand showcase"
                defaultChecked={editing?.featured}
              />
            </AdminForm>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Select a brand to give it a logo, banner and description, or create a new one.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
