import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { returnEligibility, returnPolicy } from "@/config/returns";
import { warrantyFor } from "@/config/warranty";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * The trust row on a product card: what cover it carries and when it
 * arrives.
 *
 * Server-renderable and deliberately compact — three short chips rather than
 * three sentences, because on a card this information is scanned, not read.
 * Warranty and returns are derived from the department, so they are correct for
 * every product without anything being stored per row.
 */

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
