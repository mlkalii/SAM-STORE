import type { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";

import { EmptyState, OrderStatus, Panel } from "@/components/account/account-ui";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { orderStore } from "@/lib/commerce/orders";
import type { Order } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order history", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const CLOSED = new Set(["delivered", "cancelled", "refunded", "returned"]);

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = orderStore.forUser(user.id);

  const active = orders.filter((order) => !CLOSED.has(order.status));
  const previous = orders.filter((order) => CLOSED.has(order.status));

  if (orders.length === 0) {
    return (
      <Panel title="Orders">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Once you have ordered, every delivery, invoice and tracking number lives here."
          action={
            <Button render={<Link href="/shop" />}>
              <ShoppingBag className="size-4" aria-hidden />
              Browse the catalogue
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="Active orders"
        description={
          active.length > 0
            ? `${active.length} order${active.length === 1 ? "" : "s"} on the way.`
            : "Nothing in transit right now."
        }
      >
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Everything you have ordered has arrived or been closed.
          </p>
        ) : (
          <OrderList orders={active} />
        )}
      </Panel>

      {previous.length > 0 ? (
        <Panel title="Previous orders" description={`${previous.length} completed or closed.`}>
          <OrderList orders={previous} />
        </Panel>
      ) : null}
    </>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-2xl border p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm">{order.reference}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dateFormat.format(new Date(order.placedAt))}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatus status={order.status} />
              <span className="font-mono text-sm tabular-nums">
                {formatPrice(order.totals.grandTotal)}
              </span>
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {order.lines.slice(0, 6).map((line) => (
              <li key={`${line.slug}-${line.variantId}`}>
                <Link href={`/shop/${line.slug}`} aria-label={line.name}>
                  <ProductImage
                    src={line.image}
                    alt={line.name}
                    gradient={line.gradient}
                    category={line.category}
                    sizes="72px"
                    className="size-16 rounded-lg"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" render={<Link href={`/account/orders/${order.id}`} />}>
              Order details
            </Button>
            {order.trackingNumber ? (
              <span className="font-mono text-xs text-muted-foreground">
                Tracking {order.trackingNumber}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {order.deliveryEstimate.label}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
