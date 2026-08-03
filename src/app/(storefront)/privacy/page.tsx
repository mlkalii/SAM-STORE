import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data SAMRUX collects, why, how long it is kept, and how to have it erased.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      updated="July 2026"
      intro="What we collect, why we collect it, and how to get rid of it. Written to be read rather than to be legally survivable."
      contactLabel="Data protection enquiries"
      sections={[
        {
          heading: "What we collect",
          bullets: [
            "Account data: your name, email address and an optional phone number",
            "Order data: what you bought, where it went, and what you paid",
            "Addresses you choose to save",
            "Technical data needed to serve the site, such as your session cookie",
          ],
        },
        {
          heading: "What stays in your browser",
          paragraphs: [
            "Your wishlist, compare tray and recently-viewed history are stored in your own browser's local storage, not on our servers. Clearing your browser data removes them, and we never see them unless you are signed in and sync is switched on.",
          ],
        },
        {
          heading: "Cookies",
          bullets: [
            "A session cookie that keeps you signed in — httpOnly, sameSite, and secure in production",
            "A CSRF token cookie that protects forms from cross-site submission",
            "No advertising or cross-site tracking cookies are set",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "Order records are kept for seven years because tax law requires it. Everything else is deleted within 30 days of you closing your account.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `You can ask for a copy of your data, ask us to correct it, or ask us to erase it. Email ${siteConfig.contactEmail} and we will respond within 30 days.`,
          ],
        },
        {
          heading: "Sharing",
          paragraphs: [
            "We share data with the couriers who deliver your orders and the provider who processes payments, and with nobody else. We do not sell data, and we do not pass it to advertisers.",
          ],
        },
      ]}
    />
  );
}
