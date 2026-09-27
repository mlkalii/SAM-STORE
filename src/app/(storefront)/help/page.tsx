import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Delivery, returns, warranty and account help for SAMRUX customers.",
};

export default function HelpPage() {
  return (
    <PolicyPage
      title="Help centre"
      updated="July 2026"
      intro={`Everything customers ask us most, answered plainly. If the answer is not here, write to ${siteConfig.supportEmail} and a person replies within one working day.`}
      contactLabel="Still stuck?"
      sections={[
        {
          heading: "Orders",
          paragraphs: [
            "Every order gets a reference beginning SMX and a confirmation email the moment it is placed. Track progress under Orders in your account.",
          ],
          bullets: [
            "Changes and cancellations are possible until the order is marked as shipped",
            `To change an address after dispatch, email ${siteConfig.supportEmail} with the order reference`,
            "Missing a confirmation email? Check spam, then ask us to resend it",
          ],
        },
        {
          heading: "Shipping",
          paragraphs: [
            `Orders are dispatched within 48 hours, Monday to Friday. Shipping is free over ${formatPrice(siteConfig.freeShippingThreshold)} and ${formatPrice(995)} below that.`,
          ],
          bullets: [
            "Domestic delivery: two to four working days once dispatched",
            "International delivery: five to nine working days",
            "Every parcel is tracked; the number appears on the order as soon as it exists",
          ],
        },
        {
          heading: "Returns and refunds",
          paragraphs: [
            "Thirty days from delivery, unused and in its original packing. We cover return postage on the first exchange of any order.",
            "Refunds are issued to the original payment method within five working days of the parcel reaching us.",
          ],
        },
        {
          heading: "Warranty",
          paragraphs: [
            "We administer warranty claims ourselves rather than passing you to the manufacturer. Cover is set by department and shown on every product page; the warranty page lists each one.",
          ],
        },
        {
          heading: "Your account",
          bullets: [
            "Reset a forgotten password from the sign-in page; links last one hour",
            "Verify your email address to switch on delivery notifications",
            "Changing your password signs out every other device immediately",
            `To close an account and erase its data, email ${siteConfig.contactEmail}`,
          ],
        },
      ]}
    />
  );
}
