import "server-only";

import { randomUUID } from "node:crypto";

import type {
  PaymentIntent,
  PaymentProvider,
  PaymentProviderId,
  PaymentRequest,
  RefundRequest,
  RefundResult,
} from "@/lib/payments/types";
import { hasEnv } from "@/lib/payments/types";

/**
 * Payment provider registry.
 *
 * Each entry is a complete provider except for the network call, which is
 * stubbed with a clearly-labelled placeholder reference. Wiring a provider up
 * means implementing `createIntent` against its SDK — the checkout, the order
 * record and the confirmation page already speak this interface.
 */

/**
 * Online refund placeholder: swap for the provider's refund call. The shape is
 * already what the admin action and the transaction history expect.
 */
function placeholderRefund(prefix: string, request: RefundRequest): RefundResult {
  return {
    reference: `${prefix}_re_${randomUUID().replace(/-/g, "").slice(0, 18)}`,
    status: "refunded",
    ...(request.reason ? {} : {}),
  };
}

/** Offline methods cannot push money back — a human settles them. */
function manualRefund(how: string): RefundResult {
  return {
    reference: `manual-${randomUUID().slice(0, 8)}`,
    status: "manual",
    instructions: how,
  };
}

function placeholderIntent(
  prefix: string,
  request: PaymentRequest,
  extra: Partial<PaymentIntent> = {},
): PaymentIntent {
  return {
    reference: `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
    status: "authorised",
    ...extra,
  };
}

const stripe: PaymentProvider = {
  id: "stripe",
  label: "Card",
  description: "Visa, Mastercard, Amex and Link, processed by Stripe.",
  requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"],
  offline: false,
  wallet: false,
  isConfigured: () => hasEnv(["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"]),
  async createIntent(request) {
    // Replace with `stripe.paymentIntents.create({ amount, currency, ... })`.
    return placeholderIntent("pi", request);
  },
  async refund(request) {
    // Replace with `stripe.refunds.create({ payment_intent, amount })`.
    return placeholderRefund("stripe", request);
  },
};

const paypal: PaymentProvider = {
  id: "paypal",
  label: "PayPal",
  description: "Pay with a PayPal balance, bank account or card.",
  requiredEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
  offline: false,
  wallet: false,
  isConfigured: () => hasEnv(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]),
  async createIntent(request) {
    // Replace with an Orders v2 create call, then redirect to the approve link.
    return placeholderIntent("PAYID", request);
  },
  async refund(request) {
    // Replace with `POST /v2/payments/captures/{id}/refund`.
    return placeholderRefund("paypal", request);
  },
};

const applePay: PaymentProvider = {
  id: "apple-pay",
  label: "Apple Pay",
  description: "One-touch checkout on Apple devices.",
  requiredEnv: ["STRIPE_SECRET_KEY", "APPLE_PAY_MERCHANT_ID"],
  offline: false,
  wallet: true,
  isConfigured: () => hasEnv(["STRIPE_SECRET_KEY", "APPLE_PAY_MERCHANT_ID"]),
  async createIntent(request) {
    return placeholderIntent("ap", request);
  },
  async refund(request) {
    // Wallet charges refund through the underlying Stripe payment.
    return placeholderRefund("stripe", request);
  },
};

const googlePay: PaymentProvider = {
  id: "google-pay",
  label: "Google Pay",
  description: "One-touch checkout with a saved Google account card.",
  requiredEnv: ["STRIPE_SECRET_KEY", "GOOGLE_PAY_MERCHANT_ID"],
  offline: false,
  wallet: true,
  isConfigured: () => hasEnv(["STRIPE_SECRET_KEY", "GOOGLE_PAY_MERCHANT_ID"]),
  async createIntent(request) {
    return placeholderIntent("gp", request);
  },
  async refund(request) {
    return placeholderRefund("stripe", request);
  },
};

const bankTransfer: PaymentProvider = {
  id: "bank-transfer",
  label: "Bank transfer",
  description: "We hold the order and dispatch once the transfer clears.",
  requiredEnv: [],
  offline: true,
  wallet: false,
  // Offline methods need no credentials, so they are always available.
  isConfigured: () => true,
  async createIntent(request) {
    return {
      reference: `BT-${request.orderReference}`,
      status: "pending",
      instructions:
        `Transfer ${(request.amount / 100).toFixed(2)} USDT quoting reference ` +
        `${request.orderReference}. Bank details are on your confirmation email. ` +
        `Orders are dispatched once the transfer clears, usually one working day.`,
    };
  },
  async refund(request) {
    return manualRefund(
      `Return ${(request.amount / 100).toFixed(2)} USDT by bank transfer to the account the customer paid from, quoting ${request.orderReference}.`,
    );
  },
};

const cashOnDelivery: PaymentProvider = {
  id: "cash-on-delivery",
  label: "Cash on delivery",
  description: "Pay the courier when the parcel arrives. Domestic orders only.",
  requiredEnv: [],
  offline: true,
  wallet: false,
  isConfigured: () => true,
  async createIntent(request) {
    return {
      reference: `COD-${request.orderReference}`,
      status: "pending",
      instructions: "Have the exact amount ready — couriers cannot give change.",
    };
  },
  async refund(request) {
    return manualRefund(
      `Cash order ${request.orderReference}: refund ${(request.amount / 100).toFixed(2)} USDT to the customer's chosen account — no card to return it to.`,
    );
  },
};

