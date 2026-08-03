import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Accessible star rating. The stars are decorative; the value is announced via
 * the label so screen readers hear "4.6 out of 5" instead of five icons.
 */
export function StarRating({
  rating,
  size = "sm",
  showValue = false,
  reviewCount,
  className,
}: {
  rating: number;
  size?: "xs" | "sm" | "md";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}) {
  const starSize = size === "md" ? "size-4.5" : size === "sm" ? "size-3.5" : "size-3";
  const rounded = Math.round(rating);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5 text-amber-500" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(starSize, index < rounded ? "fill-current" : "opacity-25")}
          />
        ))}
      </span>
      <span className="sr-only">
        Rated {rating.toFixed(1)} out of 5
        {typeof reviewCount === "number" ? ` from ${reviewCount} reviews` : ""}
      </span>
      {showValue ? (
        <span className="text-sm tabular-nums" aria-hidden>
          {rating.toFixed(1)}
          {typeof reviewCount === "number" ? (
            // The count is the first thing to give on a narrow card — the
            // sr-only label above still announces it in full.
            <span className="ml-1 text-muted-foreground max-[420px]:hidden">
              ({reviewCount.toLocaleString("en-US")})
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
