import type { Cents, OrderAddress } from "@/lib/commerce/types";
import type { StoreCurrency } from "@/lib/commerce/types";

/**
 * Payment provider contract.
 *
 * Every provider — hosted (Stripe, PayPal), wallet (Apple Pay, Google Pay) or
 * offline (bank transfer, cash on delivery) — implements this one interface, so
 * checkout never branches on which provider was chosen.
 *
 * No provider here holds credentials. `isConfigured()` reports whether the
 * environment supplies what the provider needs; nothing is hardcoded, and a
 * provider that is not configured is offered as unavailable rather than
 * pretending to work.
 */

export type PaymentProviderId =
  | "stripe"
  | "paypal"
  | "apple-pay"
  | "google-pay"
  | "usdt"
  | "bank-transfer"
  | "cash-on-delivery";

export interface PaymentIntent {
  /** Provider-side reference. Never a card number. */
  reference: string;
  status: "pending" | "authorised" | "captured" | "failed";
  /** Where the customer must be sent to complete payment, if anywhere. */
  redirectUrl?: string;
  /** Copy shown on the confirmation page (e.g. bank details). */
  instructions?: string;
}

export interface PaymentRequest {
  orderReference: string;
  amount: Cents;
  currency: StoreCurrency;
  email: string;
  billingAddress: OrderAddress;
}

export interface RefundRequest {
  orderReference: string;
  /** The provider-side reference the capture returned. */
  paymentReference: string;
  amount: Cents;
  currency: StoreCurrency;
  reason?: string;
}

export interface RefundResult {
  /** Provider-side refund id, or a manual-settlement marker. */
  reference: string;
  status: "refunded" | "pending" | "manual";
  /** Present when a human has to complete the refund (offline methods). */
  instructions?: string;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  description: string;
  /** Environment variables that must exist before this can go live. */
  requiredEnv: string[];
  /** Offline methods settle outside the checkout. */
  offline: boolean;
  /** Wallets need the browser to support them as well as us. */
  wallet: boolean;
  isConfigured(): boolean;
  createIntent(request: PaymentRequest): Promise<PaymentIntent>;
  /**
   * Returns money the way it came in. Called by the admin refund action; the
   * result is recorded in the transaction history whatever the outcome.
   */
  refund(request: RefundRequest): Promise<RefundResult>;
}

export function hasEnv(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}
