import type { Metadata } from "next";
import { Bell } from "lucide-react";

import { EmptyState, Panel } from "@/components/account/account-ui";
import { MarkAllRead } from "@/components/account/mark-all-read";
import { requireUser } from "@/lib/auth";
import { notifications as commerceNotifications } from "@/lib/commerce/notifications";
import { getCsrfToken } from "@/lib/auth/csrf";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function NotificationsPage() {
  const user = await requireUser();
  const csrfToken = await getCsrfToken();
  // Two sources — account events (sign-up, verification) and commerce events
  // (orders, price drops, stock) — merged newest first into one feed.
  const feed = [
    ...user.notifications.map((notification) => ({ ...notification, href: undefined as string | undefined })),
    ...commerceNotifications.forUser(user.id),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const unread = feed.filter((notification) => !notification.read).length;

  return (
    <Panel
      title="Notifications"
      description={unread > 0 ? `${unread} unread` : "You are all caught up."}
      action={unread > 0 ? <MarkAllRead csrfToken={csrfToken} /> : undefined}
    >
      {feed.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          description="Order updates, price drops and restock notices will appear here."
        />
      ) : (
        <ul className="divide-y">
          {feed.map((notification) => (
            <li
              key={notification.id}
              className={cn("flex gap-3 py-4 first:pt-0", !notification.read && "font-medium")}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  notification.read ? "bg-muted" : "bg-gold",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{notification.title}</p>
                <p className="mt-1 text-sm font-normal text-muted-foreground">
                  {notification.body}
                </p>
                <time
                  dateTime={notification.createdAt}
                  className="mt-1.5 block text-xs font-normal text-muted-foreground"
                >
                  {dateFormat.format(new Date(notification.createdAt))}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
