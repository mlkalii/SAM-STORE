import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/admin/print-document";
import { requirePermission } from "@/lib/admin/auth";
import { settingsStore } from "@/lib/admin/stores";
import { adminOrders } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function InvoicePage(props: PageProps<"/admin/orders/[id]/invoice">) {
  const { id } = await props.params;
  await requirePermission("orders.view", `/admin/orders/${id}`);

  const order = await adminOrders.find(id);
  if (!order) notFound();
  const settings = settingsStore.get();

  return (
    <div className="mx-auto max-w-3xl bg-background p-8 text-sm text-foreground">
      <div className="mb-8 flex items-start justify-between print:hidden">
        <p className="text-xs text-muted-foreground">Preview — use Print to produce a PDF.</p>
        <PrintButton label="Print invoice" />
      </div>

      <header className="flex items-start justify-between border-b pb-6">
        <div>
          <p className="flex items-center gap-2.5 text-lg font-semibold tracking-[0.2em]"><LogoMark className="size-7" />SAMRUX</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {settings.legalName}
            <br />
            {settings.addressLine}
            <br />
            {settings.supportEmail}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-semibold">Invoice</h1>
          <p className="mt-1 font-mono text-xs">{order.reference}</p>
          <p className="text-xs text-muted-foreground">
            {dateFormat.format(new Date(order.placedAt))}
          </p>
        </div>
      </header>

      <section className="grid gap-8 border-b py-6 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Billed to
          </p>
          <address className="mt-2 not-italic leading-relaxed">
            {order.billingAddress.recipient}
            <br />
            {order.billingAddress.line1}
            <br />
            {order.billingAddress.line2 ? (
              <>
                {order.billingAddress.line2}
                <br />
              </>
            ) : null}
            {order.billingAddress.city}, {order.billingAddress.postcode}
            <br />
            {order.billingAddress.country}
            <br />
            {order.email}
          </address>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Payment
          </p>
          <p className="mt-2 leading-relaxed">
            {order.payment.providerLabel}
            <br />
            <span className="capitalize">{order.payment.status}</span>
            <br />
            <span className="font-mono text-xs">{order.payment.reference}</span>
          </p>
        </div>
      </section>

      <table className="w-full py-6 text-left">
        <thead>
          <tr className="border-b text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th scope="col" className="py-2 font-semibold">Item</th>
            <th scope="col" className="py-2 text-right font-semibold">Qty</th>
            <th scope="col" className="py-2 text-right font-semibold">Unit</th>
            <th scope="col" className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={`${line.slug}-${line.variantId}`} className="border-b">
              <td className="py-2.5">
                {line.name}
                <span className="block text-xs text-muted-foreground">
                  {line.brand} · {line.variantLabel}
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums">{line.quantity}</td>
              <td className="py-2.5 text-right font-mono tabular-nums">{formatPrice(line.unitPrice)}</td>
              <td className="py-2.5 text-right font-mono tabular-nums">
                {formatPrice(line.unitPrice * line.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto max-w-xs space-y-1.5 py-4">
        <Row label="Subtotal" value={formatPrice(order.totals.subtotal)} />
        {order.totals.discountTotal > 0 ? (
          <Row label="Discounts" value={`−${formatPrice(order.totals.discountTotal)}`} />
        ) : null}
        <Row
          label="Shipping"
          value={order.totals.shippingTotal === 0 ? "Free" : formatPrice(order.totals.shippingTotal)}
        />
        {order.totals.taxLines.map((line) => (
          <Row key={line.label} label={line.label} value={formatPrice(line.amount)} />
        ))}
        {order.totals.giftCardTotal > 0 ? (
          <Row label="Gift card" value={`−${formatPrice(order.totals.giftCardTotal)}`} />
        ) : null}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span className="font-mono tabular-nums">{formatPrice(order.totals.grandTotal)}</span>
        </div>
      </section>

      <footer className="mt-8 border-t pt-4 text-[10px] leading-relaxed text-muted-foreground">
        Thank you for your order. Questions about this invoice go to {settings.supportEmail}.
        Company and legal correspondence: {settings.contactEmail}.
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
