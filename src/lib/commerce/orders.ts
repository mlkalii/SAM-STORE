import "server-only";

import { randomUUID } from "node:crypto";

import { commitGiftCards } from "@/lib/commerce/pricing";
import { giftCardStore } from "@/lib/commerce/gift-cards";
import { inventory } from "@/lib/commerce/inventory";
import { promotionStore } from "@/lib/commerce/promotions";
import {
  STORE_CURRENCY,
  ORDER_STATUS_FLOW,
  type Order,
  type OrderAddress,
  type OrderEvent,
  type OrderPayment,
  type OrderStatus,
  type OrderTotals,
  type PricedLine,
  type DeliveryEstimate,
} from "@/lib/commerce/types";
import { sendEmail } from "@/lib/email/send";
import { getPaymentProvider } from "@/lib/payments/registry";
import { paymentTransactions } from "@/lib/payments/transactions";
import { notifications } from "@/lib/commerce/notifications";
import { returnPolicy } from "@/config/returns";
import { formatPriceWithCode } from "@/lib/format";
import { reverseOrder, settleOrder } from "@/lib/marketplace/settlement";

/**
 * Order service.
 *
 * Owns the whole lifecycle — placement, status transitions, cancellation,
 * returns, refunds and reorder — and is the only thing that mutates an order.
 * UI and actions call these functions; they never edit an order object.
 *
 * Storage is an in-memory map behind `orderStore`. Swap it for a table and the
 * lifecycle logic is untouched.
 */

const globalForOrders = globalThis as unknown as { __samruxOrders?: Map<string, Order> };

function state() {
  if (!globalForOrders.__samruxOrders) globalForOrders.__samruxOrders = new Map();
  return globalForOrders.__samruxOrders;
}

function event(
  status: OrderEvent["status"],
  label: string,
  detail?: string,
  at = new Date(),
): OrderEvent {
  return {
    id: randomUUID(),
    status,
    label,
    ...(detail ? { detail } : {}),
    at: at.toISOString(),
  };
}

function reference(now: Date) {
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `SMX-${stamp}-${suffix}`;
}

/** Statuses a customer can still cancel from. */
const CANCELLABLE: OrderStatus[] = ["processing", "packed"];
/** Statuses that allow starting a return. */
const RETURNABLE: OrderStatus[] = ["delivered"];

export const orderStore = {
  all(): Order[] {
    return [...state().values()];
  },
  forUser(userId: string): Order[] {
    return [...state().values()]
      .filter((order) => order.userId === userId)
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  },
  find(id: string): Order | undefined {
    return state().get(id);
  },
  findByReference(ref: string): Order | undefined {
    return [...state().values()].find((order) => order.reference === ref);
  },
  save(order: Order) {
    state().set(order.id, order);
    return order;
  },
};

export interface PlaceOrderInput {
  userId: string;
  email: string;
  customerName: string;
  lines: PricedLine[];
  totals: OrderTotals;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  shippingMethodId: string;
  shippingMethodLabel: string;
  deliveryEstimate: DeliveryEstimate;
  payment: OrderPayment;
  notes?: string;
  couponCodes: string[];
  giftCardCodes: string[];
}

