"use client";

import { Lock, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

import { ProductImage } from "@/components/product/product-image";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { formatPrice, pluralize } from "@/lib/format";

export function CartView() {
  const { lines, subtotal, count, remove, setQuantity, clear } = useCart();

  const shipping = subtotal === 0 || subtotal >= siteConfig.freeShippingThreshold ? 0 : 995;
  const estimatedTax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + estimatedTax;

  if (lines.length === 0) {
    return (
      <div className="mt-12 rounded-3xl border border-dashed p-16 text-center">
        <p className="font-display text-2xl">Nothing in the cart yet</p>
        <p className="mt-2 text-muted-foreground">
          Start with a department — everything ships within 48 hours.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/categories" />}>Browse departments</Button>
          <Button variant="outline" render={<Link href="/deals" />}>
            See current deals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Cart contents">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{pluralize(count, "item")}</p>
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear cart
          </Button>
        </div>

        <Separator className="mt-4" />

        <ul>
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={`${line.slug}-${line.variantId}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="flex gap-5 overflow-hidden border-b py-6"
              >
                <Link href={`/shop/${line.slug}`} className="shrink-0">
                  <ProductImage
                    src={line.snapshot.image}
                    alt={line.snapshot.name}
                    gradient={line.snapshot.gradient}
                    category={line.snapshot.category}
                    sizes="128px"
                    className="size-28 rounded-xl sm:size-32"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {line.snapshot.brand}
                      </p>
                      <h2 className="mt-1 truncate font-medium">
                        <Link href={`/shop/${line.slug}`}>{line.snapshot.name}</Link>
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {line.snapshot.variantLabel === "Standard"
                          ? formatPrice(line.snapshot.price)
                          : `${line.snapshot.variantLabel} · ${formatPrice(line.snapshot.price)}`}{" "}
                        each
                      </p>
                    </div>
                    <p className="font-mono tabular-nums">{formatPrice(line.lineTotal)}</p>
                  </div>

                  <div className="mt-auto flex items-center gap-1 pt-4">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Decrease quantity of ${line.snapshot.name}`}
                      onClick={() => setQuantity(line.slug, line.variantId, line.quantity - 1)}
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </Button>
                    <span className="w-9 text-center font-mono text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Increase quantity of ${line.snapshot.name}`}
                      onClick={() => setQuantity(line.slug, line.variantId, line.quantity + 1)}
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-3 text-muted-foreground"
                      onClick={() => remove(line.slug, line.variantId)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Remove
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border p-6">
          <h2 className="font-display text-2xl">Summary</h2>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-mono tabular-nums">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated tax</dt>
              <dd className="font-mono tabular-nums">{formatPrice(estimatedTax)}</dd>
            </div>
          </dl>

          <Separator className="my-5" />

          <div className="flex items-baseline justify-between">
            <span className="font-medium">Total</span>
            <span className="font-mono text-xl tabular-nums">{formatPrice(total)}</span>
          </div>

          <Button size="lg" className="mt-6 w-full" render={<Link href="/checkout" />}>
            <Lock className="size-4" aria-hidden />
            Secure checkout
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Free shipping over {formatPrice(siteConfig.freeShippingThreshold)} · 30-day returns
          </p>
        </div>
      </aside>
    </div>
  );
}
