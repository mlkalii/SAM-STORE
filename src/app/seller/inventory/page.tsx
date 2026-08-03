import type { Metadata } from "next";

import { SellerInventoryManager } from "@/components/seller/seller-inventory-manager";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { settingsStore } from "@/lib/admin/stores";
import { requireSeller } from "@/lib/marketplace/auth";
import { sellerCatalogue } from "@/lib/marketplace";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Inventory" };

export default async function SellerInventoryPage() {
  const { seller } = await requireSeller("/seller/inventory");
  const csrfToken = await getCsrfToken();

  const catalogue = await sellerCatalogue(seller.id);
  const threshold = settingsStore.get().lowStockThreshold;

  const rows = catalogue.map((product) => ({
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    category: product.category,
    stockCount: product.stockCount,
    price: product.price,
    status: product.meta.status,
  }));

  const stockValue = rows.reduce(
    (total, row) => total + row.price * Math.max(0, row.stockCount),
    0,
  );

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels across your listings. Set a count and it is live immediately."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Inventory" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock value" value={formatPrice(stockValue)} tone="gold" />
        <StatCard label="SKUs" value={rows.length} />
        <StatCard
          label={`Low stock (≤ ${threshold})`}
          value={rows.filter((row) => row.stockCount > 0 && row.stockCount <= threshold).length}
          tone="warning"
        />
        <StatCard
          label="Out of stock"
          value={rows.filter((row) => row.stockCount <= 0).length}
          tone="danger"
        />
      </div>

      <Card bodyClassName="p-0">
        <SellerInventoryManager csrfToken={csrfToken} rows={rows} threshold={threshold} />
      </Card>
    </>
  );
}
