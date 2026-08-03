"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/** Adds the default variant straight from a card, without leaving the grid. */
export function QuickAddButton({
  product,
  className,
  label = "Add to cart",
  showIcon = false,
}: {
  product: Product;
  className?: string;
  label?: string;
  /** Off by default — in a tight card the icon is what clips the label. */
  showIcon?: boolean;
}) {
  const { add } = useCart();

  return (
    <Button
      size="sm"
      className={cn("gap-1.5", className)}
      disabled={product.stockStatus === "out_of_stock"}
      onClick={() => {
        const variant = product.variants[0];
        add(product, variant);
        toast.success(`${product.name} added`, {
          description: `${product.brand}${variant.label === "Standard" ? "" : ` · ${variant.label}`}`,
        });
      }}
    >
      {showIcon ? <Plus className="size-3.5" aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </Button>
  );
}
