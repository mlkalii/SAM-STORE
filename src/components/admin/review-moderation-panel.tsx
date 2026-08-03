"use client";

import { BadgeCheck, Star } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { moderateReviewAction } from "@/app/actions/admin";
import { Card, EmptyState, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_FIELD } from "@/config/auth";
import { formatStoreDateTime } from "@/config/store";

export interface ReviewRow {
  id: string;
  target: "product" | "seller";
  targetId: string;
  sellerId: string;
  sellerName: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  status: string;
  createdAt: string;
  moderatedBy?: string;
  moderationNote?: string;
  reply?: string;
}

const statusTone: Record<string, "positive" | "warning" | "danger"> = {
  published: "positive",
  pending: "warning",
  rejected: "danger",
};

const FILTERS = ["pending", "published", "rejected", "all"] as const;

export function ReviewModerationPanel({
  csrfToken,
  rows,
}: {
  csrfToken: string;
  rows: ReviewRow[];
}) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("pending");
  const [rejecting, setRejecting] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function decide(id: string, status: string, reason?: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", id);
      form.set("status", status);
      if (reason) form.set("note", reason);

      const result = await moderateReviewAction(undefined as never, form);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        setRejecting(null);
        setNote("");
      } else {
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  const visible = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <Card
      title={`${visible.length} reviews`}
      bodyClassName="p-0"
      actions={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((entry) => (
            <Button
              key={entry}
              size="sm"
              variant={filter === entry ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs capitalize"
              onClick={() => setFilter(entry)}
            >
              {entry}
            </Button>
          ))}
        </div>
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Star}
            title={filter === "pending" ? "Nothing waiting" : "No reviews"}
            description={
              filter === "pending"
                ? "The moderation queue is empty."
                : "Reviews appear here as customers submit them."
            }
          />
        </div>
      ) : (
        <ul className="divide-y">
          {visible.map((row) => (
            <li key={row.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium tabular-nums">{row.rating}★</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.title}</span>
                {row.verifiedPurchase ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    verified
                  </span>
                ) : null}
                <Pill tone={statusTone[row.status] ?? "neutral"}>{row.status}</Pill>
              </div>

              <p className="mt-1.5 text-sm text-muted-foreground">{row.body}</p>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{row.authorName}</span>
                <span aria-hidden>·</span>
                <span>{formatStoreDateTime(row.createdAt)}</span>
                <span aria-hidden>·</span>
                {row.target === "product" ? (
                  <Link href={`/shop/${row.targetId}`} className="underline underline-offset-4">
                    {row.targetId}
                  </Link>
                ) : (
                  <span>store review</span>
                )}
                <span aria-hidden>·</span>
                <Link
                  href={`/admin/sellers/${row.sellerId}`}
                  className="underline underline-offset-4"
                >
                  {row.sellerName}
                </Link>
              </p>

              {row.reply ? (
                <p className="mt-2 rounded-lg border-l-2 border-gold bg-muted/40 p-2.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{row.sellerName} replied:</span>{" "}
                  {row.reply}
                </p>
              ) : null}

              {row.moderationNote ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Moderation note: {row.moderationNote}
                  {row.moderatedBy ? ` — ${row.moderatedBy}` : ""}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {row.status !== "published" ? (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={pending}
                    onClick={() => decide(row.id, "published")}
                  >
                    Publish
                  </Button>
                ) : null}
                {row.status !== "rejected" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setRejecting(row.id)}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>

              {rejecting === row.id ? (
                <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border p-3">
                  <Input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Why is this being rejected?"
                    aria-label={`Reason for rejecting ${row.title}`}
                    className="h-8 min-w-52 flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs"
                    disabled={pending || !note.trim()}
                    onClick={() => decide(row.id, "rejected", note)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setRejecting(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
