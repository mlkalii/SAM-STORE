import { BadgeCheck, MessageSquare } from "lucide-react";

import { StarRating } from "@/components/product/star-rating";
import { formatStoreDate } from "@/config/store";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verifiedPurchase: boolean;
  reply?: { body: string; at: string };
}

/**
 * Published store reviews.
 *
 * Server component — reviews are read-only here, and moderation happens in the
 * admin, so none of this needs to reach the client bundle.
 */
export function SellerReviewList({
  reviews,
  storeName,
}: {
  reviews: Review[];
  storeName: string;
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        No store reviews yet. They can be left once an order from this seller is delivered.
      </p>
    );
  }

  return (
    <ul className="space-y-5">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating rating={review.rating} size="sm" />
            <p className="min-w-0 flex-1 truncate font-medium">{review.title}</p>
            {review.verifiedPurchase ? (
              <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="size-3.5" aria-hidden />
                Verified purchase
              </span>
            ) : null}
          </div>

          <p className="mt-2.5 text-sm text-muted-foreground text-pretty">{review.body}</p>

          <p className="mt-3 text-xs text-muted-foreground">
            {review.authorName} · {formatStoreDate(review.createdAt)}
          </p>

          {review.reply ? (
            <div className="mt-4 rounded-xl border-l-2 border-gold bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium">
                <MessageSquare className="size-3" aria-hidden />
                {storeName} replied
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{review.reply.body}</p>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
