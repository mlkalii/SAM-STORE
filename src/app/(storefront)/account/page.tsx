import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, ShoppingBag } from "lucide-react";

import { EmptyState, OrderStatus, Panel, StatTile } from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { orderStore } from "@/lib/commerce/orders";
import { notifications } from "@/lib/commerce/notifications";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Account overview", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AccountOverviewPage() {
  const user = await requireUser();

  const orders = orderStore.forUser(user.id);
  const spend = orders.reduce((total, order) => total + order.totals.grandTotal, 0);
  const unread = notifications.unreadCount(user.id) +
    user.notifications.filter((notification) => !notification.read).length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Orders" value={orders.length} hint="Lifetime" />
        <StatTile label="Total spend" value={formatPrice(spend)} hint="Including shipping and tax" />
        <StatTile label="Saved addresses" value={user.addresses.length} />
        <StatTile label="Unread notices" value={unread} />
      </div>

      <Panel
        title="Recent orders"
        description="Your two most recent orders and where they have got to."
        action={
          <Button variant="outline" size="sm" render={<Link href="/account/orders" />}>
            All orders
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        }
      >
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order it will appear here with tracking and an invoice."
            action={
              <Button render={<Link href="/shop" />}>
                <ShoppingBag className="size-4" aria-hidden />
                Start shopping
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {orders.slice(0, 2).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="font-mono text-sm underline-offset-4 hover:underline"
                  >
                    {order.reference}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dateFormat.format(new Date(order.placedAt))} ·{" "}
                    {order.lines.length} item{order.lines.length === 1 ? "" : "s"}
                  </p>
                </div>
                <OrderStatus status={order.status} />
                <span className="font-mono text-sm tabular-nums">
                  {formatPrice(order.totals.grandTotal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
