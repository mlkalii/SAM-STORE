import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { siteConfig } from "@/config/site";
import { shippingRegion, storeConfig } from "@/config/store";
import { SHIPPING_METHODS } from "@/lib/commerce/shipping";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: `How ${storeConfig.legalName} ships orders: where we deliver, what it costs in US dollars, and how long it takes.`,
  alternates: { canonical: "/shipping" },
};

/**
 * The SAMRUX shipping policy.
 *
 * Rates and delivery times are read from `lib/commerce/shipping`, the same
 * table checkout charges from, so the page cannot drift from what is charged.
 */
export default function ShippingPage() {
  const methods = SHIPPING_METHODS.filter((method) => method.zone === "domestic");

  return (
    <PolicyPage
      title="Shipping policy"
      updated="September 2026"
      intro={`Every order is shipped directly by ${storeConfig.legalName}. We deliver to all fifty US states, and all shipping charges are in US dollars.`}
      sections={[
        {
          heading: "Where we ship",
          paragraphs: [
            `We ship within the United States only — ${shippingRegion.label}. We do not currently ship to addresses outside the United States.`,
          ],
        },
        {
          heading: "Shipping options and cost",
          bullets: methods.map(
            (method) =>
              `${method.label} — ${formatPrice(method.rate)}${
                method.freeOver ? `, free on orders over ${formatPrice(method.freeOver)}` : ""
              }. ${method.description}`,
          ),
        },
        {
          heading: "Processing time",
          paragraphs: [
            "Orders are dispatched within 48 hours, Monday to Friday. Orders placed at the weekend or on a public holiday are processed on the next working day.",
          ],
        },
        {
          heading: "Tracking",
          paragraphs: [
            "Every parcel is tracked. The tracking number is added to your order and emailed to you as soon as the parcel is dispatched.",
          ],
        },
        {
          heading: "Problems with a delivery",
          paragraphs: [
            `If a parcel is late, damaged or missing, email ${siteConfig.supportEmail} with your order reference and we will resolve it.`,
          ],
        },
      ]}
    />
  );
}
