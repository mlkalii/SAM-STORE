"use client";

import { Check, Copy, GitCompare, Heart, Share2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { COMPARE_LIMIT, useCompare, useWishlist } from "@/hooks/use-product-lists";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Wishlist / compare / share controls. Used by cards, the quick view and the
 * PDP — the variant prop switches between an icon puck and a labelled button.
 */

type ActionVariant = "icon" | "labelled";

export function WishlistButton({
  product,
  variant = "icon",
  className,
}: {
  product: Product;
  variant?: ActionVariant;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(product.slug);

  const onClick = () => {
    const nowSaved = toggle(product);
    toast[nowSaved ? "success" : "message"](
      nowSaved ? "Saved to wishlist" : "Removed from wishlist",
      { description: product.name },
    );
  };

  if (variant === "labelled") {
    return (
      <Button variant="outline" className={className} onClick={onClick} aria-pressed={saved}>
        <Heart className={cn("size-4", saved && "fill-current")} aria-hidden />
        {saved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="icon-sm"
      className={cn("rounded-full shadow-sm backdrop-blur", className)}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      aria-pressed={saved}
      onClick={onClick}
    >
      <Heart className={cn("size-4", saved && "fill-current text-rose-500")} aria-hidden />
    </Button>
  );
}

export function CompareButton({
  product,
  variant = "icon",
  className,
}: {
  product: Product;
  variant?: ActionVariant;
  className?: string;
}) {
  const { has, toggle } = useCompare();
  const active = has(product.slug);

  const onClick = () => {
    const result = toggle(product);
    if (result === null) {
      toast.error(`Compare holds ${COMPARE_LIMIT} products`, {
        description: "Remove one before adding another.",
      });
      return;
    }
    toast[result ? "success" : "message"](
      result ? "Added to compare" : "Removed from compare",
      { description: product.name },
    );
  };

  if (variant === "labelled") {
    return (
      <Button variant="outline" className={className} onClick={onClick} aria-pressed={active}>
        <GitCompare className="size-4" aria-hidden />
        {active ? "In compare" : "Compare"}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="icon-sm"
      className={cn("rounded-full shadow-sm backdrop-blur", active && "bg-foreground text-background", className)}
      aria-label={active ? `Remove ${product.name} from compare` : `Add ${product.name} to compare`}
      aria-pressed={active}
      onClick={onClick}
    >
      {active ? <Check className="size-4" aria-hidden /> : <GitCompare className="size-4" aria-hidden />}
    </Button>
  );
}

export function ShareButton({
  product,
  variant = "labelled",
  className,
}: {
  product: Product;
  variant?: ActionVariant;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function onClick() {
    const url = `${window.location.origin}/shop/${product.slug}`;
    const payload = {
      title: `${product.brand} ${product.name}`,
      text: product.shortDescription,
      url,
    };

    // Native sheet where available (mobile, Safari); clipboard everywhere else.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied", { description: url });
    } catch {
      toast.error("Could not copy the link", { description: url });
    }
  }

  if (variant === "icon") {
    return (
      <Button
        variant="secondary"
        size="icon-sm"
        className={cn("rounded-full shadow-sm backdrop-blur", className)}
        aria-label={`Share ${product.name}`}
        onClick={onClick}
      >
        <Share2 className="size-4" aria-hidden />
      </Button>
    );
  }

  // The icon must not depend on `navigator`: the server cannot see it, so
  // branching on it here produced a hydration mismatch. Which mechanism runs is
  // decided in the click handler instead, where it is actually needed.
  return (
    <Button variant="outline" className={className} onClick={onClick}>
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}

/** Small inline "copy SKU" affordance used in the PDP meta row. */
export function CopySkuButton({ sku }: { sku: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:text-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(sku);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Could not copy the SKU");
        }
      }}
      aria-label={`Copy SKU ${sku}`}
    >
      SKU {sku}
      {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3 opacity-50" aria-hidden />}
    </button>
  );
}
