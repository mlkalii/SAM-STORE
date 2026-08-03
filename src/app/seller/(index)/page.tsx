import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Package,
  Star,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { BarChart, LineChart } from "@/components/admin/charts";
import { Card, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatStoreDateTime } from "@/config/store";
import { requireSeller } from "@/lib/marketplace/auth";
import { sellerDashboard } from "@/lib/marketplace";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_TONE } from "@/lib/status-tones";

export const metadata: Metadata = { title: "Dashboard" };


export default async function SellerDashboardPage() {
  const { seller } = await requireSeller();
  const data = await sellerDashboard(seller.id);

  return (
    <>
      <PageHeader
        title={`${seller.storeName}`}
        description="Everything happening in your store, and everything waiting on you."
        actions={
          <Button size="sm" variant="outline" render={<Link href="/seller/analytics" />}>
            Full analytics
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        }
      />

      {/* Revenue */}
      <section aria-label="Revenue" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross sales"
          value={formatPrice(data.revenue.total)}
          hint="Before commission"
          icon={TrendingUp}
          tone="gold"
        />
        <StatCard
          label="Your earnings"
          value={formatPrice(data.revenue.net)}
          hint={`${formatPrice(data.revenue.commission)} commission`}
          icon={Wallet}
          tone="positive"
        />
        <StatCard label="This month" value={formatPrice(data.revenue.month)} icon={TrendingUp} />
        <StatCard
          label="Available to withdraw"
          value={formatPrice(data.balance.available)}
          hint={data.balance.pending > 0 ? `${formatPrice(data.balance.pending)} pending` : undefined}
          icon={Wallet}
          href="/seller/payouts"
        />
      </section>

      {/* Graphs */}
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

      {/* Orders */}
      <section aria-label="Orders" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting action"
          value={data.orders.awaitingAction}
          icon={Clock}
          tone={data.orders.awaitingAction > 0 ? "warning" : "neutral"}
          href="/seller/orders?status=processing"
        />
        <StatCard label="In transit" value={data.orders.shipped} icon={Truck} tone="info" href="/seller/orders" />
        <StatCard
          label="Delivered"
          value={data.orders.delivered}
          icon={CheckCircle2}
          tone="positive"
          href="/seller/orders?status=delivered"
        />
        <StatCard
          label="Returns & refunds"
          value={data.orders.returns}
          icon={AlertTriangle}
          tone={data.orders.returns > 0 ? "danger" : "neutral"}
          href="/seller/orders"
        />
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <Card title="Store health" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Star className="size-3.5" aria-hidden />
                Rating
              </dt>
              <dd className="font-mono text-xs">
                {data.reviews.average > 0 ? `${data.reviews.average.toFixed(1)} ★` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-3.5" aria-hidden />
                Followers
              </dt>
              <dd className="font-mono text-xs">{data.followers.toLocaleString("en-US")}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="size-3.5" aria-hidden />
                Unread messages
              </dt>
              <dd className="font-mono text-xs">{data.unreadMessages}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Package className="size-3.5" aria-hidden />
                Live products
              </dt>
              <dd className="font-mono text-xs">
                {data.products.published} / {data.products.total}
              </dd>
            </div>
          </dl>

          {data.products.outOfStock > 0 || data.products.lowStock > 0 ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 p-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {data.products.outOfStock} out of stock, {data.products.lowStock} running low.{" "}
                <Link href="/seller/inventory" className="underline underline-offset-4">
                  Restock
                </Link>
              </span>
            </p>
          ) : null}
        </Card>

        <Card
          title="Recent orders"
          description="Newest first"
          className="lg:col-span-2"
          bodyClassName="p-0"
          actions={
            <Button size="sm" variant="ghost" render={<Link href="/seller/orders" />}>
              View all
            </Button>
          }
        >
          {data.recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No orders yet. They appear here the moment a customer buys.
            </p>
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
                          href={`/seller/orders/${order.id}`}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {order.reference}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {formatStoreDateTime(order.placedAt)}
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

      {/* Catalogue */}
      <section aria-label="Catalogue" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={data.products.total} icon={Package} href="/seller/products" />
        <StatCard label="Drafts" value={data.products.drafts} icon={Package} tone="neutral" />
        <StatCard label="Customers" value={data.customers} icon={Users} href="/seller/customers" />
        <StatCard
          label="Reviews"
          value={data.reviews.total}
          hint={data.reviews.pending > 0 ? `${data.reviews.pending} in moderation` : undefined}
          icon={Star}
          href="/seller/reviews"
        />
      </section>

      <Card title="Best selling" description="By revenue" className="mt-4" bodyClassName="p-0">
        {data.bestSellers.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No sales recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {data.bestSellers.map((product, index) => (
              <li key={product.slug} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <Link
                  href={`/seller/products/${product.slug}`}
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                >
                  {product.name}
                </Link>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {product.units} sold
                </span>
                <span className="w-24 text-right font-mono text-xs tabular-nums">
                  {formatPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
