"use client";

import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Buy now.
 *
 * Adds the default variant and goes straight to checkout. Deliberately the same
 * `add()` the cart uses rather than a second path — one place decides what a
 * line looks like, so an express purchase and a normal one cannot diverge.
 */
export function BuyNowButton({
  product,
  variantId,
  quantity = 1,
  className,
  size = "sm",
}: {
  product: Product;
  variantId?: string;
  quantity?: number;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const { add } = useCart();
  const [pending, startTransition] = React.useTransition();

  const soldOut = product.stockStatus === "out_of_stock";

  return (
    <Button
      size={size}
      variant="outline"
      aria-label={`Buy ${product.name} now`}
      className={cn("gap-1.5 max-[420px]:px-2.5 @max-[17rem]/card:px-2.5", className)}
      disabled={soldOut || pending}
      onClick={() => {
        const variant =
          product.variants.find((option) => option.id === variantId) ?? product.variants[0];
        add(product, variant, quantity);
        toast.success("Taking you to checkout", { description: product.name });
        startTransition(() => router.push("/checkout"));
      }}
    >
      <Zap className="size-3.5" aria-hidden />
      {/* Inside a narrow card the icon is the label; screen readers keep it. */}
      <span className="max-[420px]:sr-only @max-[17rem]/card:sr-only">Buy now</span>
    </Button>
  );
}
