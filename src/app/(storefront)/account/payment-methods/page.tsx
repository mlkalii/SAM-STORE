import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { CreditCard, Lock } from "lucide-react";

import { EmptyState, Panel } from "@/components/account/account-ui";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Payment methods", robots: { index: false } };

// The proxy already redirects anonymous traffic away from /account, but this
// page must not be reachable on the strength of one matcher alone: every other
// account page proves the session server-side, and a page that skips the check
// silently becomes the exception the next matcher edit exposes.
export default async function PaymentMethodsPage() {
  await requireUser("/account/payment-methods");

  return (
    <Panel title="Payment methods" description="Cards are stored by the payment provider, never by us.">
      <EmptyState
        icon={CreditCard}
        title="No saved cards"
        description="Card storage switches on with the payment provider. SAMRUX never receives or stores a card number — only a provider token."
      />

      <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Questions about billing? Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="underline underline-offset-4">
            {siteConfig.supportEmail}
          </a>
          .
        </span>
      </p>
    </Panel>
  );
}
