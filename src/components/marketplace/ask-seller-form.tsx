"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { askSellerAction } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CSRF_FIELD } from "@/config/auth";

/**
 * Customer-to-seller question form.
 *
 * Used on both the storefront and the product page; `productSlug` decides
 * whether the thread is filed against a product, which is what makes a public
 * answer appear there later.
 */
export function AskSellerForm({
  csrfToken,
  sellerId,
  sellerName,
  signedIn,
  productSlug,
  compact = false,
}: {
  csrfToken: string;
  sellerId: string;
  sellerName: string;
  signedIn: boolean;
  productSlug?: string;
  compact?: boolean;
}) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(Boolean(productSlug));
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Sign in to message {sellerName} directly.
        </p>
        <Button className="mt-4" render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-6">
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          Question sent to {sellerName}. You will be notified when they reply, and the
          conversation is in{" "}
          <Link href="/account/messages" className="underline underline-offset-4">
            your messages
          </Link>
          .
        </p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSent(false)}>
          Ask another question
        </Button>
      </div>
    );
  }

  function send() {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("sellerId", sellerId);
      form.set("subject", subject || `Question for ${sellerName}`);
      form.set("body", body);
      if (productSlug) form.set("productSlug", productSlug);
      if (isPublic) form.set("public", "on");

      const result = await askSellerAction(undefined as never, form);
      if (result.ok) {
        toast.success(result.message ?? "Sent");
        setSent(true);
        setSubject("");
        setBody("");
      } else {
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border p-5">
      {compact ? null : (
        <div className="space-y-1.5">
          <Label htmlFor="ask-subject">Subject</Label>
          <Input
            id="ask-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Does this ship to Alaska?"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="ask-body">Your question</Label>
        <textarea
          id="ask-body"
          rows={compact ? 3 : 5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={`Ask ${sellerName} anything about their products, shipping or returns.`}
          className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {productSlug ? (
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="mt-0.5 size-3.5 rounded-[3px] border-input accent-foreground"
          />
          <span className="text-muted-foreground">
            Show this question and its answer on the product page — it usually gets a faster reply.
          </span>
        </label>
      ) : null}

      <Button disabled={pending || !body.trim()} onClick={send}>
        {pending ? "Sending…" : "Send question"}
      </Button>
    </div>
  );
}
