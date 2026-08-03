import { siteConfig } from "@/config/site";
import { storeAddressLine, storeConfig } from "@/config/store";
import type { Order } from "@/lib/commerce/types";

/**
 * Transactional email templates.
 *
 * Each template returns a subject plus HTML and plain-text bodies, so a
 * transport can send a proper multipart message. Styling is inline because
 * every serious email client strips `<style>` blocks.
 *
 * The layout is shared, so nine emails have one header, one footer and one set
 * of type styles — change the brand once and every message follows.
 */

export type EmailKind =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "order-confirmation"
  | "shipping-confirmation"
  | "delivery-confirmation"
  | "return-confirmation"
  | "refund-confirmation"
  | "contact-confirmation";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  /** Reply-to for this class of message. */
  replyTo: string;
}

/** The SAMRUX mark, inlined — email clients block remote images. */
const LOGO_DATA_URI =
  "data:image/png;base64,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";

const BRAND = {
  ink: "#111114",
  paper: "#ffffff",
  soft: "#f6f6f7",
  line: "#e4e4e7",
  muted: "#6b6b73",
  gold: "#a3812f",
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:${BRAND.ink};color:${BRAND.paper};text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;font-size:14px">${escapeHtml(label)}</a>`;
}

/** One shell for every message: brand mark, content, legal footer. */
function layout(body: string, preheader: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(siteConfig.name)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.soft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.ink}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.paper};border:1px solid ${BRAND.line};border-radius:16px;overflow:hidden">
    <tr><td style="background:${BRAND.ink};padding:20px 28px">
      <img src="${LOGO_DATA_URI}" width="28" height="28" alt="" style="vertical-align:middle;border-radius:8px">
      <span style="color:${BRAND.paper};font-size:17px;font-weight:700;letter-spacing:0.28em;vertical-align:middle;margin-left:10px">SAMRUX</span>
    </td></tr>
    <tr><td style="padding:32px 28px">${body}</td></tr>
    <tr><td style="border-top:1px solid ${BRAND.line};padding:22px 28px;font-size:12px;color:${BRAND.muted};line-height:1.7">
      Customer support: <a href="mailto:${siteConfig.supportEmail}" style="color:${BRAND.ink}">${siteConfig.supportEmail}</a><br>
      Company and legal: <a href="mailto:${siteConfig.contactEmail}" style="color:${BRAND.ink}">${siteConfig.contactEmail}</a><br><br>
      ${escapeHtml(storeConfig.legalName)} · ${escapeHtml(storeAddressLine)} · ${escapeHtml(storeConfig.phone)}<br>
      © ${new Date().getFullYear()} ${escapeHtml(siteConfig.name)}. You are receiving this because of activity on your account.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.muted}">${text}</p>`;
}

