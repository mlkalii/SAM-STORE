"use client";

import * as React from "react";
import { toast } from "sonner";

import { replyAsCustomerAction } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CSRF_FIELD } from "@/config/auth";

export function CustomerReplyForm({
  csrfToken,
  threadId,
}: {
  csrfToken: string;
  threadId: string;
}) {
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="space-y-3">
      <Label htmlFor="customer-reply">Your reply</Label>
      <textarea
        id="customer-reply"
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        disabled={pending || !body.trim()}
        onClick={() =>
          startTransition(async () => {
            const form = new FormData();
            form.set(CSRF_FIELD, csrfToken);
            form.set("threadId", threadId);
            form.set("body", body);

            const result = await replyAsCustomerAction(undefined as never, form);
            if (result.ok) {
              toast.success(result.message ?? "Sent");
              setBody("");
            } else {
              toast.error(result.message ?? "That did not work");
            }
          })
        }
      >
        {pending ? "Sending…" : "Send reply"}
      </Button>
    </div>
  );
}
