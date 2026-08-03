import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { EmptyState, Panel } from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { formatStoreDateTime } from "@/config/store";
import { requireUser } from "@/lib/auth";
import { messaging } from "@/lib/marketplace/messaging";
import { sellerStore } from "@/lib/marketplace/seller-store";

export const metadata: Metadata = { title: "Messages" };

export default async function AccountMessagesPage() {
  const user = await requireUser("/account/messages");
  const threads = messaging.forCustomer(user.id);

  return (
    <Panel
      title="Messages"
      description="Your conversations with sellers about products, orders and returns."
    >
      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Ask a seller a question from any product page or storefront."
          action={<Button render={<Link href="/sellers" />}>Browse sellers</Button>}
        />
      ) : (
        <ul className="divide-y rounded-2xl border">
          {threads.map((thread) => {
            const seller = sellerStore.find(thread.sellerId);
            const last = messaging.lastMessage(thread.id);
            const unread = messaging
              .messages(thread.id)
              .some((message) => !message.readByCustomer);

            return (
              <li key={thread.id}>
                <Link
                  href={`/account/messages/${thread.id}`}
                  className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{thread.subject}</span>
                      {unread ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-gold" aria-label="Unread" />
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {seller?.storeName ?? "Seller"}
                      {last ? ` · ${last.body.slice(0, 90)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatStoreDateTime(thread.updatedAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
