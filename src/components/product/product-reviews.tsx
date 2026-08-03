import { BadgeCheck, ThumbsUp } from "lucide-react";

import { StarRating } from "@/components/product/star-rating";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Review summary and list. Server-rendered — the reviews ship in the HTML so
 * they are indexable and need no client JavaScript.
 */
export function ProductReviews({ product }: { product: Product }) {
  const { reviews } = product;

  // Distribution across the published sample.
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    return { stars, count, percent: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  const verifiedCount = reviews.filter((review) => review.verifiedPurchase).length;

  return (
    <section aria-labelledby="reviews-heading" className="scroll-mt-32" id="reviews">
      <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2 id="reviews-heading" className="font-display text-3xl tracking-tight">
            Reviews
          </h2>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-5xl tabular-nums">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">out of 5</span>
          </div>

          <StarRating rating={product.rating} size="md" className="mt-2" />

          <p className="mt-3 text-sm text-muted-foreground">
            {product.reviewCount.toLocaleString("en-US")} ratings ·{" "}
            {reviews.length} written {reviews.length === 1 ? "review" : "reviews"}
          </p>

          {verifiedCount > 0 ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-500">
              <BadgeCheck className="size-4" aria-hidden />
              {verifiedCount} from verified purchases
            </p>
          ) : null}

          <dl className="mt-6 space-y-1.5">
            {distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-sm">
                <dt className="w-10 shrink-0 tabular-nums text-muted-foreground">
                  {row.stars}★
                </dt>
                <dd className="flex flex-1 items-center gap-3">
                  <span
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${row.count} ${row.stars}-star reviews`}
                  >
                    <span
                      className="block h-full rounded-full bg-amber-500"
                      style={{ width: `${row.percent}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ol className="space-y-0">
          {reviews.map((review, index) => (
            <li key={review.id}>
              {index > 0 ? <Separator className="my-8" /> : null}

              <article>
                <header className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs"
                  >
                    {initials(review.author)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-sm font-medium">{review.author}</span>
                      {review.verifiedPurchase ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          )}
                        >
                          <BadgeCheck className="size-3" aria-hidden />
                          Verified purchase
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <StarRating rating={review.rating} size="xs" />
                      <time
                        dateTime={review.createdAt}
                        className="text-xs text-muted-foreground"
                      >
                        {dateFormat.format(new Date(review.createdAt))}
                      </time>
                    </div>
                  </div>
                </header>

                <h3 className="mt-4 font-medium">{review.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground text-pretty">
                  {review.body}
                </p>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ThumbsUp className="size-3.5" aria-hidden />
                  {review.helpfulCount} found this helpful
                </p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
