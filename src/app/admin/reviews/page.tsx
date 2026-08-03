import type { Metadata } from "next";

import { ReviewModerationPanel } from "@/components/admin/review-moderation-panel";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { reviewStore } from "@/lib/marketplace/reviews";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requirePermission("reviews.view", "/admin/reviews");
  const csrfToken = await getCsrfToken();

  const reviews = reviewStore.all();

  const rows = reviews.map((review) => ({
    id: review.id,
    target: review.target,
    targetId: review.targetId,
    sellerId: review.sellerId,
    sellerName: sellerStore.find(review.sellerId)?.storeName ?? review.sellerId,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verifiedPurchase: review.verifiedPurchase,
    status: review.status,
    createdAt: review.createdAt,
    moderatedBy: review.moderatedBy,
    moderationNote: review.moderationNote,
    reply: review.reply?.body,
  }));

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Every product and store review. Nothing reaches a product page until it is published here."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reviews" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting moderation"
          value={rows.filter((row) => row.status === "pending").length}
          tone={rows.some((row) => row.status === "pending") ? "warning" : "neutral"}
        />
        <StatCard
          label="Published"
          value={rows.filter((row) => row.status === "published").length}
          tone="positive"
        />
        <StatCard
          label="Rejected"
          value={rows.filter((row) => row.status === "rejected").length}
          tone="danger"
        />
        <StatCard
          label="Verified purchases"
          value={rows.filter((row) => row.verifiedPurchase).length}
        />
      </div>

      <ReviewModerationPanel csrfToken={csrfToken} rows={rows} />
    </>
  );
}
