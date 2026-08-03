import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Printer } from "lucide-react";

import { SellerOrderActions } from "@/components/seller/seller-order-actions";
import { Card, Detail, PageHeader, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatStoreDateTime } from "@/config/store";
import { returnPolicy } from "@/config/returns";
import { adminOrders } from "@/lib/admin";
import { requireSeller } from "@/lib/marketplace/auth";
import { commissionFor } from "@/lib/marketplace/commission";
import { linesForSeller } from "@/lib/marketplace/settlement";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_TONE } from "@/lib/status-tones";

export const metadata: Metadata = { title: "Order" };


export default async function SellerOrderPage(props: PageProps<"/seller/orders/[id]">) {
  const { id } = await props.params;
  const { seller } = await requireSeller(`/seller/orders/${id}`);
  const csrfToken = await getCsrfToken();

  const order = await adminOrders.find(id);
  if (!order) notFound();

  const lines = linesForSeller(order, seller.id);
  // A seller may only open an order they have a line in.
  if (lines.length === 0) notFound();

  const breakdown = commissionFor(seller.id, lines);

  return (
    <>
      <PageHeader
        title={order.reference}
        description={`Placed ${formatStoreDateTime(order.placedAt)}`}
        breadcrumbs={[
          { label: "Seller", href: "/seller" },
          { label: "Orders", href: "/seller/orders" },
          { label: order.reference },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/seller/orders/${order.id}/invoice`} target="_blank" />}
            >
              <FileText className="size-3.5" aria-hidden />
              Invoice
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/seller/orders/${order.id}/shipping-label`} target="_blank" />}
            >
              <Printer className="size-3.5" aria-hidden />
              Shipping label
            </Button>
          </div>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Card title="Your items" description="Only lines you fulfil" bodyClassName="p-0">
            <ul className="divide-y">
              {lines.map((line) => (
                <li key={`${line.slug}-${line.variantId}`} className="flex gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/seller/products/${line.slug}`}
                      className="block truncate text-sm hover:underline"
                    >
                      {line.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {line.variantLabel} · ×{line.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {formatPrice(line.lineSubtotal - line.lineDiscount)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Timeline" bodyClassName="p-0">
            <ol className="divide-y">
              {order.timeline.map((moment) => (
                <li key={moment.id} className="flex gap-3 px-5 py-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{moment.label}</p>
                    {moment.detail ? (
                      <p className="text-xs text-muted-foreground">{moment.detail}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatStoreDateTime(moment.at)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          {order.returnRequest ? (
            <Card title="Return requested">
              <Detail label="Reason">{order.returnRequest.reason}</Detail>
              <Detail label="Status">{order.returnRequest.status}</Detail>
              <Detail label="Requested">
                {formatStoreDateTime(order.returnRequest.requestedAt)}
              </Detail>
              <p className="mt-3 text-xs text-muted-foreground">
                Approved refunds reach the customer within {returnPolicy.refundBusinessDaysMin}–
                {returnPolicy.refundBusinessDaysMax} business days. Marketplace support processes
                the refund; your commission is reversed automatically.
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card title="Status">
            <Pill tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>
              {order.status.replaceAll("-", " ")}
            </Pill>
            <div className="mt-4">
              <SellerOrderActions
                csrfToken={csrfToken}
                orderId={order.id}
                status={order.status}
                trackingNumber={order.trackingNumber}
              />
            </div>
          </Card>

          <Card title="Your earnings">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Gross</dt>
                <dd className="font-mono tabular-nums">{formatPrice(breakdown.gross)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Commission</dt>
                <dd className="font-mono tabular-nums">-{formatPrice(breakdown.commission)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2 font-medium">
                <dt>Net</dt>
                <dd className="font-mono tabular-nums">{formatPrice(breakdown.net)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">{breakdown.ruleLabel}</p>
          </Card>

          <Card title="Ship to">
            <address className="text-sm not-italic leading-relaxed">
              {order.shippingAddress.recipient}
              <br />
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
            <p className="mt-3 text-xs text-muted-foreground">{order.shippingMethodLabel}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