function orderTable(order: Order) {
  const rows = order.lines
    .map(
      (line) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px">
        ${escapeHtml(line.name)}<br><span style="color:${BRAND.muted};font-size:12px">${escapeHtml(line.brand)} · Qty ${line.quantity}</span>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;white-space:nowrap">
        ${money(line.unitPrice * line.quantity)}
      </td></tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:5px 0;font-size:${bold ? 15 : 13}px;${bold ? "font-weight:700" : `color:${BRAND.muted}`}">${label}</td>
     <td align="right" style="padding:5px 0;font-size:${bold ? 15 : 13}px;${bold ? "font-weight:700" : `color:${BRAND.muted}`}">${value}</td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">${rows}
    <tr><td colspan="2" style="padding-top:14px"></td></tr>
    ${totalRow("Subtotal", money(order.totals.subtotal))}
    ${order.totals.discountTotal > 0 ? totalRow("Discounts", `−${money(order.totals.discountTotal)}`) : ""}
    ${totalRow("Shipping", order.totals.shippingTotal === 0 ? "Free" : money(order.totals.shippingTotal))}
    ${order.totals.taxTotal > 0 ? totalRow("Tax", money(order.totals.taxTotal)) : ""}
    ${order.totals.giftCardTotal > 0 ? totalRow("Gift card", `−${money(order.totals.giftCardTotal)}`) : ""}
    ${totalRow("Total", money(order.totals.grandTotal), true)}
  </table>`;
}

function addressBlock(order: Order) {
  const address = order.shippingAddress;
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${BRAND.muted}">
    <strong style="color:${BRAND.ink}">Delivering to</strong><br>
    ${escapeHtml(address.recipient)}<br>
    ${escapeHtml(address.line1)}<br>
    ${address.line2 ? `${escapeHtml(address.line2)}<br>` : ""}
    ${escapeHtml(address.city)}, ${escapeHtml(address.postcode)}<br>
    ${escapeHtml(address.country)}
  </p>`;
}

function textLines(order: Order) {
  return order.lines
    .map((line) => `  ${line.quantity} × ${line.name} (${line.brand}) — ${money(line.unitPrice * line.quantity)}`)
    .join("\n");
}

/* -------------------------------------------------------------------------- */

export interface EmailPayloads {
  welcome: { name: string };
  "verify-email": { name: string; url: string };
  "password-reset": { name: string; url: string };
  "order-confirmation": { order: Order };
  "shipping-confirmation": { order: Order; trackingNumber: string };
  "delivery-confirmation": { order: Order };
  "return-confirmation": { order: Order; reason: string };
  "refund-confirmation": { order: Order; amount: number };
  "contact-confirmation": { name: string; topic: string };
}

const SUPPORT = siteConfig.supportEmail;
const COMPANY = siteConfig.contactEmail;

export function renderEmail<K extends EmailKind>(
  kind: K,
  data: EmailPayloads[K],
): RenderedEmail {
  switch (kind) {
    case "welcome": {
      const { name } = data as EmailPayloads["welcome"];
      return {
        subject: "Welcome to SAMRUX",
        replyTo: SUPPORT,
        text: `Welcome, ${name}.\n\nYour SAMRUX account is ready. Track orders, save addresses and sync your wishlist at ${siteConfig.url}/account.\n\nQuestions: ${SUPPORT}`,
        html: layout(
          heading(`Welcome, ${escapeHtml(name)}`) +
            paragraph(
              "Your account is ready. From here you can track orders, keep a wishlist across devices and check out without retyping an address.",
            ) +
            paragraph(
              `Every product we stock is chosen by a person who had to justify it. If something is not right, reply to this email or write to <a href="mailto:${SUPPORT}" style="color:${BRAND.ink}">${SUPPORT}</a>.`,
            ) +
            button("Go to your account", `${siteConfig.url}/account`),
          "Your SAMRUX account is ready.",
        ),
      };
    }

    case "verify-email": {
      const { name, url } = data as EmailPayloads["verify-email"];
      return {
        subject: "Confirm your email address",
        replyTo: SUPPORT,
        text: `Hello ${name},\n\nConfirm your email address to secure your account and switch on order updates:\n${url}\n\nThe link expires in one hour. If you did not create an account, ignore this email.`,
        html: layout(
          heading("Confirm your email address") +
            paragraph(
              `Hello ${escapeHtml(name)} — one click secures your account and switches on delivery notifications.`,
            ) +
            button("Verify my email", url) +
            paragraph(
              "The link expires in one hour. If you did not create an account, you can safely ignore this message.",
            ),
          "One click to secure your SAMRUX account.",
        ),
      };
    }

    case "password-reset": {
      const { name, url } = data as EmailPayloads["password-reset"];
      return {
        subject: "Reset your SAMRUX password",
        replyTo: SUPPORT,
        text: `Hello ${name},\n\nSet a new password here:\n${url}\n\nThe link expires in one hour and can only be used once. If you did not ask for this, nothing has changed.`,
        html: layout(
          heading("Set a new password") +
            paragraph(`Hello ${escapeHtml(name)} — use the button below to choose a new password.`) +
            button("Choose a new password", url) +
            paragraph(
              "The link expires in one hour and works once. If you did not request it, nothing on your account has changed and you can ignore this email.",
            ),
          "Reset your SAMRUX password.",
        ),
      };
    }

    case "order-confirmation": {
      const { order } = data as EmailPayloads["order-confirmation"];
      return {
        subject: `Order ${order.reference} confirmed`,
        replyTo: SUPPORT,
        text: `Thanks — order ${order.reference} is confirmed.\n\n${textLines(order)}\n\nTotal: ${money(order.totals.grandTotal)}\nDelivery estimate: ${order.deliveryEstimate.label}\n\nTrack it at ${siteConfig.url}/account/orders`,
        html: layout(
          heading("Order confirmed") +
            paragraph(
              `Thanks — we have order <strong style="color:${BRAND.ink}">${escapeHtml(order.reference)}</strong> and it is being picked now. Estimated delivery <strong style="color:${BRAND.ink}">${escapeHtml(order.deliveryEstimate.label)}</strong>.`,
            ) +
            orderTable(order) +
            addressBlock(order) +
            (order.payment.status === "pending" && order.payment.providerId === "bank-transfer"
              ? paragraph(
                  "This order is held until your bank transfer clears. Quote the order reference so we can match it.",
                )
              : "") +
            button("View order", `${siteConfig.url}/account/orders/${order.id}`),
          `Order ${order.reference} is confirmed.`,
        ),
      };
    }

    case "shipping-confirmation": {
      const { order, trackingNumber } = data as EmailPayloads["shipping-confirmation"];
      return {
        subject: `Order ${order.reference} is on its way`,
        replyTo: SUPPORT,
        text: `Order ${order.reference} has shipped.\n\nTracking: ${trackingNumber}\nEstimated delivery: ${order.deliveryEstimate.label}\n\n${siteConfig.url}/account/orders/${order.id}`,
        html: layout(
          heading("Your order is on its way") +
            paragraph(
              `Order <strong style="color:${BRAND.ink}">${escapeHtml(order.reference)}</strong> left the warehouse. Tracking number <strong style="color:${BRAND.ink}">${escapeHtml(trackingNumber)}</strong>.`,
            ) +
            paragraph(`Estimated delivery: ${escapeHtml(order.deliveryEstimate.label)}.`) +
            addressBlock(order) +
            button("Track this order", `${siteConfig.url}/account/orders/${order.id}`),
          `${order.reference} has shipped.`,
        ),
      };
    }

    case "delivery-confirmation": {
      const { order } = data as EmailPayloads["delivery-confirmation"];
      return {
        subject: `Order ${order.reference} delivered`,
        replyTo: SUPPORT,
        text: `Order ${order.reference} was delivered.\n\nThirty days to change your mind. Start a return at ${siteConfig.url}/account/orders/${order.id}`,
        html: layout(
          heading("Delivered") +
            paragraph(
              `Order <strong style="color:${BRAND.ink}">${escapeHtml(order.reference)}</strong> has been delivered. We hope it is right.`,
            ) +
            paragraph(
              "You have thirty days to change your mind, and we cover return postage on the first exchange of any order.",
            ) +
            button("View order", `${siteConfig.url}/account/orders/${order.id}`),
          `${order.reference} has been delivered.`,
        ),
      };
    }

    case "return-confirmation": {
      const { order, reason } = data as EmailPayloads["return-confirmation"];
      return {
        subject: `Return started for ${order.reference}`,
        replyTo: SUPPORT,
        text: `We have your return request for ${order.reference}.\n\nReason: ${reason}\n\nA prepaid label follows separately. Refunds are issued within five working days of the parcel reaching us.`,
        html: layout(
          heading("Return started") +
            paragraph(
              `We have your return request for <strong style="color:${BRAND.ink}">${escapeHtml(order.reference)}</strong>.`,
            ) +
            paragraph(`Reason given: ${escapeHtml(reason)}`) +
            paragraph(
              "A prepaid label follows separately. Once the parcel reaches us, the refund is issued within five working days.",
            ) +
            button("View order", `${siteConfig.url}/account/orders/${order.id}`),
          `Return started for ${order.reference}.`,
        ),
      };
    }

    case "refund-confirmation": {
      const { order, amount } = data as EmailPayloads["refund-confirmation"];
      return {
        subject: `Refund issued for ${order.reference}`,
        replyTo: SUPPORT,
        text: `${money(amount)} has been refunded for order ${order.reference}.\n\nIt returns to the original payment method, usually within five working days.`,
        html: layout(
          heading("Refund issued") +
            paragraph(
              `<strong style="color:${BRAND.ink}">${money(amount)}</strong> has been refunded against order ${escapeHtml(order.reference)}.`,
            ) +
            paragraph(
              "The money goes back to the original payment method. Most banks show it within five working days.",
            ) +
            button("View order", `${siteConfig.url}/account/orders/${order.id}`),
          `${money(amount)} refunded.`,
        ),
      };
    }

    case "contact-confirmation": {
      const { name, topic } = data as EmailPayloads["contact-confirmation"];
      return {
        subject: "We have your message",
        replyTo: COMPANY,
        text: `Thanks ${name} — we have your message about ${topic} and will reply within one working day.\n\nSupport: ${SUPPORT}\nCompany: ${COMPANY}`,
        html: layout(
          heading("We have your message") +
            paragraph(
              `Thanks ${escapeHtml(name)} — your message about <strong style="color:${BRAND.ink}">${escapeHtml(topic)}</strong> is with a real person, not a queue. Expect a reply within one working day.`,
            ) +
            paragraph(
              `If it is urgent and about an existing order, reply to this email with the order reference.`,
            ),
          "Your message has reached SAMRUX.",
        ),
      };
    }
  }
}