/**
 * Native USDT settlement — the marketplace's own currency, settled on-chain.
 *
 * The flow a processor like this needs: create a deposit address (or payment
 * URI) per order, watch the chain for the transfer, and confirm after N
 * blocks. `USDT_SETTLEMENT_API` points at the watcher service;
 * `USDT_TREASURY_WALLET` is where funds land.
 */
const usdt: PaymentProvider = {
  id: "usdt",
  label: "USDT",
  description: "Pay directly in Tether (TRC-20 / ERC-20). Confirmed on-chain.",
  requiredEnv: ["USDT_SETTLEMENT_API", "USDT_TREASURY_WALLET"],
  offline: false,
  wallet: false,
  isConfigured: () => hasEnv(["USDT_SETTLEMENT_API", "USDT_TREASURY_WALLET"]),
  async createIntent(request) {
    // Replace with a deposit-address request against USDT_SETTLEMENT_API.
    return placeholderIntent("usdt", request, {
      status: "pending",
      instructions:
        `Send exactly ${(request.amount / 100).toFixed(2)} USDT to the address on your ` +
        `confirmation page, quoting ${request.orderReference}. The order confirms after ` +
        `chain finality, usually under two minutes.`,
    });
  },
  async refund(request) {
    // Replace with a treasury transfer via the settlement API.
    return placeholderRefund("usdt", request);
  },
};

const providers: PaymentProvider[] = [
  stripe,
  paypal,
  applePay,
  googlePay,
  usdt,
  bankTransfer,
  cashOnDelivery,
];

export function allPaymentProviders() {
  return providers;
}

export function getPaymentProvider(id: string) {
  return providers.find((provider) => provider.id === id);
}

/**
 * What the checkout should offer.
 *
 * Unconfigured online providers are still listed so the option is visible and
 * explained, but flagged so the UI can disable them. Cash on delivery is
 * restricted to the domestic zone, which is where couriers actually collect.
 */
export function availablePaymentMethods(country: string) {
  return providers
    .filter((provider) => provider.id !== "cash-on-delivery" || country.toUpperCase() === "US")
    .map((provider) => ({
      id: provider.id as PaymentProviderId,
      label: provider.label,
      description: provider.description,
      offline: provider.offline,
      wallet: provider.wallet,
      available: provider.isConfigured(),
      requiredEnv: provider.requiredEnv,
    }));
}
