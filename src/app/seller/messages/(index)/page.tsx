import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Card, EmptyState, PageHeader, Pill, StatCard } from "@/components/admin/ui";
import { formatStoreDateTime } from "@/config/store";
import { requireSeller } from "@/lib/marketplace/auth";
import { messaging } from "@/lib/marketplace/messaging";

export const metadata: Metadata = { title: "Messages" };

const statusTone: Record<string, "warning" | "positive" | "neutral"> = {
  open: "warning",
  answered: "positive",
  closed: "neutral",
};

export default async function SellerMessagesPage() {
  const { seller } = await requireSeller("/seller/messages");
  const threads = messaging.forSeller(seller.id);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Questions from customers about your products and orders."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Messages" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversations" value={threads.length} />
        <StatCard
          label="Waiting on you"
          value={threads.filter((thread) => thread.status === "open").length}
          tone="warning"
        />
        <StatCard
          label="Public questions"
          value={threads.filter((thread) => thread.visibility === "public").length}
        />
        <StatCard label="Unread" value={messaging.unreadFor("seller", seller.id)} tone="info" />
      </div>

      <Card bodyClassName="p-0">
        {threads.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={MessageSquare}
              title="No messages"
              description="Customers can ask a question from any of your product pages."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {threads.map((thread) => {
              const last = messaging.lastMessage(thread.id);

              return (
                <li key={thread.id}>
                  <Link
                    href={`/seller/messages/${thread.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{thread.subject}</span>
                        {thread.visibility === "public" ? <Pill tone="info">public</Pill> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {thread.customerName}
                        {last ? ` · ${last.body.slice(0, 80)}` : ""}
                      </p>
                    </div>
                    <Pill tone={statusTone[thread.status] ?? "neutral"}>{thread.status}</Pill>
                    <span className="text-xs text-muted-foreground">
                      {formatStoreDateTime(thread.updatedAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
