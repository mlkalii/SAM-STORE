import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  PackageX,
  ShoppingCart,
  TrendingUp,
  Undo2,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { BreakdownBar, BarChart, LineChart } from "@/components/admin/charts";
import { Card, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/admin/auth";
import { adminDashboard } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_TONE } from "@/lib/status-tones";

export const metadata: Metadata = { title: "Dashboard" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});


export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const staff = await requirePermission("dashboard.view");
  const searchParams = await props.searchParams;
  const denied = typeof searchParams.denied === "string" ? searchParams.denied : null;

  const data = await adminDashboard();

  return (
    <>
      <PageHeader
        title={`Good to see you, ${staff.name.split(" ")[0]}`}
        description="Everything that happened across the store, and everything waiting on someone."
        actions={
          <Button size="sm" variant="outline" render={<Link href="/admin/reports" />}>
            Full reports
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        }
      />

      {denied ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-800 dark:text-amber-300">
          Your role does not include <code className="font-mono">{denied}</code>. Ask a super admin
          if you need it.
        </div>
      ) : null}

      {/* Revenue */}
      <section aria-label="Revenue" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatPrice(data.revenue.total)}
          delta={data.revenue.growth}
          hint="vs previous 30 days"
          icon={Wallet}
          tone="gold"
        />
        <StatCard label="Today" value={formatPrice(data.revenue.today)} icon={TrendingUp} tone="positive" />
        <StatCard label="This month" value={formatPrice(data.revenue.month)} icon={CreditCard} tone="info" />
        <StatCard
          label="Average order"
          value={formatPrice(
            data.orders.total > 0 ? Math.round(data.revenue.total / data.orders.total) : 0,
          )}
          icon={ShoppingCart}
        />
      </section>

      {/* Graphs */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Revenue" description="Last 30 days">
          <LineChart
            data={data.series.revenue}
            label="Revenue over the last 30 days"
            format={(value) => formatPrice(value)}
          />
        </Card>

        <Card title="Orders" description="Last 30 days">
          <BarChart data={data.series.orders} label="Orders placed over the last 30 days" />
        </Card>
      </div>

      {/* Orders */}
      <section aria-label="Orders" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total orders"
          value={data.orders.total}
          delta={data.orders.growth}
          hint="vs previous 30 days"
          icon={ShoppingCart}
          href="/admin/orders"
        />
        <StatCard
          label="Awaiting payment"
          value={data.orders.pending}
          icon={Clock}
          tone="warning"
          href="/admin/orders?status=processing"
        />
        <StatCard
          label="Completed"
          value={data.orders.completed}
          icon={CheckCircle2}
          tone="positive"
          href="/admin/orders?status=delivered"
        />
        <StatCard
          label="Refunds & returns"
          value={data.orders.refundRequests}
          icon={Undo2}
          tone={data.orders.refundRequests > 0 ? "danger" : "neutral"}
          href="/admin/orders"
        />
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <Card title="Order pipeline" description="Where everything currently sits" className="lg:col-span-1">
          <BreakdownBar
            segments={[
              { label: "processing", value: data.orders.processing, className: "bg-amber-500" },
              { label: "packed", value: data.orders.packed, className: "bg-sky-500" },
              { label: "shipped", value: data.orders.shipped, className: "bg-indigo-500" },
              { label: "delivered", value: data.orders.completed, className: "bg-emerald-500" },
              { label: "cancelled", value: data.orders.cancelled, className: "bg-rose-500" },
            ]}
          />
        </Card>

        <Card
          title="Recent orders"
          description="Newest first"
          className="lg:col-span-2"
          bodyClassName="p-0"
          actions={
            <Button size="sm" variant="ghost" render={<Link href="/admin/orders" />}>
              View all
            </Button>
          }
        >
          {data.recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-5 py-2.5 font-medium">Reference</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Placed</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {order.reference}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {dateFormat.format(new Date(order.placedAt))}
                      </td>
                      <td className="px-3 py-2.5">
                        <Pill tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>
                          {order.status.replaceAll("-", " ")}
                        </Pill>
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs tabular-nums">
                        {formatPrice(order.totals.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Customers and catalogue */}
      <section aria-label="Customers and catalogue" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total customers"
          value={data.customers.total}
          delta={data.customers.growth}
          hint="active vs previous 30 days"
          icon={Users}
          href="/admin/customers"
        />
        <StatCard label="Active (30d)" value={data.customers.active} icon={UserPlus} tone="positive" />
        <StatCard
          label="Products"
          value={data.products.total}
          hint={`${data.products.drafts} drafts`}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          label="Stock alerts"
          value={data.products.lowStock + data.products.outOfStock}
          hint={`${data.products.outOfStock} out of stock`}
          icon={data.products.outOfStock > 0 ? PackageX : AlertTriangle}
          tone={data.products.outOfStock > 0 ? "danger" : "warning"}
          href="/admin/inventory"
        />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Best selling" description="By units sold" bodyClassName="p-0">
          {data.bestSellers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {data.bestSellers.map((product, index) => (
                <li key={product.slug} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                  <Link
                    href={`/admin/products/${product.slug}`}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {product.name}
                  </Link>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {product.units} sold
                  </span>
                  <span className="w-20 text-right font-mono text-xs tabular-nums">
                    {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Trending" description="Review momentum since release" bodyClassName="p-0">
          {data.trending.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nothing trending right now.</p>
          ) : (
            <ul className="divide-y">
              {data.trending.map((product) => (
                <li key={product.slug} className="flex items-center gap-3 px-5 py-3">
                  <Link
                    href={`/admin/products/${product.slug}`}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {product.name}
                  </Link>
                  <Pill tone="gold">{product.rating.toFixed(1)}★</Pill>
                  <span className="w-16 text-right text-xs text-muted-foreground tabular-nums">
                    {product.reviewCount.toLocaleString("en-US")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {data.orders.cancelled > 0 ? (
        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Ban className="size-3.5" aria-hidden />
          {data.orders.cancelled} cancelled order{data.orders.cancelled === 1 ? "" : "s"} excluded
          from revenue figures.
        </p>
      ) : null}
    </>
  );
}
