import "server-only";

import { randomUUID } from "node:crypto";

import { STORE_CURRENCY, type Cents, type StoreCurrency } from "@/lib/commerce/types";

/**
 * Payment transaction history.
 *
 * Every movement against a provider — intent, capture, refund — is one
 * append-only row, mirroring the `PaymentTransaction` table in the Prisma
 * schema. Nothing here is ever updated in place except status, and nothing is
 * deleted: this is the record a dispute is answered from.
 */

export type TransactionKind = "intent" | "capture" | "refund" | "payout-settlement";
export type TransactionStatus = "pending" | "authorised" | "captured" | "failed" | "refunded";

export interface PaymentTransactionRecord {
  id: string;
  orderId: string;
  orderReference: string;
  provider: string;
  kind: TransactionKind;
  status: TransactionStatus;
  amount: Cents;
  currency: StoreCurrency;
  /** Provider-side id — never card data. */
  reference: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

const globalForTransactions = globalThis as unknown as {
  __samruxPaymentTransactions?: PaymentTransactionRecord[];
};

function state() {
  if (!globalForTransactions.__samruxPaymentTransactions) {
    globalForTransactions.__samruxPaymentTransactions = [];
  }
  return globalForTransactions.__samruxPaymentTransactions;
}

export const paymentTransactions = {
  record(input: Omit<PaymentTransactionRecord, "id" | "createdAt" | "currency">) {
    const record: PaymentTransactionRecord = {
      ...input,
      id: `txn-${randomUUID().slice(0, 12)}`,
      currency: STORE_CURRENCY,
      createdAt: new Date().toISOString(),
    };
    state().unshift(record);
    return record;
  },

  forOrder(orderId: string) {
    return state().filter((record) => record.orderId === orderId);
  },

  byProviderReference(provider: string, reference: string) {
    return state().find(
      (record) => record.provider === provider && record.reference === reference,
    );
  },

  all(limit = 100) {
    return state().slice(0, limit);
  },
};
