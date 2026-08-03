import "server-only";

import { randomUUID } from "node:crypto";

/**
 * Notification service.
 *
 * A single append-only feed per customer, written by whichever part of the
 * domain caused the event — orders, price watching, stock, promotions. The
 * account UI reads it; nothing else writes to a user's notification array
 * directly, so the shape stays consistent.
 */

export type NotificationKind = "order" | "price" | "stock" | "promo" | "account";

export interface CommerceNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

const globalForNotifications = globalThis as unknown as {
  __samruxNotifications?: CommerceNotification[];
};

function state() {
  if (!globalForNotifications.__samruxNotifications) {
    globalForNotifications.__samruxNotifications = [];
  }
  return globalForNotifications.__samruxNotifications;
}

export const notifications = {
  push(
    userId: string,
    input: { kind: NotificationKind; title: string; body: string; href?: string },
  ) {
    state().unshift({
      id: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      read: false,
      ...input,
    });
  },

  forUser(userId: string) {
    return state().filter((notification) => notification.userId === userId);
  },

  unreadCount(userId: string) {
    return state().filter((n) => n.userId === userId && !n.read).length;
  },

  markAllRead(userId: string) {
    for (const notification of state()) {
      if (notification.userId === userId) notification.read = true;
    }
  },

  /** Fired when a watched product drops in price. */
  priceDrop(userId: string, name: string, slug: string, from: number, to: number) {
    notifications.push(userId, {
      kind: "price",
      title: `${name} is down to $${(to / 100).toFixed(2)}`,
      body: `Was $${(from / 100).toFixed(2)} — a saving of $${((from - to) / 100).toFixed(2)}.`,
      href: `/shop/${slug}`,
    });
  },

  /** Fired when a wishlisted product comes back into stock. */
  backInStock(userId: string, name: string, slug: string) {
    notifications.push(userId, {
      kind: "stock",
      title: `${name} is back in stock`,
      body: "Saved items sell out again quickly.",
      href: `/shop/${slug}`,
    });
  },

  promotion(userId: string, title: string, body: string) {
    notifications.push(userId, { kind: "promo", title, body, href: "/deals" });
  },
};
