import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, Package, Truck } from "lucide-react";

import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import { Container } from "@/components/common/container";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { orderStore } from "@/lib/commerce/orders";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function ConfirmationPage(
  props: PageProps<"/checkout/confirmation/[id]">,
) {
  const { id } = await props.params;
  const user = await requireUser();
  const order = orderStore.find(id);

  // Never show one customer another's order, even with a valid id.
  if (!order || order.userId !== user.id) notFound();

  return (
    <div className="bg-surface">
      <ClearCartOnSuccess />
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/12">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </span>
            <h1 className="mt-6 font-display text-4xl tracking-tight sm:text-5xl">
              Thank you — order confirmed
            </h1>
            <p className="mt-3 text-muted-foreground">
              Reference <span className="font-mono text-foreground">{order.reference}</span>. A
              confirmation is on its way to {order.email}.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <InfoTile icon={Package} label="Status" value="Processing" hint="Being picked now" />
            <InfoTile
              icon={Truck}
              label="Delivery"
              value={order.shippingMethodLabel}
              hint={order.deliveryEstimate.label}
            />
            <InfoTile
              icon={Mail}
              label="Payment"
              value={order.payment.providerLabel}
              hint={order.payment.status === "pending" ? "Awaiting payment" : "Captured"}
            />
          </div>

          {order.payment.status === "pending" ? (
            <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-800 dark:text-amber-300">
              This order is held until payment settles. Quote{" "}
              <span className="font-mono">{order.reference}</span> so we can match it, or write to{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="underline underline-offset-4">
                {siteConfig.supportEmail}
              </a>
              .
            </p>
          ) : null}

          <section className="mt-10 rounded-2xl border bg-card p-6 shadow-premium">
            <h2 className="font-display text-2xl tracking-tight">What you ordered</h2>
            <ul className="mt-6 divide-y">
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
                    <p className="mt-1 text-sm text-muted-foreground">Quantity {line.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6">
            <OrderSummaryCard totals={order.totals} />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button render={<Link href={`/account/orders/${order.id}`} />}>Track this order</Button>
            <Button variant="outline" render={<Link href="/shop" />}>
              Continue shopping
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
