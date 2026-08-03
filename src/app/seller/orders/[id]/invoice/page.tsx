import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/admin/print-document";
import { storeAddressLines, storeConfig, formatStoreDate } from "@/config/store";
import { adminOrders } from "@/lib/admin";
import { requireSeller } from "@/lib/marketplace/auth";
import { commissionFor } from "@/lib/marketplace/commission";
import { linesForSeller } from "@/lib/marketplace/settlement";
import { formatPrice, formatPriceWithCode } from "@/lib/format";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

/**
 * Seller invoice.
 *
 * Shows only that seller's lines and their commission, because that is the
 * document they need for their own books. The customer's full-order invoice —
 * every seller's lines together — stays with the marketplace.
 */
export default async function SellerInvoicePage(
  props: PageProps<"/seller/orders/[id]/invoice">,
) {
  const { id } = await props.params;
  const { seller } = await requireSeller(`/seller/orders/${id}`);

  const order = await adminOrders.find(id);
  if (!order) notFound();

  const lines = linesForSeller(order, seller.id);
  if (lines.length === 0) notFound();

  const breakdown = commissionFor(seller.id, lines);

  return (
    <div className="mx-auto max-w-3xl bg-background p-8 text-foreground">
      <div className="mb-8 flex items-start justify-between print:hidden">
        <p className="text-xs text-muted-foreground">
          Your lines only. The customer receives one combined invoice from SAMRUX.
        </p>
        <PrintButton label="Print invoice" />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{order.reference}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatStoreDate(order.placedAt)} · {storeConfig.timezone}
          </p>
        </div>

        <div className="text-right text-xs leading-relaxed">
          <p className="text-sm font-semibold">{seller.storeName}</p>
          <p className="text-muted-foreground">{seller.business.legalName}</p>
          <p className="text-muted-foreground">
            {seller.business.addressLine1}
            {seller.business.addressLine2 ? `, ${seller.business.addressLine2}` : ""}
          </p>
          <p className="text-muted-foreground">
            {seller.business.city}, {seller.business.state} {seller.business.postcode}
          </p>
          <p className="text-muted-foreground">{seller.contact.email}</p>
        </div>
      </header>

      <section className="grid gap-6 border-b py-6 sm:grid-cols-2">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Sold to
          </h2>
          <address className="mt-2 text-sm not-italic leading-relaxed">
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
        </div>

        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Marketplace
          </h2>
          <address className="mt-2 text-sm not-italic leading-relaxed text-muted-foreground">
            {storeAddressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            {storeConfig.supportEmail}
          </address>
        </div>
      </section>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th scope="col" className="py-2 font-medium">Item</th>
            <th scope="col" className="py-2 text-right font-medium">Qty</th>
            <th scope="col" className="py-2 text-right font-medium">Unit</th>
            <th scope="col" className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={`${line.slug}-${line.variantId}`} className="border-b">
              <td className="py-2.5">
                <span className="block">{line.name}</span>
                <span className="block text-xs text-muted-foreground">{line.variantLabel}</span>
              </td>
              <td className="py-2.5 text-right tabular-nums">{line.quantity}</td>
              <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                {formatPrice(line.unitPrice)}
              </td>
              <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                {formatPrice(line.lineSubtotal - line.lineDiscount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Your gross</dt>
          <dd className="font-mono tabular-nums">{formatPrice(breakdown.gross)}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Marketplace commission</dt>
          <dd className="font-mono tabular-nums">-{formatPrice(breakdown.commission)}</dd>
        </div>
        <div className="flex justify-between gap-6 border-t pt-2 text-base font-semibold">
          <dt>Net to you</dt>
          <dd className="font-mono tabular-nums">{formatPriceWithCode(breakdown.net)}</dd>
        </div>
      </dl>

      <footer className="mt-10 border-t pt-4 text-[11px] leading-relaxed text-muted-foreground">
        <p>
          {breakdown.ruleLabel}. Settlement is credited to your marketplace balance and withdrawn
          from the Payouts screen. All amounts in {formatPriceWithCode(0).split(" ")[1]}.
        </p>
        <p className="mt-1">
          Marketplace operated by {storeConfig.legalName} · {storeConfig.phone} ·{" "}
          {storeConfig.supportEmail}
        </p>
      </footer>
    </div>
  );
}
