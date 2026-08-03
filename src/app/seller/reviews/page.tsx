import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";

import { SellerReviewReply } from "@/components/seller/seller-review-reply";
import { Card, EmptyState, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { formatStoreDate } from "@/config/store";
import { requireSeller } from "@/lib/marketplace/auth";
import { reviewStore } from "@/lib/marketplace/reviews";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Reviews" };

const statusTone: Record<string, "positive" | "warning" | "danger"> = {
  published: "positive",
  pending: "warning",
  rejected: "danger",
};

export default async function SellerReviewsPage() {
  const { seller } = await requireSeller("/seller/reviews");
  const csrfToken = await getCsrfToken();

  const reviews = reviewStore.forSeller(seller.id, { includeUnpublished: true });
  const published = reviews.filter((review) => review.status === "published");

  const average =
    published.length > 0
      ? published.reduce((total, review) => total + review.rating, 0) / published.length
      : 0;

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reviews of your products and of your store. Moderation is handled by the marketplace; replies are yours."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Reviews" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average rating"
          value={average > 0 ? `${average.toFixed(1)} ★` : "—"}
          tone="gold"
        />
        <StatCard label="Published" value={published.length} tone="positive" />
        <StatCard
          label="In moderation"
          value={reviews.filter((review) => review.status === "pending").length}
          tone="warning"
        />
        <StatCard
          label="Awaiting your reply"
          value={published.filter((review) => !review.reply).length}
        />
      </div>

      <Card bodyClassName="p-0">
        {reviews.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Customers can review a product once their order is delivered."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {reviews.map((review) => (
              <li key={review.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{review.rating}★</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{review.title}</span>
                  {review.verifiedPurchase ? <Pill tone="positive">verified purchase</Pill> : null}
                  <Pill tone={statusTone[review.status] ?? "neutral"}>{review.status}</Pill>
                </div>

                <p className="mt-1.5 text-sm text-muted-foreground">{review.body}</p>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {review.authorName} · {formatStoreDate(review.createdAt)} ·{" "}
                  {review.target === "product" ? (
                    <Link
                      href={`/seller/products/${review.targetId}`}
                      className="underline underline-offset-4"
                    >
                      {review.targetId}
                    </Link>
                  ) : (
                    "store review"
                  )}
                </p>

                {review.reply ? (
                  <div className="mt-3 rounded-lg border-l-2 border-gold bg-muted/40 p-3">
                    <p className="text-xs font-medium">{seller.storeName} replied</p>
                    <p className="mt-1 text-sm text-muted-foreground">{review.reply.body}</p>
                  </div>
                ) : review.status === "published" ? (
                  <div className="mt-3">
                    <SellerReviewReply csrfToken={csrfToken} reviewId={review.id} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
