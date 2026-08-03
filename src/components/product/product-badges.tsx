import { Flame, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Product, StockStatus } from "@/types";

/**
 * One source of truth for product badging, so a card, a quick view and the PDP
 * never disagree about what a product is.
 *
 * Deliberately not the shadcn `Badge`: on a dark canvas these need their own
 * tinted-glass treatment to stay legible over photography.
 */

const base =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] backdrop-blur-md";

function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (percent <= 0) return null;
  return (
    <span className={cn(base, "bg-gold text-gold-foreground shadow-gold", className)}>
      −{percent}%
    </span>
  );
}

/** At most two status badges — more than that and the card turns into noise. */
export function ProductBadges({
  product,
  className,
  limit = 2,
}: {
  product: Product;
  className?: string;
  limit?: number;
}) {
  const badges: React.ReactNode[] = [];

  if (product.discountPercent > 0) {
    badges.push(<DiscountBadge key="sale" percent={product.discountPercent} />);
  }
  if (product.trending) {
    badges.push(
      <span key="trending" className={cn(base, "bg-black/60 text-white")}>
        <TrendingUp className="size-3" aria-hidden />
        Trending
      </span>,
    );
  }
  if (product.newArrival) {
    badges.push(
      <span key="new" className={cn(base, "bg-black/60 text-white")}>
        <Sparkles className="size-3" aria-hidden />
        New
      </span>,
    );
  }
  if (product.bestSeller) {
    badges.push(
      <span key="best" className={cn(base, "bg-black/60 text-white")}>
        <Flame className="size-3" aria-hidden />
        Best seller
      </span>,
    );
  }

  if (badges.length === 0) return null;

  return <div className={cn("flex flex-wrap gap-1.5", className)}>{badges.slice(0, limit)}</div>;
}

const stockTone: Record<StockStatus, string> = {
  in_stock: "text-emerald-600 dark:text-emerald-400",
  low_stock: "text-amber-600 dark:text-amber-400",
  out_of_stock: "text-muted-foreground",
};

const dotTone: Record<StockStatus, string> = {
  in_stock: "bg-emerald-500 dark:bg-emerald-400",
  low_stock: "bg-amber-500 dark:bg-amber-400",
  out_of_stock: "bg-muted-foreground",
};

function stockLabel(status: StockStatus, count: number) {
  if (status === "out_of_stock") return "Out of stock";
  if (status === "low_stock") return `Only ${count} left`;
  return "In stock";
}

export function StockBadge({
  status,
  count,
  className,
}: {
  status: StockStatus;
  count: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        stockTone[status],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          dotTone[status],
          status === "low_stock" && "motion-safe:animate-pulse",
        )}
      />
      {stockLabel(status, count)}
    </span>
  );
}
