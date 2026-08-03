"use client";

import { Boxes, Warehouse } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  adjustStockAction,
  createPurchaseOrderAction,
  saveWarehouseAction,
  setPurchaseOrderStatusAction,
} from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  SelectInput,
  TextInput,
} from "@/components/admin/form-shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import { formatPrice } from "@/lib/format";

interface InventoryRow {
  slug: string;
  name: string;
  sku: string;
  category: string;
  onHand: number;
  adjustment: number;
  effective: number;
  price: number;
}

interface WarehouseRow {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  active: boolean;
}

interface PurchaseOrderRow {
  id: string;
  reference: string;
  supplier: string;
  status: string;
  createdAt: string;
  expectedAt?: string;
  lines: { slug: string; name: string; quantity: number; unitCost: number }[];
}

interface MovementRow {
  id: string;
  slug: string;
  delta: number;
  reason: string;
  note?: string;
  at: string;
  by?: string;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const TABS = ["stock", "warehouses", "purchase-orders", "history"] as const;

export function InventoryManager({
  csrfToken,
  rows,
  warehouses,
  purchaseOrders,
  movements,
  threshold,
}: {
  csrfToken: string;
  rows: InventoryRow[];
  warehouses: WarehouseRow[];
  purchaseOrders: PurchaseOrderRow[];
  movements: MovementRow[];
  threshold: number;
}) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("stock");
  const [adjusting, setAdjusting] = React.useState<InventoryRow | null>(null);
  const [editingWarehouse, setEditingWarehouse] = React.useState<WarehouseRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  function setPoStatus(id: string, status: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", id);
      form.set("status", status);
      const result = await setPurchaseOrderStatusAction(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Updated");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const stockColumns: Column<InventoryRow>[] = [
    {
      id: "name",
      header: "Product",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <Link href={`/admin/products/${row.slug}`} className="block truncate text-sm hover:underline">
            {row.name}
          </Link>
          <p className="truncate font-mono text-xs text-muted-foreground">{row.sku}</p>
        </div>
      ),
    },
    {
      id: "onHand",
      header: "Catalogue",
      sortValue: (row) => row.onHand,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="text-xs tabular-nums text-muted-foreground">{row.onHand}</span>,
    },
    {
      id: "adjustment",
      header: "Adjustments",
      sortValue: (row) => row.adjustment,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span
          className={
            row.adjustment > 0
              ? "text-xs tabular-nums text-emerald-600 dark:text-emerald-400"
              : row.adjustment < 0
                ? "text-xs tabular-nums text-destructive"
                : "text-xs tabular-nums text-muted-foreground"
          }
        >
          {row.adjustment > 0 ? "+" : ""}
          {row.adjustment || "—"}
        </span>
      ),
    },
    {
      id: "effective",
      header: "Available",
      sortValue: (row) => row.effective,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="flex items-center justify-end gap-2">
          <span className="font-mono text-sm tabular-nums">{row.effective}</span>
          {row.effective <= 0 ? (
            <Pill tone="danger">out</Pill>
          ) : row.effective <= threshold ? (
            <Pill tone="warning">low</Pill>
          ) : null}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdjusting(row)}>
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {TABS.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={tab === entry ? "default" : "ghost"}
            className="h-8 px-3 text-xs capitalize"
            onClick={() => setTab(entry)}
          >
            {entry.replaceAll("-", " ")}
          </Button>
        ))}
      </div>

      {tab === "stock" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card bodyClassName="p-0">
            <DataTable
              rows={rows}
              columns={stockColumns}
              getRowId={(row) => row.slug}
              searchPlaceholder="Search by product or SKU…"
              emptyIcon={Boxes}
              emptyTitle="No stock records"
              emptyDescription="Products appear here as soon as the catalogue loads."
              initialSort={{ columnId: "effective", direction: "asc" }}
            />
          </Card>

          <Card title={adjusting ? `Adjust ${adjusting.name}` : "Adjust stock"}>
            {adjusting ? (
              <AdminForm
                key={adjusting.slug}
                action={adjustStockAction}
                csrfToken={csrfToken}
                hidden={{ slug: adjusting.slug }}
                submitLabel="Apply adjustment"
              >
                <TextInput
                  name="delta"
                  label="Change"
                  type="number"
                  placeholder="-3 or 25"
                  hint={`Currently ${adjusting.effective} available`}
                  required
                />
                <SelectInput
                  name="warehouseId"
                  label="Warehouse"
                  options={warehouses.map((warehouse) => ({
                    value: warehouse.id,
                    label: `${warehouse.name} (${warehouse.code})`,
                  }))}
                />
                <SelectInput
                  name="reason"
                  label="Reason"
                  options={[
                    { value: "adjustment", label: "Manual adjustment" },
                    { value: "recount", label: "Stock recount" },
                    { value: "damage", label: "Damage or loss" },
                    { value: "return", label: "Customer return" },
                  ]}
                />
                <TextInput name="note" label="Note" placeholder="Cycle count, aisle 4" />
              </AdminForm>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a product from the table to record an adjustment. Every change is logged
                with who made it.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "warehouses" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card title="Warehouses" bodyClassName="p-0">
            <ul className="divide-y">
              {warehouses.map((warehouse) => (
                <li key={warehouse.id} className="flex items-center gap-3 px-5 py-3">
                  <Warehouse className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {warehouse.name}{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        {warehouse.code}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {warehouse.city}, {warehouse.country}
                    </p>
                  </div>
                  <Pill tone={warehouse.active ? "positive" : "neutral"}>
                    {warehouse.active ? "active" : "inactive"}
                  </Pill>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setEditingWarehouse(warehouse)}
                  >
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={editingWarehouse ? `Edit ${editingWarehouse.name}` : "Add a warehouse"}>
            <AdminForm
              key={editingWarehouse?.id ?? "new-warehouse"}
              action={saveWarehouseAction}
              csrfToken={csrfToken}
              hidden={editingWarehouse ? { id: editingWarehouse.id } : {}}
              submitLabel={editingWarehouse ? "Save warehouse" : "Add warehouse"}
            >
              <FormGrid>
                <TextInput name="name" label="Name" defaultValue={editingWarehouse?.name} required />
                <TextInput
                  name="code"
                  label="Code"
                  placeholder="LDN-2"
                  defaultValue={editingWarehouse?.code}
                  required
                />
              </FormGrid>
              <FormGrid>
                <TextInput name="city" label="City" defaultValue={editingWarehouse?.city} />
                <TextInput name="country" label="Country" defaultValue={editingWarehouse?.country} />
              </FormGrid>
              <CheckboxInput
                name="active"
                label="Active"
                hint="Inactive warehouses stay in reports but take no new stock"
                defaultChecked={editingWarehouse ? editingWarehouse.active : true}
              />
            </AdminForm>

            {editingWarehouse ? (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs"
                onClick={() => setEditingWarehouse(null)}
              >
                Cancel edit
              </Button>
            ) : null}
          </Card>
        </div>
      ) : null}

      {tab === "purchase-orders" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card title="Purchase orders" bodyClassName="p-0">
            {purchaseOrders.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No purchase orders raised. Use the form to order stock from a supplier.
              </p>
            ) : (
              <ul className="divide-y">
                {purchaseOrders.map((order) => (
                  <li key={order.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs">{order.reference}</span>
                      <span className="text-sm">{order.supplier}</span>
                      <Pill
                        tone={
                          order.status === "received"
                            ? "positive"
                            : order.status === "cancelled"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {order.status}
                      </Pill>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {dateFormat.format(new Date(order.createdAt))}
                      </span>
                    </div>

                    <ul className="mt-2 space-y-1">
                      {order.lines.map((line) => (
                        <li key={line.slug} className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex-1 truncate">{line.name}</span>
                          <span className="tabular-nums">×{line.quantity}</span>
                          <span className="font-mono tabular-nums">{formatPrice(line.unitCost)}</span>
                        </li>
                      ))}
                    </ul>

                    {order.status === "ordered" ? (
                      <div className="mt-2.5 flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={pending}
                          onClick={() => setPoStatus(order.id, "received")}
                        >
                          Mark received
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={pending}
                          onClick={() => setPoStatus(order.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Raise a purchase order">
            <AdminForm
              action={createPurchaseOrderAction}
              csrfToken={csrfToken}
              submitLabel="Raise order"
            >
              <TextInput name="supplier" label="Supplier" placeholder="Nordvane Trading" required />
              <SelectInput
                name="slug"
                label="Product"
                options={rows.slice(0, 60).map((row) => ({ value: row.slug, label: row.name }))}
              />
              <FormGrid>
                <TextInput name="quantity" label="Quantity" type="number" defaultValue="50" />
                <TextInput name="unitCost" label="Unit cost" inputMode="decimal" placeholder="12.50" />
              </FormGrid>
              <SelectInput
                name="warehouseId"
                label="Deliver to"
                options={warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                }))}
              />
              <TextInput name="expectedAt" label="Expected" type="date" />
            </AdminForm>
          </Card>
        </div>
      ) : null}

      {tab === "history" ? (
        <Card title="Stock history" description="Most recent movements across every product" bodyClassName="p-0">
          {movements.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No movements recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {movements.map((movement) => (
                <li key={movement.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span
                    className={
                      movement.delta > 0
                        ? "w-12 font-mono tabular-nums text-emerald-600 dark:text-emerald-400"
                        : "w-12 font-mono tabular-nums text-destructive"
                    }
                  >
                    {movement.delta > 0 ? "+" : ""}
                    {movement.delta}
                  </span>
                  <Link href={`/admin/products/${movement.slug}`} className="min-w-0 flex-1 truncate text-xs hover:underline">
                    {movement.slug}
                  </Link>
                  <Pill tone="neutral">{movement.reason.replaceAll("-", " ")}</Pill>
                  <span className="text-xs text-muted-foreground">
                    {dateFormat.format(new Date(movement.at))}
                    {movement.by ? ` · ${movement.by}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