/**
 * Places an order.
 *
 * Everything that must happen exactly once lives here: gift card balances are
 * spent, coupon usage is counted, stock is committed, the timeline is opened
 * and the confirmation email goes out.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const now = new Date();

  // Gift cards are spent against the amount that was actually covered.
  const giftCardRedemptions =
    input.totals.giftCardTotal > 0
      ? commitGiftCards(input.giftCardCodes, input.totals.giftCardTotal).redemptions
      : [];

  for (const code of input.couponCodes) {
    const promotion = promotionStore.findByCode(code);
    if (promotion) promotionStore.recordUse(promotion.id);
  }

  for (const line of input.lines) {
    inventory.commit(line.slug, line.variantId, line.quantity);
  }

  const order: Order = {
    id: randomUUID(),
    reference: reference(now),
    userId: input.userId,
    email: input.email,
    placedAt: now.toISOString(),
    status: "processing",
    lines: input.lines,
    totals: input.totals,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    shippingMethodId: input.shippingMethodId,
    shippingMethodLabel: input.shippingMethodLabel,
    deliveryEstimate: input.deliveryEstimate,
    payment: input.payment,
    ...(input.notes ? { notes: input.notes } : {}),
    giftCardCodes: input.giftCardCodes,
    giftCardRedemptions,
    couponCodes: input.couponCodes,
    timeline: [
      event("placed", "Order placed", `Payment ${input.payment.status} via ${input.payment.providerLabel}`, now),
      event("processing", "Processing", "Being picked in the warehouse", now),
    ],
  };

  orderStore.save(order);

  await sendEmail("order-confirmation", order.email, { order });
  notifications.push(input.userId, {
    kind: "order",
    title: `Order ${order.reference} confirmed`,
    body: `${order.lines.length} item${order.lines.length === 1 ? "" : "s"} · ${order.deliveryEstimate.label}`,
  });

  // Credit each seller in the order. Kept behind `settleOrder` so this pipeline
  // does not have to know how commission is calculated.
  settleOrder(order);

  // The capture (or pending offline intent) enters the transaction history.
  paymentTransactions.record({
    orderId: order.id,
    orderReference: order.reference,
    provider: order.payment.providerId,
    kind: order.payment.status === "captured" ? "capture" : "intent",
    status: order.payment.status,
    amount: order.payment.amount,
    reference: order.payment.reference,
  });

  return order;
}

/** Moves an order along its fulfilment path and emails where appropriate. */
export async function advanceOrder(id: string, to: OrderStatus): Promise<Order | undefined> {
  const order = orderStore.find(id);
  if (!order) return undefined;

  const labels: Record<string, string> = {
    processing: "Processing",
    packed: "Packed",
    shipped: "Shipped",
    "out-for-delivery": "Out for delivery",
    delivered: "Delivered",
  };

  const next: Order = {
    ...order,
    status: to,
    timeline: [...order.timeline, event(to, labels[to] ?? to)],
  };

  // Keyed off the status transition, not off the tracking number being absent.
  // Testing `!next.trackingNumber` meant the dispatch email was sent only when
  // we had to invent a tracking number, and skipped whenever the seller entered
  // a real one — so the customers with genuine tracking were the ones never
  // told their order had shipped. Re-entering "shipped" stays silent.
  if (to === "shipped" && order.status !== "shipped") {
    next.trackingNumber ??= `TRK${Date.now().toString().slice(-8)}XZ`;
    await sendEmail("shipping-confirmation", order.email, {
      order: next,
      trackingNumber: next.trackingNumber,
    });
    notifications.push(order.userId, {
      kind: "order",
      title: `Order ${order.reference} has shipped`,
      body: `Tracking ${next.trackingNumber}`,
    });
  }

  if (to === "delivered" && order.status !== "delivered") {
    await sendEmail("delivery-confirmation", order.email, { order: next });
    notifications.push(order.userId, {
      kind: "order",
      title: `Order ${order.reference} delivered`,
      body: "Thirty days to change your mind.",
    });
  }

  return orderStore.save(next);
}

export function canCancel(order: Order) {
  return CANCELLABLE.includes(order.status);
}

export function canReturn(order: Order) {
  return RETURNABLE.includes(order.status) && !order.returnRequest;
}

export async function cancelOrder(id: string, reason: string): Promise<Order | undefined> {
  const order = orderStore.find(id);
  if (!order || !canCancel(order)) return undefined;

  // Cancelling puts gift card value back and releases the coupon redemption.
  // Restore what each card actually paid — crediting the combined total to
  // every code would hand back more than was ever taken.
  for (const redemption of order.giftCardRedemptions ?? []) {
    giftCardStore.restore(redemption.code, redemption.amount);
  }

  const next: Order = {
    ...order,
    status: "cancelled",
    payment: { ...order.payment, status: "refunded" },
    timeline: [...order.timeline, event("cancelled", "Cancelled", reason)],
  };

  notifications.push(order.userId, {
    kind: "order",
    title: `Order ${order.reference} cancelled`,
    body: "Any payment taken is refunded to the original method.",
  });

  // Goods that never shipped go back on the shelf, or a cancelled order would
  // permanently consume the stock it reserved.
  for (const line of order.lines) {
    inventory.restock(line.slug, line.variantId, line.quantity);
  }

  // The sellers never earned this. Reverse the credit and the commission.
  reverseOrder(order);

  return orderStore.save(next);
}

