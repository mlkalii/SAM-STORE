import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/admin/print-document";
import { storeConfig } from "@/config/store";
import { adminOrders } from "@/lib/admin";
import { requireSeller } from "@/lib/marketplace/auth";
import { linesForSeller } from "@/lib/marketplace/settlement";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Shipping label", robots: { index: false } };

export default async function SellerShippingLabelPage(
  props: PageProps<"/seller/orders/[id]/shipping-label">,
) {
  const { id } = await props.params;
  const { seller } = await requireSeller(`/seller/orders/${id}`);

  const order = await adminOrders.find(id);
  if (!order) notFound();

  const lines = linesForSeller(order, seller.id);
  if (lines.length === 0) notFound();

  const tracking = order.trackingNumber ?? `PENDING-${order.reference}`;

  return (
    <div className="mx-auto max-w-lg bg-background p-8 text-foreground">
      <h1 className="sr-only">Shipping label for {order.reference}</h1>

      <div className="mb-6 flex items-start justify-between print:hidden">
        <p className="text-xs text-muted-foreground">
          A carrier integration replaces this with the carrier&rsquo;s own label PDF; the layout and
          data are the same.
        </p>
        <PrintButton label="Print label" />
      </div>

      <div className="border-2 border-foreground p-5">
        <div className="flex items-start justify-between border-b-2 border-foreground pb-3">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em]"><LogoMark className="size-6" />SAMRUX</p>
          <p className="text-right text-xs uppercase">{order.shippingMethodLabel}</p>
        </div>

        <div className="border-b border-dashed py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            From
          </p>
          <p className="text-xs leading-relaxed">
            {seller.storeName}
            <br />
            {seller.business.addressLine1}
            {seller.business.addressLine2 ? `, ${seller.business.addressLine2}` : ""}
            <br />
            {seller.business.city}, {seller.business.state} {seller.business.postcode}
          </p>
        </div>

        <div className="py-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Deliver to
          </p>
          <address className="mt-1 text-lg font-semibold not-italic leading-snug">
            {order.shippingAddress.recipient}
            <br />
            <span className="text-base font-normal">
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
            </span>
          </address>
        </div>

        <div className="border-t-2 border-foreground pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tracking
          </p>
          <p className="font-mono text-sm">{tracking}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {order.reference} · {lines.reduce((total, line) => total + line.quantity, 0)} item
            {lines.reduce((total, line) => total + line.quantity, 0) === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground print:hidden">
        Returns to {seller.storeName}, handled under the SAMRUX {seller.returnWindowDays}-day
        return policy. Marketplace support: {storeConfig.supportEmail}
      </p>
    </div>
  );
}
