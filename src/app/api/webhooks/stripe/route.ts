import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { logger } from "@/lib/observability/logger";

/**
 * Stripe webhook receiver.
 *
 * Signature verification is implemented for real — Stripe's scheme is
 * HMAC-SHA256 over `${timestamp}.${rawBody}` with the endpoint secret — so the
 * only thing left to wire is the event handling marked below. Events arrive
 * whether or not we handle them; returning 2xx acknowledges receipt.
 */

const TOLERANCE_SECONDS = 300;

function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const parts = new Map(
    header.split(",").map((entry) => entry.split("=", 2) as [string, string]),
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;

  // Replays outside the tolerance window are rejected even if signed.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured: acknowledge nothing, reveal nothing.
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    logger.warn("stripe.webhook.bad_signature", {});
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as { id: string; type: string; data: { object: unknown } };
  logger.info("stripe.webhook.received", { id: event.id, type: event.type });

  switch (event.type) {
    case "payment_intent.succeeded":
      // TODO: mark the matching PaymentTransaction captured and advance the order.
      break;
    case "payment_intent.payment_failed":
      // TODO: mark failed, notify the customer, release reserved stock.
      break;
    case "charge.refunded":
      // TODO: reconcile against the refund transaction recorded at request time.
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
