import "server-only";

import { randomUUID } from "node:crypto";

import { STORE_CURRENCY, type Cents } from "@/lib/commerce/types";
import type {
  LedgerEntry,
  LedgerKind,
  Payout,
  PayoutStatus,
  SellerBalance,
} from "@/lib/marketplace/types";
import { sellerStore } from "@/lib/marketplace/seller-store";

/**
 * Seller earnings, withdrawals and transaction history.
 *
 * Every movement of money is a ledger entry — a sale credits, a commission
 * debits, a refund reverses both, a payout debits. Balances are never stored:
 * they are folded from the ledger, so a balance can always be explained by the
 * rows that produced it. That is the property an accountant asks for, and it
 * survives the move to a database unchanged.
 */

interface State {
  ledger: LedgerEntry[];
  payouts: Map<string, Payout>;
}

const globalForPayouts = globalThis as unknown as { __samruxPayouts?: State };

function state(): State {
  if (!globalForPayouts.__samruxPayouts) {
    globalForPayouts.__samruxPayouts = { ledger: [], payouts: new Map() };
  }
  return globalForPayouts.__samruxPayouts;
}

function entry(input: Omit<LedgerEntry, "id" | "createdAt" | "currency">): LedgerEntry {
  const record: LedgerEntry = {
    ...input,
    id: `led-${randomUUID().slice(0, 10)}`,
    currency: STORE_CURRENCY,
    createdAt: new Date().toISOString(),
  };
  state().ledger.unshift(record);
  return record;
}

export const ledger = {
  all(): LedgerEntry[] {
    return state().ledger;
  },

  forSeller(sellerId: string): LedgerEntry[] {
    return state().ledger.filter((row) => row.sellerId === sellerId);
  },

  /** Records a completed sale: the gross credit and the commission debit. */
  recordSale(input: {
    sellerId: string;
    gross: Cents;
    commission: Cents;
    orderId: string;
    orderReference: string;
    ruleLabel: string;
  }) {
    entry({
      sellerId: input.sellerId,
      kind: "sale",
      amount: input.gross,
      description: `Sale — ${input.orderReference}`,
      orderId: input.orderId,
      orderReference: input.orderReference,
    });

    if (input.commission > 0) {
      entry({
        sellerId: input.sellerId,
        kind: "commission",
        amount: -input.commission,
        description: `Commission — ${input.ruleLabel}`,
        orderId: input.orderId,
        orderReference: input.orderReference,
      });
    }
  },

  /** Reverses a sale when an order is refunded, commission included. */
  recordRefund(input: {
    sellerId: string;
    gross: Cents;
    commission: Cents;
    orderId: string;
    orderReference: string;
  }) {
    entry({
      sellerId: input.sellerId,
      kind: "refund",
      amount: -input.gross,
      description: `Refund — ${input.orderReference}`,
      orderId: input.orderId,
      orderReference: input.orderReference,
    });

    if (input.commission > 0) {
      entry({
        sellerId: input.sellerId,
        kind: "commission-reversal",
        amount: input.commission,
        description: `Commission returned — ${input.orderReference}`,
        orderId: input.orderId,
        orderReference: input.orderReference,
      });
    }
  },

  adjust(sellerId: string, amount: Cents, description: string) {
    return entry({ sellerId, kind: "adjustment", amount, description });
  },
};

/* -------------------------------------------------------------------------- */
/*  Balances                                                                   */
/* -------------------------------------------------------------------------- */

export function balanceFor(sellerId: string): SellerBalance {
  const rows = ledger.forSeller(sellerId);

  let lifetimeEarnings = 0;
  let lifetimeCommission = 0;
  let paidOut = 0;

  for (const row of rows) {
    switch (row.kind) {
      case "sale":
      case "refund":
      case "adjustment":
        lifetimeEarnings += row.amount;
        break;
      case "commission":
      case "commission-reversal":
        lifetimeEarnings += row.amount;
        lifetimeCommission -= row.amount;
        break;
      case "payout":
        paidOut += -row.amount;
        break;
    }
  }

  const pending = [...state().payouts.values()]
    .filter(
      (payout) =>
        payout.sellerId === sellerId &&
        (payout.status === "requested" || payout.status === "approved" || payout.status === "processing"),
    )
    .reduce((total, payout) => total + payout.amount, 0);

  return {
    lifetimeEarnings,
    lifetimeCommission,
    paidOut,
    pending,
    available: Math.max(0, lifetimeEarnings - paidOut - pending),
  };
}

