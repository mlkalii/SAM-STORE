/**
 * Customer support conversations.
 *
 * SAMRUX sells directly, so a conversation has exactly two sides: the customer
 * and the SAMRUX support team. Nobody else sits in the middle,
 * and nothing here is ever published on a product page.
 */

export type MessageAuthorRole = "customer" | "support";

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
  /** Object-store key. Attachments are modelled but not yet persisted. */
  ref: string;
}

export interface Message {
  id: string;
  threadId: string;
  authorRole: MessageAuthorRole;
  authorId: string;
  authorName: string;
  body: string;
  attachments: MessageAttachment[];
  createdAt: string;
  readByCustomer: boolean;
  readBySupport: boolean;
}

/** What the customer is writing about. */
export type ThreadKind = "question" | "order" | "return" | "general";

export type ThreadStatus = "open" | "answered" | "closed";

export interface MessageThread {
  id: string;
  kind: ThreadKind;
  subject: string;
  customerId: string;
  customerName: string;
  productSlug?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  status: ThreadStatus;
}
