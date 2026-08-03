import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms that apply when you buy from SAMRUX.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms &amp; conditions"
      updated="July 2026"
      intro="The agreement between you and SAMRUX when you place an order. Plain language, because terms nobody reads protect nobody."
      contactLabel="Legal enquiries"
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            `SAMRUX is a retailer operating this storefront. Company and legal correspondence goes to ${siteConfig.contactEmail}; customer questions go to ${siteConfig.supportEmail}.`,
          ],
        },
        {
          heading: "Orders and acceptance",
          paragraphs: [
            "Placing an order is an offer to buy. The contract forms when we send the dispatch confirmation, not when you click the button.",
            "If a product is listed at an obviously incorrect price we may decline the order and refund you in full rather than fulfil it.",
          ],
        },
        {
          heading: "Pricing",
          paragraphs: [
            "Prices are shown in US dollars and include applicable taxes where stated. Any compare-at price shown is a price we genuinely charged in the preceding month.",
          ],
        },
        {
          heading: "Your account",
          bullets: [
            "You are responsible for keeping your password confidential",
            "Tell us promptly if you believe somebody else has used your account",
            "We may suspend an account being used fraudulently or to abuse the returns policy",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "We do not exclude liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be excluded. Beyond that, our liability for any order is limited to the value of that order.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "We may update these terms. The version that applies to your order is the one published when you placed it, and the date at the top of this page tells you when it last changed.",
          ],
        },
      ]}
    />
  );
}
