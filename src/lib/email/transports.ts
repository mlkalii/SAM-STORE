import "server-only";

import { logger } from "@/lib/observability/logger";
import type { EmailTransport, OutboundEmail } from "@/lib/email/send";

/**
 * Production email transports.
 *
 * Selected by `EMAIL_PROVIDER` (resend | sendgrid | ses | console). Resend and
 * SendGrid are complete REST implementations — set the API key and mail flows.
 * SES is scaffolded: its SigV4 signing wants the official SDK, so the
 * transport validates configuration and names the two-line integration.
 *
 * All three read credentials from the environment. Nothing is hardcoded.
 */

function parseAddress(value: string): { email: string; name?: string } {
  const match = value.match(/^(.*)<(.+)>$/);
  if (!match) return { email: value.trim() };
  return { email: match[2].trim(), name: match[1].trim().replace(/^"|"$/g, "") || undefined };
}

/** https://resend.com/docs/api-reference/emails/send-email */
export const resendTransport: EmailTransport = {
  id: "resend",
  async deliver(message: OutboundEmail) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`resend responded ${response.status}: ${await response.text()}`);
    }
  },
};

/** https://docs.sendgrid.com/api-reference/mail-send/mail-send */
export const sendgridTransport: EmailTransport = {
  id: "sendgrid",
  async deliver(message: OutboundEmail) {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) throw new Error("SENDGRID_API_KEY is not set");

    const from = parseAddress(message.from);
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from,
        reply_to: { email: message.replyTo },
        subject: message.subject,
        content: [
          { type: "text/plain", value: message.text },
          { type: "text/html", value: message.html },
        ],
      }),
    });

    // SendGrid returns 202 with an empty body on success.
    if (response.status !== 202) {
      throw new Error(`sendgrid responded ${response.status}: ${await response.text()}`);
    }
  },
};

/**
 * Amazon SES.
 *
 * SES requests need AWS SigV4 signing; the supported path is the official
 * client, kept out of the base install so the dependency is opt-in:
 *
 *   npm install @aws-sdk/client-sesv2
 *
 *   const client = new SESv2Client({ region: process.env.AWS_REGION });
 *   await client.send(new SendEmailCommand({
 *     FromEmailAddress: message.from,
 *     Destination: { ToAddresses: [message.to] },
 *     ReplyToAddresses: [message.replyTo],
 *     Content: { Simple: { Subject: { Data: message.subject },
 *       Body: { Html: { Data: message.html }, Text: { Data: message.text } } } },
 *   }));
 */
export const sesTransport: EmailTransport = {
  id: "ses",
  async deliver(message: OutboundEmail) {
    const configured = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"].every(
      (key) => Boolean(process.env[key]),
    );
    if (!configured) {
      throw new Error("SES transport needs AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    }
    throw new Error(
      `SES transport is scaffolded — install @aws-sdk/client-sesv2 and complete deliver() ` +
        `(message for ${message.to} was not sent)`,
    );
  },
};

const consoleTransport: EmailTransport = {
  id: "console",
  async deliver(message: OutboundEmail) {
    logger.info("email.console", {
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
    });
  },
};

/** The transport `EMAIL_PROVIDER` names, defaulting to console for development. */
export function transportFromEnv(): EmailTransport {
  switch (process.env.EMAIL_PROVIDER) {
    case "resend":
      return resendTransport;
    case "sendgrid":
      return sendgridTransport;
    case "ses":
      return sesTransport;
    default:
      return consoleTransport;
  }
}
