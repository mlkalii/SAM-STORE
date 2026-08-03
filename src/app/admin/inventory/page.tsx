import type { Metadata } from "next";

import { InventoryManager } from "@/components/admin/inventory-manager";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminProducts } from "@/lib/admin";
import { purchaseOrderStore, stockStore, warehouseStore, settingsStore } from "@/lib/admin/stores";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  await requirePermission("inventory.view", "/admin/inventory");
  const csrfToken = await getCsrfToken();

  const products = await adminProducts.all();
  const settings = settingsStore.get();
  const threshold = settings.lowStockThreshold;

  const rows = products.map((product) => ({
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    category: product.category,
    onHand: product.stockCount,
    adjustment: stockStore.netFor(product.slug),
    effective: product.effectiveStock,
    price: product.price,
  }));

  const stockValue = rows.reduce((total, row) => total + row.price * Math.max(0, row.effective), 0);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels across warehouses, adjustments, and purchase orders."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Inventory" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock value" value={formatPrice(stockValue)} tone="gold" />
        <StatCard label="SKUs tracked" value={rows.length} />
        <StatCard
          label={`Low stock (≤ ${threshold})`}
          value={rows.filter((row) => row.effective > 0 && row.effective <= threshold).length}
          tone="warning"
        />
        <StatCard
          label="Out of stock"
          value={rows.filter((row) => row.effective <= 0).length}
          tone="danger"
        />
      </div>

      <InventoryManager
        csrfToken={csrfToken}
        rows={rows}
        warehouses={warehouseStore.list()}
        purchaseOrders={purchaseOrderStore.list()}
        movements={stockStore.movements().slice(0, 20)}
        threshold={threshold}
      />
    </>
  );
}
