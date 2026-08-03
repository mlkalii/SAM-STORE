import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Package, Printer, Truck } from "lucide-react";

import { OrderAdminActions } from "@/components/admin/order-admin-actions";
import { Card, Detail, PageHeader, Pill } from "@/components/admin/ui";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { can } from "@/config/admin";
import { requirePermission } from "@/lib/admin/auth";
import { noteStore } from "@/lib/admin/stores";
import { canCancel } from "@/lib/commerce/orders";
import { adminOrders } from "@/lib/admin";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const staff = await requirePermission("orders.view", `/admin/orders/${id}`);
  const csrfToken = await getCsrfToken();

  const order = await adminOrders.find(id);
  if (!order) notFound();

  const notes = noteStore.for("order", id);

  return (
    <>
      <PageHeader
        title={order.reference}
        description={`Placed ${dateFormat.format(new Date(order.placedAt))} by ${order.email}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.reference },
        ]}
        actions={
          <>
            <Button size="sm" variant="outline" render={<Link href={`/admin/orders/${id}/invoice`} target="_blank" />}>
              <FileText className="size-3.5" aria-hidden />
              Invoice
            </Button>
            <Button size="sm" variant="outline" render={<Link href={`/admin/orders/${id}/packing-slip`} target="_blank" />}>
              <Package className="size-3.5" aria-hidden />
              Packing slip
            </Button>
            <Button size="sm" variant="outline" render={<Link href={`/admin/orders/${id}/shipping-label`} target="_blank" />}>
              <Printer className="size-3.5" aria-hidden />
              Label
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card title="Fulfilment">
            <OrderTimeline order={order} />
          </Card>

          <Card title="Items" bodyClassName="p-0">
            <ul className="divide-y">
              {order.lines.map((line) => (
                <li key={`${line.slug}-${line.variantId}`} className="flex gap-3 px-5 py-3">
                  <ProductImage
                    src={line.image}
                    alt={line.name}
                    gradient={line.gradient}
                    category={line.category}
                    sizes="64px"
                    className="size-14 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${line.slug}`} className="block truncate text-sm hover:underline">
                      {line.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {line.brand} · Qty {line.quantity}
                      {line.variantLabel === "Standard" ? "" : ` · ${line.variantLabel}`}
                    </p>
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="border-t px-5 py-4">
              <Detail label="Subtotal">{formatPrice(order.totals.subtotal)}</Detail>
              {order.totals.discountTotal > 0 ? (
                <Detail label="Discounts">−{formatPrice(order.totals.discountTotal)}</Detail>
              ) : null}
              <Detail label="Shipping">
                {order.totals.shippingTotal === 0 ? "Free" : formatPrice(order.totals.shippingTotal)}
              </Detail>
              {order.totals.taxTotal > 0 ? (
                <Detail label="Tax">{formatPrice(order.totals.taxTotal)}</Detail>
              ) : null}
              {order.totals.giftCardTotal > 0 ? (
                <Detail label="Gift card">−{formatPrice(order.totals.giftCardTotal)}</Detail>
              ) : null}
              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatPrice(order.totals.grandTotal)}</span>
              </div>
            </dl>
          </Card>

          <Card title="Notes" description="Customer notes are visible to the shopper; internal notes never leave the panel.">
            <OrderAdminActions
              orderId={order.id}
              csrfToken={csrfToken}
              status={order.status}
              canEdit={can(staff.role, "orders.edit")}
              canRefund={can(staff.role, "orders.refund")}
              canCancel={canCancel(order)}
              maxRefund={order.totals.grandTotal}
              notes={notes}
              customerNote={order.notes}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Customer">
            <dl className="divide-y">
              <Detail label="Email">
                <span className="text-xs">{order.email}</span>
              </Detail>
              <Detail label="Account">
                <Link href={`/admin/customers/${order.userId}`} className="text-xs hover:underline">
                  View profile
                </Link>
              </Detail>
            </dl>
          </Card>

          <Card title="Shipping">
            <dl className="divide-y">
              <Detail label="Method">{order.shippingMethodLabel}</Detail>
              <Detail label="Estimate">
                <span className="text-xs">{order.deliveryEstimate.label}</span>
              </Detail>
              {order.trackingNumber ? (
                <Detail label="Tracking">
                  <span className="font-mono text-xs">{order.trackingNumber}</span>
                </Detail>
              ) : null}
            </dl>

            <address className="mt-4 text-xs not-italic leading-relaxed text-muted-foreground">
              <span className="block font-medium text-foreground">{order.shippingAddress.recipient}</span>
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
          </Card>

          <Card title="Payment">
            <dl className="divide-y">
              <Detail label="Provider">{order.payment.providerLabel}</Detail>
              <Detail label="Status">
                <Pill tone={order.payment.status === "captured" ? "positive" : "warning"}>
                  {order.payment.status}
                </Pill>
              </Detail>
              <Detail label="Reference">
                <span className="font-mono text-[10px]">{order.payment.reference}</span>
              </Detail>
              <Detail label="Amount">{formatPrice(order.payment.amount)}</Detail>
            </dl>
          </Card>

          {order.returnRequest ? (
            <Card title="Return request">
              <dl className="divide-y">
                <Detail label="Status">
                  <Pill tone="warning">{order.returnRequest.status}</Pill>
                </Detail>
                <Detail label="Requested">
                  <span className="text-xs">
                    {dateFormat.format(new Date(order.returnRequest.requestedAt))}
                  </span>
                </Detail>
              </dl>
              <p className="mt-3 rounded-lg border bg-surface p-3 text-xs text-muted-foreground">
                {order.returnRequest.reason}
              </p>
            </Card>
          ) : null}

          <Card title="Delivery estimate">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-3.5" aria-hidden />
              {order.deliveryEstimate.label}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
