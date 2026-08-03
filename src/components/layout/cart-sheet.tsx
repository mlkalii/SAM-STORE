"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/product/product-image";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { formatPrice, pluralize } from "@/lib/format";

export function CartSheet() {
  const { lines, subtotal, count, isOpen, setOpen, remove, setQuantity } = useCart();
  const remaining = Math.max(0, siteConfig.freeShippingThreshold - subtotal);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your cart</SheetTitle>
          <SheetDescription>
            {count === 0
              ? "Nothing in here yet."
              : `${pluralize(count, "item")} · ${
                  remaining === 0
                    ? "shipping is on us"
                    : `${formatPrice(remaining)} from free shipping`
                }`}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">
              Your cart is empty. Fifteen departments are waiting.
            </p>
            <Button render={<Link href="/categories" onClick={() => setOpen(false)} />}>
              Browse departments
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-4">
              {lines.map((line) => (
                <li key={`${line.slug}-${line.variantId}`} className="flex gap-4">
                  <Link
                    href={`/shop/${line.slug}`}
                    onClick={() => setOpen(false)}
                    className="shrink-0"
                  >
                    <ProductImage
                      src={line.snapshot.image}
                      alt={line.snapshot.name}
                      gradient={line.snapshot.gradient}
                      category={line.snapshot.category}
                      sizes="128px"
                      className="size-20 rounded-lg"
                                          />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="truncate text-sm font-medium">{line.snapshot.name}</p>
                      <p className="font-mono text-sm tabular-nums">
                        {formatPrice(line.lineTotal)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {line.snapshot.brand}
                      {line.snapshot.variantLabel === "Standard"
                        ? ""
                        : ` · ${line.snapshot.variantLabel}`}
                    </p>

                    <div className="mt-3 flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Decrease quantity of ${line.snapshot.name}`}
                        onClick={() =>
                          setQuantity(line.slug, line.variantId, line.quantity - 1)
                        }
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </Button>
                      <span className="w-8 text-center font-mono text-sm tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Increase quantity of ${line.snapshot.name}`}
                        onClick={() =>
                          setQuantity(line.slug, line.variantId, line.quantity + 1)
                        }
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto text-muted-foreground"
                        aria-label={`Remove ${line.snapshot.name}`}
                        onClick={() => remove(line.slug, line.variantId)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-mono text-lg tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <Button
                size="lg"
                className="w-full"
                render={<Link href="/checkout" onClick={() => setOpen(false)} />}
              >
                Checkout
              </Button>
              <Button
                variant="outline"
                className="mt-2 w-full"
                render={<Link href="/cart" onClick={() => setOpen(false)} />}
              >
                Review cart
              </Button>
              <p className="pt-2 text-center text-xs text-muted-foreground">
                Taxes and duties calculated at checkout.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
