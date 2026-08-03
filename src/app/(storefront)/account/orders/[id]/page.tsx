import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { OrderStatus, Panel } from "@/components/account/account-ui";
import { OrderActions } from "@/components/orders/order-actions";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { canCancel, canReturn, orderStore, reorderItems } from "@/lib/commerce/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function OrderDetailPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();
  const csrfToken = await getCsrfToken();

  const order = orderStore.find(id);
  if (!order || order.userId !== user.id) notFound();

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/account/orders" />}>
        <ArrowLeft className="size-4" aria-hidden />
        All orders
      </Button>

      <Panel
        title={order.reference}
        description={`Placed ${dateFormat.format(new Date(order.placedAt))} · ${order.shippingMethodLabel}`}
        action={<OrderStatus status={order.status} />}
      >
        <OrderTimeline order={order} />
      </Panel>

      <Panel title="Items">
        <ul className="divide-y">
          {order.lines.map((line) => (
            <li key={`${line.slug}-${line.variantId}`} className="flex gap-4 py-4 first:pt-0">
              <Link href={`/shop/${line.slug}`} className="shrink-0">
                <ProductImage
                  src={line.image}
                  alt={line.name}
                  gradient={line.gradient}
                  category={line.category}
                  sizes="96px"
                  className="size-20 rounded-xl"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {line.brand}
                </p>
                <Link href={`/shop/${line.slug}`} className="mt-1 block text-sm font-medium">
                  {line.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {line.variantLabel === "Standard" ? "" : `${line.variantLabel} · `}
                  Quantity {line.quantity}
                </p>
              </div>
              <span className="font-mono text-sm tabular-nums">
                {formatPrice(line.unitPrice * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <OrderSummaryCard totals={order.totals} />

      <Panel title="What you can do next">
        <OrderActions
          order={order}
          csrfToken={csrfToken}
          canCancel={canCancel(order)}
          canReturn={canReturn(order)}
          canRefund={order.status === "returned" || order.returnRequest?.status === "received"}
          reorderItems={reorderItems(order)}
        />
      </Panel>

      <Panel title="Delivery and billing">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Shipping to
            </h3>
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
              <span className="block font-medium text-foreground">
                {order.shippingAddress.recipient}
              </span>
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.line2 ? (
                <>
                  {order.shippingAddress.line2}
                  <br />
                </>
              ) : null}
              {order.shippingAddress.city}, {order.shippingAddress.postcode}
              <br />
              {order.shippingAddress.country}
            </address>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Payment
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <span className="block font-medium text-foreground">
                {order.payment.providerLabel}
              </span>
              Reference <span className="font-mono">{order.payment.reference}</span>
              <br />
              Status <span className="capitalize">{order.payment.status}</span>
            </p>
          </div>
        </div>

        {order.notes ? (
          <p className="mt-6 rounded-xl border bg-surface p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Your note: </span>
            {order.notes}
          </p>
        ) : null}

        <p className="mt-6 text-sm text-muted-foreground">
          Something wrong? Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="underline underline-offset-4">
            {siteConfig.supportEmail}
          </a>{" "}
          quoting {order.reference}.
        </p>
      </Panel>
    </>
  );
}
