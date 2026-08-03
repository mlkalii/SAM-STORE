import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/admin/print-document";
import { requirePermission } from "@/lib/admin/auth";
import { settingsStore } from "@/lib/admin/stores";
import { adminOrders } from "@/lib/admin";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Shipping label", robots: { index: false } };

export default async function ShippingLabelPage(
  props: PageProps<"/admin/orders/[id]/shipping-label">,
) {
  const { id } = await props.params;
  await requirePermission("orders.view", `/admin/orders/${id}`);

  const order = await adminOrders.find(id);
  if (!order) notFound();
  const settings = settingsStore.get();

  const tracking = order.trackingNumber ?? `PENDING-${order.reference}`;

  return (
    <div className="mx-auto max-w-lg bg-background p-8 text-foreground">
      {/* The label's visual header is the wordmark; screen readers still need one. */}
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
            {settings.legalName}
            <br />
            {settings.addressLine}
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

        {/* A real barcode comes from the carrier; this is the human-readable form. */}
        <div className="border-t-2 border-foreground pt-3 text-center">
          <p className="font-mono text-sm tracking-[0.2em]">{tracking}</p>
          <div aria-hidden className="mt-2 flex h-12 items-end justify-center gap-[2px]">
            {tracking.split("").map((char, index) => (
              <span
                key={index}
                className="w-[3px] bg-foreground"
                style={{ height: `${40 + ((char.charCodeAt(0) * 7) % 60)}%` }}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px]">{order.reference}</p>
        </div>
      </div>
    </div>
  );
}
