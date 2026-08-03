import "server-only";

import type { Order } from "@/lib/commerce/types";
import { commissionFor, splitBySeller } from "@/lib/marketplace/commission";
import { ledger } from "@/lib/marketplace/payouts";
import type { CommissionBreakdown } from "@/lib/marketplace/types";

/**
 * Turns an order into seller earnings.
 *
 * Called once when an order is placed and once more if it is refunded, so the
 * ledger is the complete history of what each seller is owed. Splitting happens
 * here rather than in the order pipeline: `placeOrder` should not have to know
 * that a marketplace exists.
 */

export interface SellerShare {
  sellerId: string;
  lines: Order["lines"];
  breakdown: CommissionBreakdown;
}

/** How an order divides between the sellers that fulfil it. */
export function shareOf(order: Order): SellerShare[] {
  return [...splitBySeller(order.lines).entries()].map(([sellerId, lines]) => ({
    sellerId,
    lines,
    breakdown: commissionFor(sellerId, lines),
  }));
}

/** Credits every seller in a newly placed order. */
export function settleOrder(order: Order) {
  for (const share of shareOf(order)) {
    ledger.recordSale({
      sellerId: share.sellerId,
      gross: share.breakdown.gross,
      commission: share.breakdown.commission,
      orderId: order.id,
      orderReference: order.reference,
      ruleLabel: share.breakdown.ruleLabel,
    });
  }
}

/** Reverses an order — cancellation or refund — commission included. */
export function reverseOrder(order: Order) {
  for (const share of shareOf(order)) {
    ledger.recordRefund({
      sellerId: share.sellerId,
      gross: share.breakdown.gross,
      commission: share.breakdown.commission,
      orderId: order.id,
      orderReference: order.reference,
    });
  }
}

/** Every order a seller has a line in, newest first. */
export function ordersForSeller(orders: Order[], sellerId: string): Order[] {
  return orders
    .filter((order) => order.lines.some((line) => (line.sellerId ?? "samrux-house") === sellerId))
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

/** Only the lines in an order that belong to one seller. */
export function linesForSeller(order: Order, sellerId: string) {
  return order.lines.filter((line) => (line.sellerId ?? "samrux-house") === sellerId);
}

/** What one seller earned from one order, net of commission. */
export function orderValueForSeller(order: Order, sellerId: string) {
  return commissionFor(sellerId, linesForSeller(order, sellerId));
}
