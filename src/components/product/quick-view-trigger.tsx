"use client";

import { Eye } from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

/**
 * The dialog — and everything it pulls in (Base UI dialog, the buy panel, the
 * wishlist/compare/share controls) — is fetched the first time a shopper opens
 * a quick view, not on every listing page load.
 */
const QuickViewDialog = dynamic(
  () => import("@/components/product/quick-view").then((module) => module.QuickViewDialog),
  { ssr: false },
);

export function QuickViewTrigger({
  product,
  className,
  iconOnly = true,
}: {
  product: Product;
  className?: string;
  /** Collapse to an icon where the label would not fit. */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  // Stays true after the first open so closing does not unmount the chunk.
  const [mounted, setMounted] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        size={iconOnly ? "icon-sm" : "sm"}
        className={className}
        aria-label={`Quick view: ${product.name}`}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
      >
        <Eye className="size-3.5" aria-hidden />
        {iconOnly ? null : "Quick view"}
      </Button>

      {mounted ? (
        <QuickViewDialog product={product} open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
