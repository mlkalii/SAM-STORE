import "server-only";

import { randomUUID } from "node:crypto";

import type {
  Message,
  MessageAttachment,
  MessageAuthorRole,
  MessageThread,
  ThreadKind,
} from "@/lib/support/types";

/**
 * Customer support messaging.
 *
 * A thread belongs to one customer and is answered by the SAMRUX support team.
 * Threads are private: nothing written here is ever rendered on a product page
 * or anywhere else public.
 *
 * Attachments are modelled but not stored — `MessageAttachment.ref` is the key
 * an object store would return. Wiring an upload endpoint is the only change
 * needed to make them real.
 */

interface State {
  threads: Map<string, MessageThread>;
  messages: Message[];
}

const globalForMessaging = globalThis as unknown as { __samruxSupport?: State };

function state(): State {
  if (!globalForMessaging.__samruxSupport) {
    globalForMessaging.__samruxSupport = { threads: new Map(), messages: [] };
  }
  return globalForMessaging.__samruxSupport;
}

export interface StartThreadInput {
  kind: ThreadKind;
  subject: string;
  customerId: string;
  customerName: string;
  productSlug?: string;
  orderId?: string;
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
      productSlug: input.productSlug,
      orderId: input.orderId,
      createdAt: now,
      updatedAt: now,
      status: "open",
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
      readBySupport: input.authorRole === "support",
    };

    state().messages.push(message);

    state().threads.set(thread.id, {
      ...thread,
      updatedAt: message.createdAt,
      // A support reply answers the thread; a customer reply reopens it.
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
            readBySupport: role === "support" ? true : message.readBySupport,
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

  unreadFor(role: MessageAuthorRole, id: string) {
    const threads = role === "customer" ? this.forCustomer(id) : this.threads();
    const ids = new Set(threads.map((thread) => thread.id));

    return state().messages.filter(
      (message) =>
        ids.has(message.threadId) &&
        (role === "customer" ? !message.readByCustomer : !message.readBySupport),
    ).length;
  },
};
