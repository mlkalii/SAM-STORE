"use client";

import { GitCompare, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { useCompare, useWishlist } from "@/hooks/use-product-lists";
import { cn } from "@/lib/utils";

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground tabular-nums">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Wishlist, compare and cart — all three read client stores, so they live together. */
export function HeaderActions({ className }: { className?: string }) {
  const { count: cartCount, setOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="relative hidden sm:inline-flex"
        aria-label={`Compare, ${compareCount} products`}
        render={<Link href="/compare" />}
      >
        <GitCompare className="size-4.5" aria-hidden />
        <CountBadge count={compareCount} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Wishlist, ${wishlistCount} saved`}
        render={<Link href="/wishlist" />}
      >
        <Heart className="size-4.5" aria-hidden />
        <CountBadge count={wishlistCount} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Open cart, ${cartCount} items`}
        onClick={() => setOpen(true)}
      >
        <ShoppingBag className="size-4.5" aria-hidden />
        <CountBadge count={cartCount} />
      </Button>
    </div>
  );
}
