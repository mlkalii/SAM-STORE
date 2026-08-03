import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BarChart3, MousePointerClick, Users } from "lucide-react";

import { BarChart, BreakdownBar, LineChart } from "@/components/admin/charts";
import { Card, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/admin/auth";
import { adminCustomers, adminDashboard, adminProducts, adminReports } from "@/lib/admin";
import { promotionStore } from "@/lib/commerce/promotions";
import { settingsStore } from "@/lib/admin/stores";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

const RANGES = [
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "all", label: "All time" },
] as const;

export default async function AdminReportsPage(props: PageProps<"/admin/reports">) {
  await requirePermission("reports.view", "/admin/reports");

  const searchParams = await props.searchParams;
  const rangeParam = typeof searchParams.range === "string" ? searchParams.range : "30";
  const range = RANGES.some((entry) => entry.id === rangeParam) ? rangeParam : "30";

  const [sales, dashboard, products, customers, inventoryValue] = await Promise.all([
    adminReports.sales(range === "all" ? {} : { days: Number(range) }),
    adminDashboard(),
    adminProducts.all(),
    adminCustomers.rows(),
    adminReports.inventoryValue(),
  ]);

  const settings = settingsStore.get();
  const promotions = promotionStore.all();
  const redeemed = promotions.reduce((total, promotion) => total + promotion.usageCount, 0);

  const byCategory = new Map<string, number>();
  for (const product of products) {
    byCategory.set(product.category, (byCategory.get(product.category) ?? 0) + 1);
  }
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const spenders = [...customers]
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    .slice(0, 8);

  const lowStock = products.filter(
    (product) => product.effectiveStock > 0 && product.effectiveStock <= settings.lowStockThreshold,
  );
  const outOfStock = products.filter((product) => product.effectiveStock <= 0);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Sales, customers, products, inventory and campaign performance."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
        actions={
          <div className="flex gap-1">
            {RANGES.map((entry) => (
              <Button
                key={entry.id}
                size="sm"
                variant={range === entry.id ? "default" : "outline"}
                className="h-8 px-3 text-xs"
                render={<Link href={`/admin/reports?range=${entry.id}`} />}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Sales */}
      <section aria-label="Sales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross revenue" value={formatPrice(sales.grossRevenue)} tone="gold" />
        <StatCard label="Orders" value={sales.orderCount} />
        <StatCard label="Average order" value={formatPrice(sales.averageOrderValue)} />
        <StatCard label="Discounts given" value={formatPrice(sales.discountGiven)} tone="warning" />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Revenue" description="Last 30 days, regardless of the range above">
          <LineChart
            data={dashboard.series.revenue}
            label="Revenue over the last 30 days"
            format={(value) => formatPrice(value)}
          />
        </Card>
        <Card title="Orders" description="Last 30 days">
          <BarChart data={dashboard.series.orders} label="Orders over the last 30 days" />
        </Card>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <Card title="Collected" description="Where the money sits">
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-mono tabular-nums">{formatPrice(sales.shippingCollected)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="font-mono tabular-nums">{formatPrice(sales.taxCollected)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Discounts</dt>
              <dd className="font-mono tabular-nums">-{formatPrice(sales.discountGiven)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-2.5 font-medium">
              <dt>Gross</dt>
              <dd className="font-mono tabular-nums">{formatPrice(sales.grossRevenue)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Orders by status" className="lg:col-span-2">
          {Object.keys(sales.byStatus).length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders in this range.</p>
          ) : (
            <BreakdownBar
              segments={Object.entries(sales.byStatus).map(([status, count], index) => ({
                label: status.replaceAll("-", " "),
                value: count,
                className: [
                  "bg-amber-500",
                  "bg-sky-500",
                  "bg-indigo-500",
                  "bg-emerald-500",
                  "bg-rose-500",
                  "bg-slate-500",
                ][index % 6],
              }))}
            />
          )}
        </Card>
      </div>

      {/* Products */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Card title="Top products" description="By revenue in this range" bodyClassName="p-0">
          {sales.topProducts.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No sales in this range.</p>
          ) : (
            <ul className="divide-y">
              {sales.topProducts.map((product, index) => (
                <li key={product.slug} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                  <Link
                    href={`/admin/products/${product.slug}`}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {product.name}
                  </Link>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {product.units}×
                  </span>
                  <span className="w-20 text-right font-mono text-xs tabular-nums">
                    {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Catalogue by department" description="Product count">
          <BreakdownBar
            segments={topCategories.map(([slug, count], index) => ({
              label: slug.replace(/-/g, " "),
              value: count,
              className: [
                "bg-amber-500",
                "bg-sky-500",
                "bg-indigo-500",
                "bg-emerald-500",
                "bg-rose-500",
                "bg-violet-500",
              ][index % 6],
            }))}
          />
        </Card>
      </div>

      {/* Customers */}
      <section aria-label="Customers" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={customers.length} icon={Users} />
        <StatCard
          label="With an order"
          value={customers.filter((customer) => customer.orderCount > 0).length}
          tone="positive"
        />
        <StatCard
          label="Lifetime value"
          value={formatPrice(
            customers.reduce((total, customer) => total + customer.lifetimeValue, 0),
          )}
          tone="gold"
        />
        <StatCard label="Coupon redemptions" value={redeemed} />
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Card title="Top customers" description="By lifetime spend" bodyClassName="p-0">
          {spenders.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No customers yet.</p>
          ) : (
            <ul className="divide-y">
              {spenders.map((customer) => (
                <li key={customer.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {customer.name}
                  </Link>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
                  </span>
                  <span className="w-20 text-right font-mono text-xs tabular-nums">
                    {formatPrice(customer.lifetimeValue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Campaign performance" description="Redemptions per promotion" bodyClassName="p-0">
          <ul className="divide-y">
            {[...promotions]
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 8)
              .map((promotion) => (
                <li key={promotion.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm">{promotion.label}</span>
                  <Pill tone={promotion.active ? "positive" : "neutral"}>
                    {promotion.active ? "active" : "paused"}
                  </Pill>
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                    {promotion.usageCount}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>

      {/* Inventory */}
      <section aria-label="Inventory" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock value" value={formatPrice(inventoryValue)} tone="gold" />
        <StatCard label="SKUs" value={products.length} />
        <StatCard label="Low stock" value={lowStock.length} tone="warning" href="/admin/inventory" />
        <StatCard
          label="Out of stock"
          value={outOfStock.length}
          tone="danger"
          href="/admin/inventory"
        />
      </section>

      {/*
        Traffic and conversion come from an analytics provider rather than the
        order store, so these are explicit placeholders — real numbers land here
        once a provider is connected in Settings.
      */}
      <Card
        title="Traffic and conversion"
        description="Awaiting an analytics provider"
        className="mt-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Sessions", icon: Activity },
            { label: "Unique visitors", icon: Users },
            { label: "Conversion rate", icon: MousePointerClick },
            { label: "Bounce rate", icon: BarChart3 },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-dashed p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <metric.icon className="size-3.5" aria-hidden />
                <span className="text-xs">{metric.label}</span>
              </div>
              <p className="mt-2 font-mono text-lg text-muted-foreground">—</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Connect a provider under{" "}
          <Link href="/admin/settings" className="underline underline-offset-4">
            Settings
          </Link>{" "}
          to populate these. The report reads from{" "}
          <code className="font-mono">adminReports</code>, so only that module changes.
        </p>
      </Card>
    </>
  );
}
