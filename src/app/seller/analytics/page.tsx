import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BarChart3, MousePointerClick, Users } from "lucide-react";

import { BarChart, BreakdownBar, LineChart } from "@/components/admin/charts";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { categories } from "@/data/categories";
import { requireSeller } from "@/lib/marketplace/auth";
import { sellerCatalogue, sellerDashboard } from "@/lib/marketplace";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Analytics" };

export default async function SellerAnalyticsPage() {
  const { seller } = await requireSeller("/seller/analytics");

  const [data, catalogue] = await Promise.all([
    sellerDashboard(seller.id),
    sellerCatalogue(seller.id),
  ]);

  const byCategory = new Map<string, number>();
  for (const product of catalogue) {
    byCategory.set(product.category, (byCategory.get(product.category) ?? 0) + 1);
  }

  const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const conversion =
    data.customers > 0 ? Math.round((data.orders.total / data.customers) * 100) / 100 : 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How your store is performing across sales, catalogue and customers."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Analytics" }]}
      />

      <section aria-label="Headline" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales" value={formatPrice(data.revenue.total)} tone="gold" />
        <StatCard label="Net earnings" value={formatPrice(data.revenue.net)} tone="positive" />
        <StatCard
          label="Average order"
          value={formatPrice(
            data.orders.total > 0 ? Math.round(data.revenue.total / data.orders.total) : 0,
          )}
        />
        <StatCard label="Orders per customer" value={conversion || "—"} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Sales" description="Last 30 days">
          <LineChart
            data={data.series.revenue}
            label="Sales over the last 30 days"
            format={(value) => formatPrice(value)}
          />
        </Card>
        <Card title="Orders" description="Last 30 days">
          <BarChart data={data.series.orders} label="Orders over the last 30 days" />
        </Card>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Card title="Order pipeline" description="Where your orders currently sit">
          <BreakdownBar
            segments={[
              { label: "awaiting action", value: data.orders.awaitingAction, className: "bg-amber-500" },
              { label: "in transit", value: data.orders.shipped, className: "bg-sky-500" },
              { label: "delivered", value: data.orders.delivered, className: "bg-emerald-500" },
              { label: "cancelled", value: data.orders.cancelled, className: "bg-rose-500" },
            ]}
          />
        </Card>

        <Card title="Catalogue by department" description="Listing count">
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products listed yet.</p>
          ) : (
            <BreakdownBar
              segments={topCategories.map(([slug, count], index) => ({
                label: categories.find((entry) => entry.slug === slug)?.name ?? slug,
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
          )}
        </Card>
      </div>

      <Card title="Best selling" description="By revenue" className="mt-4" bodyClassName="p-0">
        {data.bestSellers.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No sales recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {data.bestSellers.map((product, index) => (
              <li key={product.slug} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <Link
                  href={`/seller/products/${product.slug}`}
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                >
                  {product.name}
                </Link>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {product.units}×
                </span>
                <span className="w-24 text-right font-mono text-xs tabular-nums">
                  {formatPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/*
        Storefront traffic comes from an analytics provider rather than the
        order store, so these are explicit placeholders. They populate once the
        marketplace connects one.
      */}
      <Card title="Storefront traffic" description="Awaiting an analytics provider" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Store visits", icon: Activity },
            { label: "Unique visitors", icon: Users },
            { label: "Add-to-cart rate", icon: MousePointerClick },
            { label: "Conversion rate", icon: BarChart3 },
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
      </Card>
    </>
  );
}
