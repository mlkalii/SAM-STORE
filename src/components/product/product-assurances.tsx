"use client";

import { Clock, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { useClientToday } from "@/hooks/use-client-today";
import { estimateDelivery } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { warrantyFor } from "@/config/warranty";
import { returnEligibility } from "@/config/returns";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Delivery, warranty and returns.
 *
 * The delivery window depends on today's date, which a prerendered page cannot
 * know — so it resolves after hydration and shows a skeleton until then rather
 * than baking a stale date into static HTML.
 */
export function ProductAssurances({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const today = useClientToday();
  const delivery = today ? estimateDelivery(product, today) : null;

  const warranty = warrantyFor(product.category);
  const eligibility = returnEligibility(product);

  const rows = [
    {
      icon: Truck,
      label: "Delivery",
      value: delivery ? delivery.label : null,
      note: delivery
        ? delivery.dispatchNote
        : `Free over ${formatPrice(siteConfig.freeShippingThreshold)}`,
    },
    {
      icon: PackageCheck,
      label: "Dispatch",
      value: `Within ${product.dispatchHours} hours`,
      note: "Tracked, from our own warehouse",
    },
    {
      icon: ShieldCheck,
      label: "Warranty",
      // Assigned automatically by department — see `config/warranty`.
      value: warranty.label,
      note:
        warranty.kind === "months"
          ? "Claims handled by us, not the manufacturer"
          : warranty.summary.split(".")[0],
    },
    {
      icon: RotateCcw,
      label: "Returns",
      value: eligibility.returnable ? `${eligibility.windowDays} days` : "Not returnable",
      note: eligibility.returnable
        ? "Free return shipping on incorrect or defective items"
        : eligibility.rule?.reason ?? "Unless defective",
    },
  ];

  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex gap-3 bg-background p-4">
          <row.icon className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="mt-1">
              {row.value === null ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <span className="text-sm font-medium">{row.value}</span>
              )}
              <span className="mt-0.5 block text-xs text-muted-foreground">{row.note}</span>
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Compact single-line estimate used above the fold. */
export function DeliveryLine({ product }: { product: Product }) {
  const today = useClientToday();
  const delivery = today ? estimateDelivery(product, today) : null;

  if (!delivery) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4" aria-hidden />
        <Skeleton className="h-4 w-44" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="size-4 shrink-0" aria-hidden />
      {delivery.dispatchNote}
    </span>
  );
}
