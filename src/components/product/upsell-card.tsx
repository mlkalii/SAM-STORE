import { ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Upsell.
 *
 * Only rendered when we actually stock a higher tier of the same product, and
 * it states the real difference in price rather than nudging vaguely.
 */
export function UpsellCard({
  current,
  upgrade,
  className,
}: {
  current: Product;
  upgrade: Product;
  className?: string;
}) {
  const difference = upgrade.price - current.price;

  return (
    <Link
      href={`/shop/${upgrade.slug}`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-gold/20 bg-gold/5 p-3 transition-colors hover:bg-gold/10",
        className,
      )}
    >
      <ProductImage
        src={upgrade.images[0]?.thumbnail ?? ""}
        alt={upgrade.images[0]?.alt ?? upgrade.name}
        gradient={upgrade.gradient}
        category={upgrade.category}
        sizes="80px"
        className="size-16 shrink-0 rounded-xl"
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
          <TrendingUp className="size-3" aria-hidden />
          Step up
        </span>
        <span className="mt-1 block truncate text-sm font-medium">{upgrade.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatPrice(difference)} more · {upgrade.warrantyMonths}-month warranty
        </span>
      </span>

      <ArrowUpRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