/* -------------------------------------------------------------------------- */
/*  Payouts                                                                    */
/* -------------------------------------------------------------------------- */

/** Sellers cannot withdraw dust; below this it stays on the balance. */
export const MINIMUM_PAYOUT: Cents = 5000;

export const payoutStore = {
  all(): Payout[] {
    return [...state().payouts.values()].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  },

  forSeller(sellerId: string): Payout[] {
    return this.all().filter((payout) => payout.sellerId === sellerId);
  },

  find(id: string) {
    return state().payouts.get(id);
  },

  pending(): Payout[] {
    return this.all().filter(
      (payout) => payout.status === "requested" || payout.status === "approved",
    );
  },

  /**
   * A seller asks to be paid. The amount is checked against the ledger rather
   * than trusted from the form — a client cannot withdraw more than it earned.
   */
  request(sellerId: string, amount: Cents): { payout?: Payout; error?: string } {
    const seller = sellerStore.find(sellerId);
    if (!seller) return { error: "Unknown seller." };
    if (seller.status !== "approved") return { error: "Only approved sellers can withdraw." };

    const balance = balanceFor(sellerId);
    if (amount <= 0) return { error: "Enter an amount above zero." };
    if (amount < MINIMUM_PAYOUT) {
      return { error: `The minimum withdrawal is ${MINIMUM_PAYOUT / 100} ${STORE_CURRENCY}.` };
    }
    if (amount > balance.available) return { error: "That is more than your available balance." };
    if (!seller.banking) return { error: "Add payout details before requesting a withdrawal." };

    const id = `pay-${randomUUID().slice(0, 10)}`;
    const payout: Payout = {
      id,
      reference: `PO-${id.slice(-6).toUpperCase()}`,
      sellerId,
      amount,
      currency: STORE_CURRENCY,
      status: "requested",
      destination: seller.banking.walletAddress
        ? `${STORE_CURRENCY} · ${seller.banking.walletAddress.slice(0, 8)}…`
        : `Bank ending ${seller.banking.accountLast4}`,
      requestedAt: new Date().toISOString(),
    };

    state().payouts.set(id, payout);
    return { payout };
  },

  setStatus(
    id: string,
    status: PayoutStatus,
    options: { by?: string; note?: string; transactionRef?: string } = {},
  ): Payout | undefined {
    const payout = state().payouts.get(id);
    if (!payout) return undefined;

    const next: Payout = {
      ...payout,
      status,
      note: options.note ?? payout.note,
      processedBy: options.by ?? payout.processedBy,
      processedAt:
        status === "paid" || status === "rejected" ? new Date().toISOString() : payout.processedAt,
      transactionRef: options.transactionRef ?? payout.transactionRef,
    };

    state().payouts.set(id, next);

    // Only a settled payout leaves the ledger — a rejection never took money.
    if (status === "paid" && payout.status !== "paid") {
      const record: LedgerEntry = {
        id: `led-${randomUUID().slice(0, 10)}`,
        sellerId: payout.sellerId,
        kind: "payout" as LedgerKind,
        amount: -payout.amount,
        currency: STORE_CURRENCY,
        description: `Withdrawal ${payout.reference}`,
        payoutId: payout.id,
        createdAt: new Date().toISOString(),
      };
      state().ledger.unshift(record);
    }

    return next;
  },
};

/** Marketplace-wide totals for the admin dashboard. */
export function marketplaceEarnings() {
  const rows = ledger.all();

  const commission = rows
    .filter((row) => row.kind === "commission" || row.kind === "commission-reversal")
    .reduce((total, row) => total - row.amount, 0);

  const gross = rows
    .filter((row) => row.kind === "sale" || row.kind === "refund")
    .reduce((total, row) => total + row.amount, 0);

  const paidOut = rows
    .filter((row) => row.kind === "payout")
    .reduce((total, row) => total - row.amount, 0);

  const owed = sellerStore
    .approved()
    .reduce((total, seller) => total + balanceFor(seller.id).available, 0);

  return { gross, commission, paidOut, owed };
}
