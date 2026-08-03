import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { siteConfig } from "@/config/site";
import { storeConfig } from "@/config/store";
import { NON_RETURNABLE, RETURN_REASONS, returnPolicy } from "@/config/returns";

export const metadata: Metadata = {
  title: "Return policy",
  description: `SAMRUX return policy: ${returnPolicy.windowDays} days from delivery, free return shipping on incorrect or defective products.`,
  alternates: { canonical: "/returns" },
};

/**
 * The official SAMRUX return policy.
 *
 * Every number here is read from `config/returns`, which is the same source the
 * checkout, the product page, the seller dashboard and the admin refund screen
 * use — so the policy a customer reads is the policy the system enforces.
 */
export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Return policy"
      updated="July 2026"
      intro={`You may return eligible products within ${returnPolicy.windowDays} days after delivery. Incorrect or defective products qualify for free return shipping, and refunds are issued to ${returnPolicy.refundTo} within ${returnPolicy.refundBusinessDaysMin}–${returnPolicy.refundBusinessDaysMax} business days after approval.`}
      sections={[
        {
          heading: "The window",
          paragraphs: [
            `You have ${returnPolicy.windowDays} days from the delivery date to start a return. Products should be unused and in their original packaging wherever possible.`,
            "Faulty goods are separate: those are covered by the warranty for the product's department and are not limited to the return window.",
          ],
        },
        {
          heading: "How to return something",
          bullets: [
            "Open the order under Orders in your account and choose Return",
            `Or email ${siteConfig.supportEmail} with the order reference and what you are sending back`,
            "Choose a reason — incorrect and defective items get a prepaid label automatically",
            `Once the return is approved, your refund reaches ${returnPolicy.refundTo} within ${returnPolicy.refundBusinessDaysMin}–${returnPolicy.refundBusinessDaysMax} business days`,
          ],
        },
        {
          heading: "Who pays return shipping",
          paragraphs: [
            "Incorrect or defective products, and anything not as described, ship back at our cost — we send a prepaid label.",
            "A change of mind is returned at your own cost. There is no restocking fee either way.",
          ],
          bullets: RETURN_REASONS.map(
            (reason) =>
              `${reason.label} — ${reason.freeShipping ? "free return shipping" : "return shipping at your cost"}`,
          ),
        },
        {
          heading: "What cannot be returned",
          paragraphs: [
            "The following are non-returnable unless they arrive defective. Defective goods are always covered, whatever the category.",
          ],
          bullets: NON_RETURNABLE.map((rule) => `${rule.label} — ${rule.reason}`),
        },
        {
          heading: "Marketplace orders",
          paragraphs: [
            "SAMRUX is a marketplace, so an order may contain products from several independent sellers. The return policy is identical whoever sold it: the marketplace guarantees it, not the individual seller.",
            "Return each seller's items in their own parcel using the label supplied for it. Refunds are issued per seller as each return is received.",
          ],
        },
        {
          heading: "Refunds",
          paragraphs: [
            `Refunds always go back to ${returnPolicy.refundTo}. We cannot refund to a different card, account or wallet.`,
            `There is no restocking fee. If a discount or coupon was applied to the order, the refund is calculated on what you actually paid.`,
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            `${storeConfig.legalName}, ${storeConfig.address.line1}, ${storeConfig.address.line2}, ${storeConfig.address.city}, ${storeConfig.address.state} ${storeConfig.address.postcode}, ${storeConfig.address.country}.`,
            `Email ${storeConfig.supportEmail} or call ${storeConfig.phone}. Support operates on ${storeConfig.timezone} business hours.`,
          ],
        },
      ]}
    />
  );
}
