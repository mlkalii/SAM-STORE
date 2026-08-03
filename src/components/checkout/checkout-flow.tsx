"use client";

import {
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { placeOrderAction } from "@/app/actions/checkout";
import { CsrfField, FormBanner, TextField } from "@/components/auth/form-parts";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { ProductImage } from "@/components/product/product-image";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { idleFormState } from "@/lib/auth/validation";
import type { PricedCart } from "@/lib/commerce/pricing";
import type { ShippingMethod } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaymentMethodOption {
  id: string;
  label: string;
  description: string;
  offline: boolean;
  wallet: boolean;
  available: boolean;
  requiredEnv: string[];
}

interface QuoteResponse {
  quote: PricedCart;
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethodOption[];
}

export interface CheckoutDefaults {
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
}

const STEPS = [
  { id: "cart", label: "Cart", icon: Package },
  { id: "shipping", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: ShieldCheck },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/**
 * Multi-step checkout.
 *
 * The client owns the cart and the form state; the *server* owns every number.
 * Each change re-quotes against `/api/checkout/quote`, so totals, shipping
 * options and payment methods always come from the domain layer rather than
 * being recomputed here — the browser can change what is in the basket but
 * never what it costs.
 */
export function CheckoutFlow({
  csrfToken,
  defaults,
}: {
  csrfToken: string;
  defaults: CheckoutDefaults;
}) {
  const { lines } = useCart();
  const [state, formAction] = React.useActionState(placeOrderAction, idleFormState);

  const [step, setStep] = React.useState<StepId>("cart");
  const [country, setCountry] = React.useState(defaults.country || "US");
  const [shippingMethodId, setShippingMethodId] = React.useState<string>("");
  const [paymentProviderId, setPaymentProviderId] = React.useState<string>("");
  const [billingSame, setBillingSame] = React.useState(true);
  const [coupons, setCoupons] = React.useState<string[]>([]);
  const [giftCards, setGiftCards] = React.useState<string[]>([]);
  const [data, setData] = React.useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = React.useState(false);

  const items = React.useMemo(
    () =>
      lines.map((line) => ({
        slug: line.slug,
        variantId: line.variantId,
        quantity: line.quantity,
      })),
    [lines],
  );

  const cartJson = JSON.stringify(items);
  const couponKey = coupons.join(",");
  const giftKey = giftCards.join(",");

  // Re-quote whenever anything that affects the price changes.
  React.useEffect(() => {
    if (items.length === 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoting(true);
      try {
        const response = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            items,
            couponCodes: coupons,
            giftCardCodes: giftCards,
            shippingMethodId: shippingMethodId || undefined,
            country,
          }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as QuoteResponse;
        setData(payload);
        // Adopt whatever the server settled on, so the form always posts a
        // method that is actually valid for this destination.
        if (payload.quote.shippingMethodId) setShippingMethodId(payload.quote.shippingMethodId);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setData(null);
      } finally {
        setQuoting(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [cartJson, couponKey, giftKey, shippingMethodId, country, items, coupons, giftCards]);

  // An emptied cart must not keep showing the last quote, and a stale quote
  // must not linger — both are derived rather than synced through an effect.
  const live = items.length > 0 ? data : null;
  const quote = live?.quote ?? null;
  const shippingMethods = React.useMemo(() => live?.shippingMethods ?? [], [live]);
  const paymentMethods = React.useMemo(() => live?.paymentMethods ?? [], [live]);

  // The selected provider is the customer's explicit choice when they have made
  // one, otherwise the first genuinely usable method. Derived, so there is no
  // effect racing the quote that produced the list.
  const effectiveProviderId =
    paymentProviderId ||
    paymentMethods.find((method) => method.available && !method.wallet)?.id ||
    paymentMethods[0]?.id ||
    "";

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);
  const canAdvance = items.length > 0 && !quote?.hasUnavailableLines;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-16 text-center">
        <Package className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-4 font-display text-2xl">Your cart is empty</p>
        <p className="mt-2 text-muted-foreground">There is nothing to check out yet.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/shop" />}>Browse the catalogue</Button>
          <Button variant="outline" render={<Link href="/deals" />}>
            See current deals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12" noValidate>
      {/* Everything the server needs, independent of which step is visible. */}
      <CsrfField token={csrfToken} />
      <input type="hidden" name="cart" value={cartJson} />
      <input type="hidden" name="coupons" value={couponKey} />
      <input type="hidden" name="giftCards" value={giftKey} />
      <input type="hidden" name="shippingMethodId" value={shippingMethodId} />
      <input type="hidden" name="paymentProviderId" value={effectiveProviderId} />

      <div className="min-w-0">
        {/* Stepper */}
        <ol className="flex flex-wrap items-center gap-2" aria-label="Checkout progress">
          {STEPS.map((entry, index) => {
            const done = index < stepIndex;
            const active = index === stepIndex;
            return (
              <li key={entry.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => index <= stepIndex && setStep(entry.id)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    active && "border-foreground bg-foreground text-background",
                    done && "border-gold/40 text-gold",
                    !active && !done && "text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : <entry.icon className="size-3.5" aria-hidden />}
                  {entry.label}
                </button>
                {index < STEPS.length - 1 ? (
                  <span aria-hidden className="hidden h-px w-6 bg-border sm:block" />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          <FormBanner state={state} />
        </div>

        {/*
          Every step stays mounted and is hidden with the `hidden` attribute
          rather than unmounted. A single-form wizard that unmounts a step also
          removes its inputs from the form, so the address would never reach the
          server — which is exactly the bug this replaced.
        */}
        <section
          hidden={step !== "cart"}
          className="mt-6 rounded-2xl border bg-card p-6 shadow-premium"
        >
            <h2 className="font-display text-2xl tracking-tight">Review your cart</h2>
            <ul className="mt-6 divide-y">
              {(quote?.lines ?? []).map((line) => (
                <li key={`${line.slug}-${line.variantId}`} className="flex gap-4 py-4 first:pt-0">
                  <ProductImage
                    src={line.image}
                    alt={line.name}
                    gradient={line.gradient}
                    category={line.category}
                    sizes="96px"
                    className="size-20 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {line.brand}
                    </p>
                    <p className="mt-1 text-sm font-medium">{line.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {line.variantLabel === "Standard" ? "" : `${line.variantLabel} · `}
                      Qty {line.quantity}
                    </p>
                    {line.availability.status !== "available" ? (
                      <p
                        className={cn(
                          "mt-1.5 text-xs",
                          line.availability.status === "unavailable"
                            ? "text-destructive"
                            : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {line.availability.message}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {formatPrice(line.lineSubtotal)}
                  </span>
                </li>
              ))}
              {quote === null ? <Skeleton className="my-4 h-20 w-full" /> : null}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" disabled={!canAdvance} onClick={() => setStep("shipping")}>
                Continue to delivery
              </Button>
              <Button variant="outline" render={<Link href="/cart" />}>
                Edit cart
              </Button>
            </div>
        </section>

        {/* 2 — Delivery */}
        <section hidden={step !== "shipping"} className="mt-6 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-premium">
              <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
                <MapPin className="size-5" aria-hidden />
                Shipping address
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextField name="shipRecipient" label="Full name" autoComplete="name" defaultValue={defaults.recipient} error={state.errors?.shipRecipient} required />
                <TextField name="shipPhone" label="Phone (optional)" type="tel" autoComplete="tel" defaultValue={defaults.phone} />
                <TextField name="shipLine1" label="Address line 1" autoComplete="address-line1" defaultValue={defaults.line1} error={state.errors?.shipLine1} required />
                <TextField name="shipLine2" label="Address line 2 (optional)" autoComplete="address-line2" defaultValue={defaults.line2} />
                <TextField name="shipCity" label="City" autoComplete="address-level2" defaultValue={defaults.city} error={state.errors?.shipCity} required />
                <TextField name="shipPostcode" label="Postcode" autoComplete="postal-code" defaultValue={defaults.postcode} error={state.errors?.shipPostcode} required />

                <div className="space-y-1.5">
                  <Label htmlFor="shipCountry">Country</Label>
                  <select
                    id="shipCountry"
                    name="shipCountry"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="IE">Ireland</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Changing this updates delivery options and tax.
                  </p>
                </div>
              </div>

              <Label
                htmlFor="saveAddress"
                className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm font-normal text-muted-foreground"
              >
                <input id="saveAddress" name="saveAddress" type="checkbox" defaultChecked className="size-4 rounded-[4px] border-input accent-foreground" />
                Save this address to my account
              </Label>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-premium">
              <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
                <Truck className="size-5" aria-hidden />
                Delivery method
              </h2>

              <div className="mt-6 space-y-3">
                {quoting && shippingMethods.length === 0 ? <Skeleton className="h-20 w-full" /> : null}

                {shippingMethods.map((method) => {
                  const free =
                    typeof method.freeOver === "number" &&
                    (quote?.totals.subtotal ?? 0) >= method.freeOver;

                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                        shippingMethodId === method.id ? "border-gold/50 bg-gold/5" : "hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="shippingMethodChoice"
                        value={method.id}
                        checked={shippingMethodId === method.id}
                        onChange={() => setShippingMethodId(method.id)}
                        className="mt-1 size-4 accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {method.label}
                          {method.tags?.map((tag) => (
                            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {method.description}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-sm tabular-nums">
                        {free || method.rate === 0 ? "Free" : formatPrice(method.rate)}
                      </span>
                    </label>
                  );
                })}
              </div>

              {quote?.deliveryEstimate ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="size-4" aria-hidden />
                  Estimated delivery{" "}
                  <span className="text-foreground">{quote.deliveryEstimate.label}</span>
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={() => setStep("payment")} disabled={!shippingMethodId}>
                  Continue to payment
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep("cart")}>
                  Back
                </Button>
              </div>
            </div>
        </section>

        {/* 3 — Payment */}
        <section hidden={step !== "payment"} className="mt-6 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-premium">
              <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
                <CreditCard className="size-5" aria-hidden />
                Payment method
              </h2>

              <div className="mt-6 space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                      effectiveProviderId === method.id ? "border-gold/50 bg-gold/5" : "hover:bg-muted/50",
                      !method.available && "opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentChoice"
                      value={method.id}
                      checked={effectiveProviderId === method.id}
                      onChange={() => setPaymentProviderId(method.id)}
                      disabled={!method.available}
                      className="mt-1 size-4 accent-foreground"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{method.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {method.description}
                      </span>
                      {!method.available ? (
                        <span className="mt-1.5 block text-xs text-amber-600 dark:text-amber-400">
                          Not connected yet — needs {method.requiredEnv.join(", ")}.
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-premium">
              <h2 className="font-display text-2xl tracking-tight">Billing address</h2>

              <Label
                htmlFor="billingSame"
                className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm font-normal text-muted-foreground"
              >
                <input
                  id="billingSame"
                  name="billingSame"
                  type="checkbox"
                  checked={billingSame}
                  onChange={(event) => setBillingSame(event.target.checked)}
                  className="size-4 rounded-[4px] border-input accent-foreground"
                />
                Same as my shipping address
              </Label>

              <div hidden={billingSame} className="mt-6 grid gap-5 sm:grid-cols-2">
                  <TextField name="billRecipient" label="Full name" error={state.errors?.billRecipient} required />
                  <TextField name="billPhone" label="Phone (optional)" type="tel" />
                  <TextField name="billLine1" label="Address line 1" error={state.errors?.billLine1} required />
                  <TextField name="billLine2" label="Address line 2 (optional)" />
                  <TextField name="billCity" label="City" error={state.errors?.billCity} required />
                  <TextField name="billPostcode" label="Postcode" error={state.errors?.billPostcode} required />
                  <TextField name="billCountry" label="Country code" defaultValue={country} error={state.errors?.billCountry} required />
              </div>

              <Separator className="my-6" />

              <div className="space-y-1.5">
                <Label htmlFor="notes">Order notes (optional)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Delivery instructions, a gift message, anything we should know."
                  className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={() => setStep("review")} disabled={!effectiveProviderId}>
                  Review order
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep("shipping")}>
                  Back
                </Button>
              </div>
            </div>
        </section>

        {/* 4 — Review and place */}
        <section
          hidden={step !== "review"}
          className="mt-6 rounded-2xl border bg-card p-6 shadow-premium"
        >
            <h2 className="font-display text-2xl tracking-tight">Review and place your order</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Totals are calculated on the server from the live catalogue, so what you see here is
              exactly what is charged.
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-right">
                  {quote?.shippingMethodLabel ?? "—"}
                  {quote?.deliveryEstimate ? (
                    <span className="block text-xs text-muted-foreground">
                      {quote.deliveryEstimate.label}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="text-right">
                  {paymentMethods.find((method) => method.id === effectiveProviderId)?.label ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <PlaceOrderButton disabled={!canAdvance || quoting} />
              <Button type="button" variant="outline" onClick={() => setStep("payment")}>
                Back
              </Button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              Submitted over a CSRF-protected form. Card details never touch our servers.
            </p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <CheckoutSummary
          quote={quote}
          quoting={quoting}
          csrfToken={csrfToken}
          cartJson={cartJson}
          coupons={coupons}
          giftCards={giftCards}
          onAddCoupon={(code) => setCoupons((current) => [...new Set([...current, code])])}
          onRemoveCoupon={(code) => setCoupons((current) => current.filter((entry) => entry !== code))}
          onAddGiftCard={(code) => setGiftCards((current) => [...new Set([...current, code])])}
          onRemoveGiftCard={(code) =>
            setGiftCards((current) => current.filter((entry) => entry !== code))
          }
        />
      </aside>
    </form>
  );
}

/**
 * Submit button.
 *
 * It deliberately does *not* clear the cart: the order may still fail
 * validation, and emptying a basket the customer has not actually bought is
 * unrecoverable. The confirmation page clears it, because reaching that page is
 * the only proof the order exists.
 */
function PlaceOrderButton({ disabled }: { disabled: boolean }) {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      onClick={() => setPending(true)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
      {pending ? "Placing order…" : "Place order"}
    </Button>
  );
}
