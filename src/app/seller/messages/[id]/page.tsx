import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminForm, CheckboxInput, TextArea } from "@/components/admin/form-shell";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { replyToThreadAction } from "@/app/actions/seller";
import { formatStoreDateTime } from "@/config/store";
import { requireSeller } from "@/lib/marketplace/auth";
import { messaging } from "@/lib/marketplace/messaging";
import { getCsrfToken } from "@/lib/auth/csrf";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

export default async function SellerThreadPage(props: PageProps<"/seller/messages/[id]">) {
  const { id } = await props.params;
  const { seller } = await requireSeller(`/seller/messages/${id}`);
  const csrfToken = await getCsrfToken();

  const thread = messaging.thread(id);
  // A seller may only open a conversation addressed to them.
  if (!thread || thread.sellerId !== seller.id) notFound();

  messaging.markRead(id, "seller");
  const messages = messaging.messages(id);

  return (
    <>
      <PageHeader
        title={thread.subject}
        description={`${thread.customerName} · ${thread.kind}`}
        breadcrumbs={[
          { label: "Seller", href: "/seller" },
          { label: "Messages", href: "/seller/messages" },
          { label: thread.subject },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {thread.visibility === "public" ? <Pill tone="info">public question</Pill> : null}
            <Pill tone={thread.status === "open" ? "warning" : "positive"}>{thread.status}</Pill>
          </div>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <Card bodyClassName="p-0">
            <ul className="divide-y">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "px-5 py-4",
                    message.authorRole === "seller" ? "bg-muted/40" : "",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{message.authorName}</span>
                    <Pill tone={message.authorRole === "seller" ? "gold" : "neutral"}>
                      {message.authorRole}
                    </Pill>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatStoreDateTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm">{message.body}</p>

                  {message.attachments.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {message.attachments.map((attachment) => (
                        <li
                          key={attachment.id}
                          className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                        >
                          {attachment.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Reply">
            <AdminForm
              action={replyToThreadAction}
              csrfToken={csrfToken}
              hidden={{ threadId: thread.id }}
              submitLabel="Send reply"
            >
              <TextArea name="body" label="Your reply" rows={5} required />
              <CheckboxInput
                name="makePublic"
                label="Publish on the product page"
                hint="Answered public questions help the next shopper"
                defaultChecked={thread.visibility === "public"}
              />
            </AdminForm>
          </Card>
        </div>

        <Card title="Context">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="text-right">{thread.customerName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Started</dt>
              <dd className="text-right text-xs">{formatStoreDateTime(thread.createdAt)}</dd>
            </div>
            {thread.productSlug ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Product</dt>
                <dd className="text-right">
                  <Link
                    href={`/seller/products/${thread.productSlug}`}
                    className="text-xs underline underline-offset-4"
                  >
                    {thread.productSlug}
                  </Link>
                </dd>
              </div>
            ) : null}
            {thread.orderId ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Order</dt>
                <dd className="text-right">
                  <Link
                    href={`/seller/orders/${thread.orderId}`}
                    className="text-xs underline underline-offset-4"
                  >
                    View order
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>
      </div>
    </>
  );
}
