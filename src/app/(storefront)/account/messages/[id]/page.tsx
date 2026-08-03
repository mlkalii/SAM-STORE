import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CustomerReplyForm } from "@/components/marketplace/customer-reply-form";
import { Panel } from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { formatStoreDateTime } from "@/config/store";
import { requireUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { messaging } from "@/lib/marketplace/messaging";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function AccountThreadPage(props: PageProps<"/account/messages/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/account/messages/${id}`);
  const csrfToken = await getCsrfToken();

  const thread = messaging.thread(id);
  // A customer may only open their own conversation.
  if (!thread || thread.customerId !== user.id) notFound();

  messaging.markRead(id, "customer");
  const messages = messaging.messages(id);
  const seller = sellerStore.find(thread.sellerId);

  return (
    <Panel
      title={thread.subject}
      description={seller ? `With ${seller.storeName}` : undefined}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/account/messages" />}>
          <ArrowLeft className="size-3.5" aria-hidden />
          All messages
        </Button>
      }
    >
      <ul className="space-y-4">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              "rounded-2xl border p-4",
              message.authorRole === "customer" ? "bg-surface" : "bg-card",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {message.authorRole === "customer" ? "You" : message.authorName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatStoreDateTime(message.createdAt)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{message.body}</p>
          </li>
        ))}
      </ul>

      {thread.status === "closed" ? (
        <p className="mt-6 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          This conversation is closed. Start a new one from the seller&rsquo;s storefront if you
          need anything else.
        </p>
      ) : (
        <div className="mt-6">
          <CustomerReplyForm csrfToken={csrfToken} threadId={thread.id} />
        </div>
      )}

      {seller ? (
        <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          Sold by{" "}
          <Link href={`/sellers/${seller.slug}`} className="underline underline-offset-4">
            {seller.storeName}
          </Link>
          . Marketplace support handles refunds and disputes.
        </p>
      ) : null}
    </Panel>
  );
}
