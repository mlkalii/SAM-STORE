"use client";

import * as React from "react";
import { toast } from "sonner";

import { replyToReviewAction } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";

/**
 * A public reply to a review.
 *
 * Collapsed by default: a list of twenty reviews should not be a wall of empty
 * textareas.
 */
export function SellerReviewReply({
  csrfToken,
  reviewId,
}: {
  csrfToken: string;
  reviewId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
        Reply publicly
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`reply-${reviewId}`} className="sr-only">
        Your reply
      </label>
      <textarea
        id={`reply-${reviewId}`}
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Thanks for the feedback…"
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={pending || !body.trim()}
          onClick={() =>
            startTransition(async () => {
              const form = new FormData();
              form.set(CSRF_FIELD, csrfToken);
              form.set("reviewId", reviewId);
              form.set("body", body);

              const result = await replyToReviewAction(undefined as never, form);
              if (result.ok) {
                toast.success(result.message ?? "Reply published");
                setOpen(false);
                setBody("");
              } else {
                toast.error(result.message ?? "That did not work");
              }
            })
          }
        >
          Publish reply
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
