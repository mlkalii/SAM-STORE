import { Separator } from "@/components/ui/separator";
import type { OrderTotals } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Renders a totals breakdown. Shared by the confirmation page, the order
 * detail page and the account order list, so one component decides how money is
 * presented everywhere after checkout.
 */
export function OrderSummaryCard({
  totals,
  className,
}: {
  totals: OrderTotals;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-6 shadow-premium", className)}>
      <h2 className="font-display text-xl tracking-tight">Order total</h2>

      <dl className="mt-5 space-y-2.5 text-sm">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />

        {totals.appliedDiscounts
          .filter((discount) => !discount.appliesToShipping)
          .map((discount) => (
            <Row
              key={discount.id}
              label={discount.label}
              value={`−${formatPrice(discount.amount)}`}
              positive
            />
          ))}

        <Row
          label="Shipping"
          value={totals.shippingTotal === 0 ? "Free" : formatPrice(totals.shippingTotal)}
        />

        {totals.taxLines.map((line) => (
          <Row key={line.label} label={line.label} value={formatPrice(line.amount)} />
        ))}

        {totals.giftCardTotal > 0 ? (
          <Row label="Gift card" value={`−${formatPrice(totals.giftCardTotal)}`} positive />
        ) : null}

        <Separator className="my-3" />

        <div className="flex items-baseline justify-between">
          <dt className="font-medium">Paid</dt>
          <dd className="font-mono text-xl tabular-nums">{formatPrice(totals.grandTotal)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={cn("text-muted-foreground", positive && "text-emerald-600 dark:text-emerald-400")}>
        {label}
      </dt>
      <dd className={cn("font-mono tabular-nums", positive && "text-emerald-600 dark:text-emerald-400")}>
        {value}
      </dd>
    </div>
  );
}
