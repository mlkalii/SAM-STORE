import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import { siteConfig } from "@/config/site";
import { renderEmail, type EmailKind, type EmailPayloads } from "@/lib/email/templates";
import { transportFromEnv } from "@/lib/email/transports";
import { logger } from "@/lib/observability/logger";

/**
 * Email transport.
 *
 * `EmailTransport` is the seam: implement `deliver` against Resend, Postmark,
 * SES or SMTP and every template in the app is sent for real. Until then the
 * console transport logs a one-line summary so flows stay testable end to end
 * without silently dropping mail.
 */

export interface OutboundEmail {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailTransport {
  id: string;
  deliver(message: OutboundEmail): Promise<void>;
}

/**
 * The active transport comes from `EMAIL_PROVIDER` (resend | sendgrid | ses),
 * defaulting to the console transport in development — see
 * `src/lib/email/transports.ts`. Resolved lazily so importing this module
 * never reads the environment at build time.
 */
let transport: EmailTransport | null = null;

function activeTransport(): EmailTransport {
  if (!transport) transport = transportFromEnv();
  return transport;
}

export function setEmailTransport(next: EmailTransport) {
  transport = next;
}

/**
 * Delivery suppression, scoped to one async call tree.
 *
 * Demo seeding drives the real `placeOrder` → `advanceOrder` pipeline so the
 * seeded rows are indistinguishable from genuine ones — which also means it
 * triggers every transactional email those calls send, to invented addresses,
 * on every cold start. On a serverless host that is once per new instance: with
 * a live provider configured it would burn quota and bounce fabricated
 * recipients until the sending domain is flagged.
 *
 * An AsyncLocalStorage scope rather than a module flag, so a genuine checkout
 * running concurrently with a cold-start seed still gets its confirmation.
 */
const suppression = new AsyncLocalStorage<true>();

export function withEmailSuppressed<T>(run: () => Promise<T>): Promise<T> {
  return suppression.run(true, run);
}

export async function sendEmail<K extends EmailKind>(
  kind: K,
  to: string,
  data: EmailPayloads[K],
): Promise<void> {
  if (suppression.getStore()) {
    logger.debug("email.suppressed", { kind, to });
    return;
  }

  const rendered = renderEmail(kind, data);

  try {
    await activeTransport().deliver({
      to,
      // Transactional mail comes from the primary address customers can reply to.
      from: `${siteConfig.name} <${siteConfig.supportEmail}>`,
      replyTo: rendered.replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  } catch (error) {
    // A failed email must never fail the order it is confirming.
    logger.error("email.delivery_failed", { kind, to, error: String(error) });
  }
}
