import "server-only";

import { randomUUID } from "node:crypto";

import type {
  Message,
  MessageAttachment,
  MessageAuthorRole,
  MessageThread,
  ThreadKind,
} from "@/lib/marketplace/types";

/**
 * Customer-to-seller messaging.
 *
 * A thread belongs to exactly one customer and one seller; messages hang off
 * it. Public question threads surface on the product page once the seller has
 * answered, which is why `visibility` lives on the thread rather than the
 * message — a conversation is public or it is not.
 *
 * Attachments are modelled but not stored: `MessageAttachment.ref` is the key
 * an object store would return. Wiring an upload endpoint is the only change
 * needed to make them real.
 */

interface State {
  threads: Map<string, MessageThread>;
  messages: Message[];
}

const globalForMessaging = globalThis as unknown as { __samruxMessaging?: State };

function state(): State {
  if (!globalForMessaging.__samruxMessaging) {
    globalForMessaging.__samruxMessaging = { threads: new Map(), messages: [] };
  }
  return globalForMessaging.__samruxMessaging;
}

export interface StartThreadInput {
  kind: ThreadKind;
  subject: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  productSlug?: string;
  orderId?: string;
  visibility?: "private" | "public";
  body: string;
  attachments?: MessageAttachment[];
}

export const messaging = {
  threads(): MessageThread[] {
    return [...state().threads.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  thread(id: string) {
    return state().threads.get(id);
  },

  forCustomer(customerId: string) {
    return this.threads().filter((thread) => thread.customerId === customerId);
  },

  forSeller(sellerId: string) {
    return this.threads().filter((thread) => thread.sellerId === sellerId);
  },

  /** Answered public questions, shown on a product page. */
  publicQuestions(productSlug: string) {
    return this.threads().filter(
      (thread) =>
        thread.productSlug === productSlug &&
        thread.visibility === "public" &&
        thread.status === "answered",
    );
  },

  messages(threadId: string): Message[] {
    return state()
      .messages.filter((message) => message.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  lastMessage(threadId: string): Message | undefined {
    const all = this.messages(threadId);
    return all[all.length - 1];
  },

  start(input: StartThreadInput): MessageThread {
    const now = new Date().toISOString();
    const id = `thr-${randomUUID().slice(0, 10)}`;

    const thread: MessageThread = {
      id,
      kind: input.kind,
      subject: input.subject,
      customerId: input.customerId,
      customerName: input.customerName,
      sellerId: input.sellerId,
      productSlug: input.productSlug,
      orderId: input.orderId,
      createdAt: now,
      updatedAt: now,
      status: "open",
      visibility: input.visibility ?? "private",
    };

    state().threads.set(id, thread);

    this.reply({
      threadId: id,
      authorRole: "customer",
      authorId: input.customerId,
      authorName: input.customerName,
      body: input.body,
      attachments: input.attachments,
    });

    return thread;
  },

  reply(input: {
    threadId: string;
    authorRole: MessageAuthorRole;
    authorId: string;
    authorName: string;
    body: string;
    attachments?: MessageAttachment[];
  }): Message | undefined {
    const thread = state().threads.get(input.threadId);
    if (!thread) return undefined;

    const message: Message = {
      id: `msg-${randomUUID().slice(0, 10)}`,
      threadId: input.threadId,
      authorRole: input.authorRole,
      authorId: input.authorId,
      authorName: input.authorName,
      body: input.body,
      attachments: input.attachments ?? [],
      createdAt: new Date().toISOString(),
      // The author has by definition read their own message.
      readByCustomer: input.authorRole === "customer",
      readBySeller: input.authorRole === "seller",
    };

    state().messages.push(message);

    state().threads.set(thread.id, {
      ...thread,
      updatedAt: message.createdAt,
      // A seller reply answers the thread; a customer reply reopens it.
      status: input.authorRole === "customer" ? "open" : "answered",
    });

    return message;
  },

  markRead(threadId: string, role: MessageAuthorRole) {
    state().messages = state().messages.map((message) =>
      message.threadId === threadId
        ? {
            ...message,
            readByCustomer: role === "customer" ? true : message.readByCustomer,
            readBySeller: role === "seller" ? true : message.readBySeller,
          }
        : message,
    );
  },

  close(threadId: string) {
    const thread = state().threads.get(threadId);
    if (!thread) return undefined;
    const next: MessageThread = { ...thread, status: "closed" };
    state().threads.set(threadId, next);
    return next;
  },

  setVisibility(threadId: string, visibility: "private" | "public") {
    const thread = state().threads.get(threadId);
    if (!thread) return undefined;
    const next: MessageThread = { ...thread, visibility };
    state().threads.set(threadId, next);
    return next;
  },

  unreadFor(role: "customer" | "seller", id: string) {
    const threads =
      role === "customer" ? this.forCustomer(id) : this.forSeller(id);
    const ids = new Set(threads.map((thread) => thread.id));

    return state().messages.filter(
      (message) =>
        ids.has(message.threadId) &&
        (role === "customer" ? !message.readByCustomer : !message.readBySeller),
    ).length;
  },
};
