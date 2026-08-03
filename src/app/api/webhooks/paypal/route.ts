import { NextResponse } from "next/server";

import { logger } from "@/lib/observability/logger";

/**
 * PayPal webhook receiver.
 *
 * PayPal verification differs from Stripe's: the event must be posted back to
 * `/v1/notifications/verify-webhook-signature` with the transmission headers,
 * because the signature uses PayPal's certificate rather than a shared secret.
 * That call is stubbed below, and until it lands the route FAILS CLOSED with
 * 503 — an unverified event is never acknowledged.
 */
export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!webhookId || !clientId) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const transmission = {
    id: request.headers.get("paypal-transmission-id"),
    time: request.headers.get("paypal-transmission-time"),
    signature: request.headers.get("paypal-transmission-sig"),
    certUrl: request.headers.get("paypal-cert-url"),
    authAlgo: request.headers.get("paypal-auth-algo"),
  };

  if (Object.values(transmission).some((value) => !value)) {
    return NextResponse.json({ error: "missing transmission headers" }, { status: 400 });
  }

  // TODO: POST to /v1/notifications/verify-webhook-signature with
  // { ...transmission, webhook_id: webhookId, webhook_event: JSON.parse(rawBody) }
  // and require verification_status === "SUCCESS". Then parse the event and
  // handle PAYMENT.CAPTURE.COMPLETED (mark the matching PaymentTransaction
  // captured) and PAYMENT.CAPTURE.REFUNDED (reconcile the refund recorded at
  // request time) before acknowledging.
  //
  // Until that call exists the route FAILS CLOSED: acknowledging an unverified
  // event would let a forged POST drive payment state, and PayPal retries on
  // 5xx, so nothing is lost.
  logger.warn("paypal.webhook.rejected_unverified", { bytes: rawBody.length });
  return NextResponse.json({ error: "signature verification not yet wired" }, { status: 503 });
}
