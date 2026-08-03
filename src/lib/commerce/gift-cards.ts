import type { Cents, GiftCard } from "@/lib/commerce/types";
import { STORE_CURRENCY } from "@/lib/commerce/types";

/**
 * Gift cards.
 *
 * Balances live in-memory behind a store object; a real implementation swaps
 * the store for a table and keeps the same three operations.
 */
const globalForCards = globalThis as unknown as { __samruxGiftCards?: Map<string, GiftCard> };

function seed(): Map<string, GiftCard> {
  const cards: GiftCard[] = [
    { code: "SAMRUX-GIFT-50", initialBalance: 5000, balance: 5000, currency: STORE_CURRENCY, active: true },
    { code: "SAMRUX-GIFT-100", initialBalance: 10000, balance: 10000, currency: STORE_CURRENCY, active: true },
    { code: "SAMRUX-GIFT-250", initialBalance: 25000, balance: 25000, currency: STORE_CURRENCY, active: true },
  ];
  return new Map(cards.map((card) => [card.code, card]));
}

function state() {
  if (!globalForCards.__samruxGiftCards) globalForCards.__samruxGiftCards = seed();
  return globalForCards.__samruxGiftCards;
}

export function normaliseGiftCode(code: string) {
  return code.trim().toUpperCase();
}

export const giftCardStore = {
  find(code: string) {
    return state().get(normaliseGiftCode(code));
  },
  all() {
    return [...state().values()];
  },
  /** Deducts up to `amount`; returns what was actually taken. */
  redeem(code: string, amount: Cents): Cents {
    const card = state().get(normaliseGiftCode(code));
    if (!card || !card.active) return 0;

    const taken = Math.min(card.balance, amount);
    card.balance -= taken;
    if (card.balance === 0) card.active = false;
    return taken;
  },
  /** Issue a new card. Admin-driven. */
  issue(input: { code: string; amount: Cents; expiresAt?: string }): GiftCard {
    const code = normaliseGiftCode(input.code);
    const card: GiftCard = {
      code,
      initialBalance: input.amount,
      balance: input.amount,
      currency: STORE_CURRENCY,
      active: true,
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    };
    state().set(code, card);
    return card;
  },
  setActive(code: string, active: boolean) {
    const card = state().get(normaliseGiftCode(code));
    if (card) card.active = active;
    return card;
  },
  /** Puts value back when an order is cancelled or refunded. */
  restore(code: string, amount: Cents) {
    const card = state().get(normaliseGiftCode(code));
    if (!card) return;
    card.balance = Math.min(card.initialBalance, card.balance + amount);
    if (card.balance > 0) card.active = true;
  },
};

export type GiftCardRejection = "not-found" | "inactive" | "expired" | "empty";

export function describeGiftCardRejection(reason: GiftCardRejection) {
  switch (reason) {
    case "not-found":
      return "That gift card number was not recognised.";
    case "inactive":
      return "That gift card is no longer active.";
    case "expired":
      return "That gift card has expired.";
    case "empty":
      return "That gift card has no balance left.";
  }
}

export function validateGiftCard(
  code: string,
  now = new Date(),
): { card: GiftCard } | { rejected: GiftCardRejection } {
  const card = giftCardStore.find(code);
  if (!card) return { rejected: "not-found" };
  if (!card.active) return { rejected: "inactive" };
  if (card.expiresAt && new Date(card.expiresAt) < now) return { rejected: "expired" };
  if (card.balance <= 0) return { rejected: "empty" };
  return { card };
}
