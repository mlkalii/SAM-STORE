import { BadgeCheck, RotateCcw, ShieldCheck, Store, Truck } from "lucide-react";
import Link from "next/link";

import { returnEligibility, returnPolicy } from "@/config/returns";
import { warrantyFor } from "@/config/warranty";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * The trust row on a product card: who sells it, what cover it carries, and
 * when it arrives.
 *
 * Server-renderable and deliberately compact — three short chips rather than
 * three sentences, because on a card this information is scanned, not read.
 * Warranty and returns are derived from the department, so they are correct for
 * every product without anything being stored per row.
 */

export function SellerLine({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  if (!product.sellerName) return null;

  const content = (
    <>
      <Store className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{product.sellerName}</span>
      {product.sellerVerified ? (
        <BadgeCheck
          className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-label="Verified seller"
        />
      ) : null}
    </>
  );

  // The card's title already covers the whole tile with a pseudo-element, so a
  // nested link needs to sit above it to stay clickable.
  return product.sellerSlug ? (
    <Link
      href={`/sellers/${product.sellerSlug}`}
      className={cn(
        "relative z-10 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {content}
    </Link>
  ) : (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {content}
    </span>
  );
}

export function ProductChips({
  product,
  delivery,
  className,
}: {
  product: Product;
  /** Rendered only once the client knows today's date. */
  delivery?: string | null;
  className?: string;
}) {
  const warranty = warrantyFor(product.category);
  const eligibility = returnEligibility(product);

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1", className)}>
      {delivery ? (
        <li className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Truck className="size-3 shrink-0" aria-hidden />
          {delivery}
        </li>
      ) : null}

      {warranty.kind !== "none" ? (
        <li className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3 shrink-0" aria-hidden />
          {warranty.kind === "months" ? `${warranty.months}-mo warranty` : "DOA cover"}
        </li>
      ) : null}

      {eligibility.returnable ? (
        <li className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <RotateCcw className="size-3 shrink-0" aria-hidden />
          {returnPolicy.windowDays}-day returns
        </li>
      ) : null}
    </ul>
  );
}