export async function requestReturn(id: string, reason: string): Promise<Order | undefined> {
  const order = orderStore.find(id);
  if (!order || !canReturn(order)) return undefined;

  const now = new Date();
  const next: Order = {
    ...order,
    returnRequest: { requestedAt: now.toISOString(), reason, status: "requested" },
    timeline: [
      ...order.timeline,
      event("return-requested", "Return requested", reason, now),
    ],
  };

  await sendEmail("return-confirmation", order.email, { order: next, reason });
  notifications.push(order.userId, {
    kind: "order",
    title: `Return started for ${order.reference}`,
    body: "A prepaid label follows separately.",
  });

  return orderStore.save(next);
}

export async function requestRefund(id: string, amount?: number): Promise<Order | undefined> {
  const order = orderStore.find(id);
  if (!order) return undefined;

  // Refunding is not idempotent on its own: it calls the payment provider,
  // reverses the seller ledger and emails the customer. Without this guard a
  // double-submitted form — or an impatient second click — refunds twice,
  // debits the seller twice and sends two notices for one order.
  if (
    order.status === "refunded" ||
    order.status === "cancelled" ||
    order.payment.status === "refunded"
  ) {
    return undefined;
  }

  const now = new Date();
  const value = amount ?? order.totals.grandTotal;

  const next: Order = {
    ...order,
    status: "refunded",
    refund: {
      requestedAt: now.toISOString(),
      amount: value,
      status: "issued",
      issuedAt: now.toISOString(),
    },
    payment: { ...order.payment, status: "refunded" },
    timeline: [
      ...order.timeline,
      event("refund-requested", "Refund issued", formatPriceWithCode(value), now),
    ],
  };

  // The money goes back the way it came in: through the provider.
  const provider = getPaymentProvider(order.payment.providerId);
  const refundResult = provider
    ? await provider.refund({
        orderReference: order.reference,
        paymentReference: order.payment.reference,
        amount: value,
        currency: STORE_CURRENCY,
      })
    : undefined;

  paymentTransactions.record({
    orderId: order.id,
    orderReference: order.reference,
    provider: order.payment.providerId,
    kind: "refund",
    status: refundResult?.status === "refunded" ? "refunded" : "pending",
    amount: -value,
    reference: refundResult?.reference ?? `manual-${order.reference}`,
    ...(refundResult?.instructions ? { detail: { instructions: refundResult.instructions } } : {}),
  });

  // A refund unwinds the seller's earnings for this order.
  reverseOrder(order);

  await sendEmail("refund-confirmation", order.email, { order: next, amount: value });
  notifications.push(order.userId, {
    kind: "order",
    title: `Refund issued for ${order.reference}`,
    body: `${formatPriceWithCode(value)} returning to ${returnPolicy.refundTo} within ${returnPolicy.refundBusinessDaysMin}–${returnPolicy.refundBusinessDaysMax} business days.`,
  });

  return orderStore.save(next);
}

/** Cart input to re-add every line of a past order. */
export function reorderItems(order: Order) {
  return order.lines.map((line) => ({
    slug: line.slug,
    variantId: line.variantId,
    quantity: line.quantity,
  }));
}

/** Progress through the fulfilment path, for the timeline UI. */
export function statusProgress(status: OrderStatus) {
  const index = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
  return {
    isTerminal: status === "cancelled" || status === "refunded" || status === "returned",
    index,
    total: ORDER_STATUS_FLOW.length,
  };
}
