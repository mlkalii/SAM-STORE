"use client";

import { Gift, Loader2, Tag, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { PricedCart } from "@/lib/commerce/pricing";
import { describeRejection } from "@/lib/commerce/promotions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Order summary panel.
 *
 * Every figure comes from the server quote — this component formats, it never
 * calculates. Coupon and gift card entry live here because that is where their
 * effect is visible.
 */
export function CheckoutSummary({
  quote,
  quoting,
  coupons,
  giftCards,
  onAddCoupon,
  onRemoveCoupon,
  onAddGiftCard,
  onRemoveGiftCard,
  compact = false,
}: {
  quote: PricedCart | null;
  quoting: boolean;
  csrfToken?: string;
  cartJson?: string;
  coupons: string[];
  giftCards: string[];
  onAddCoupon: (code: string) => void;
  onRemoveCoupon: (code: string) => void;
  onAddGiftCard: (code: string) => void;
  onRemoveGiftCard: (code: string) => void;
  compact?: boolean;
}) {
  const [couponInput, setCouponInput] = React.useState("");
  const [giftInput, setGiftInput] = React.useState("");

  const totals = quote?.totals;

  const rejectedCoupon = quote?.rejectedCoupons[0];
  const rejectedGift = quote?.rejectedGiftCards[0];

  return (
    <div className={cn("rounded-2xl border bg-card p-6 shadow-premium", compact && "p-5")}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-tight">Summary</h2>
        {quoting ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />
        ) : null}
      </div>

      {/* Coupon */}
      <div className="mt-6 space-y-2">
        <Label htmlFor="couponCode" className="text-xs text-muted-foreground">
          Discount code
        </Label>
        <div className="flex gap-2">
          <Input
            id="couponCode"
            value={couponInput}
            placeholder="WELCOME10"
            onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (couponInput.trim()) {
                  onAddCoupon(couponInput.trim());
                  setCouponInput("");
                }
              }
            }}
            className="h-10"
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0"
            onClick={() => {
              if (!couponInput.trim()) return;
              onAddCoupon(couponInput.trim());
              setCouponInput("");
            }}
          >
            Apply
          </Button>
        </div>

        {coupons.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {coupons.map((code) => {
              const failed = quote?.rejectedCoupons.some((entry) => entry.code === code);
              return (
                <li key={code}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                      failed
                        ? "bg-destructive/10 text-destructive"
                        : "bg-gold/12 text-gold",
                    )}
                  >
                    <Tag className="size-3" aria-hidden />
                    {code}
                    <button
                      type="button"
                      onClick={() => onRemoveCoupon(code)}
                      aria-label={`Remove ${code}`}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        {rejectedCoupon ? (
          <p role="alert" className="text-xs text-destructive">
            {describeRejection(rejectedCoupon.reason)}
          </p>
        ) : null}
      </div>

      {/* Gift card */}
      <div className="mt-5 space-y-2">
        <Label htmlFor="giftCode" className="text-xs text-muted-foreground">
          Gift card
        </Label>
        <div className="flex gap-2">
          <Input
            id="giftCode"
            value={giftInput}
            placeholder="SAMRUX-GIFT-50"
            onChange={(event) => setGiftInput(event.target.value.toUpperCase())}
            className="h-10"
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0"
            onClick={() => {
              if (!giftInput.trim()) return;
              onAddGiftCard(giftInput.trim());
              setGiftInput("");
            }}
          >
            Add
          </Button>
        </div>

        {giftCards.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {giftCards.map((code) => (
              <li key={code}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                  <Gift className="size-3" aria-hidden />
                  {code}
                  <button type="button" onClick={() => onRemoveGiftCard(code)} aria-label={`Remove ${code}`}>
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {rejectedGift ? (
          <p role="alert" className="text-xs text-destructive">
            That gift card could not be applied.
          </p>
        ) : null}
      </div>

      <Separator className="my-6" />

      {totals ? (
        <dl className="space-y-2.5 text-sm">
          <Row label={`Subtotal (${quote?.itemCount ?? 0} items)`} value={formatPrice(totals.subtotal)} />

          {totals.appliedDiscounts
            .filter((discount) => !discount.appliesToShipping)
            .map((discount) => (
              <Row
                key={discount.id}
                label={discount.label}
                value={`−${formatPrice(discount.amount)}`}
                tone="positive"
              />
            ))}

          <Row
            label="Shipping"
            value={
              totals.shippingTotal === 0
                ? "Free"
                : formatPrice(totals.shippingTotal)
            }
          />

          {totals.shippingDiscount > 0 ? (
            <Row label="Shipping discount" value={`−${formatPrice(totals.shippingDiscount)}`} tone="positive" />
          ) : null}

          {totals.taxLines.map((line) => (
            <Row
              key={line.label}
              label={`${line.label} (${Math.round(line.rate * 100)}%)`}
              value={formatPrice(line.amount)}
            />
          ))}

          {totals.giftCardTotal > 0 ? (
            <Row label="Gift card" value={`−${formatPrice(totals.giftCardTotal)}`} tone="positive" />
          ) : null}

          <Separator className="my-3" />

          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-medium">Total</dt>
            <dd className="font-mono text-2xl tabular-nums">{formatPrice(totals.grandTotal)}</dd>
          </div>
        </dl>
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive";
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={cn("text-muted-foreground", tone === "positive" && "text-emerald-600 dark:text-emerald-400")}>
        {label}
      </dt>
      <dd
        className={cn(
          "font-mono tabular-nums",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
