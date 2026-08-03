import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/admin/print-document";
import { requirePermission } from "@/lib/admin/auth";
import { adminOrders } from "@/lib/admin";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Packing slip", robots: { index: false } };

export default async function PackingSlipPage(
  props: PageProps<"/admin/orders/[id]/packing-slip">,
) {
  const { id } = await props.params;
  await requirePermission("orders.view", `/admin/orders/${id}`);

  const order = await adminOrders.find(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-background p-8 text-sm text-foreground">
      <div className="mb-8 flex items-start justify-between print:hidden">
        <p className="text-xs text-muted-foreground">
          Packing slips deliberately omit prices — they travel inside the parcel.
        </p>
        <PrintButton label="Print packing slip" />
      </div>

      <header className="flex items-start justify-between border-b pb-6">
        <p className="flex items-center gap-2.5 text-lg font-semibold tracking-[0.2em]"><LogoMark className="size-7" />SAMRUX</p>
        <div className="text-right">
          <h1 className="text-2xl font-semibold">Packing slip</h1>
          <p className="mt-1 font-mono text-xs">{order.reference}</p>
        </div>
      </header>

      <section className="border-b py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Ship to
        </p>
        <address className="mt-2 not-italic leading-relaxed">
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
      </section>

      <table className="w-full py-6 text-left">
        <thead>
          <tr className="border-b text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th scope="col" className="py-2 font-semibold">Item</th>
            <th scope="col" className="py-2 font-semibold">SKU</th>
            <th scope="col" className="py-2 text-right font-semibold">Qty</th>
            <th scope="col" className="w-16 py-2 text-right font-semibold">Picked</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={`${line.slug}-${line.variantId}`} className="border-b">
              <td className="py-3">
                {line.name}
                <span className="block text-xs text-muted-foreground">{line.variantLabel}</span>
              </td>
              <td className="py-3 font-mono text-xs">{line.slug}</td>
              <td className="py-3 text-right text-base font-semibold tabular-nums">
                {line.quantity}
              </td>
              <td className="py-3 text-right">
                <span aria-hidden className="inline-block size-5 border" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.notes ? (
        <section className="mt-4 border p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Customer note
          </p>
          <p className="mt-1.5 text-xs">{order.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
