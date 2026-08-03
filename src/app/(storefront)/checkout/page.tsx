import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { CheckoutFlow, type CheckoutDefaults } from "@/components/checkout/checkout-flow";
import { Container } from "@/components/common/container";
import { requireUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your SAMRUX order.",
  robots: { index: false },
};

export default async function CheckoutPage() {
  // `proxy.ts` guards /checkout too, so this is the second line of defence.
  const user = await requireUser("/checkout");
  const csrfToken = await getCsrfToken();

  const preferred = user.addresses.find((address) => address.isDefault) ?? user.addresses[0];

  const defaults: CheckoutDefaults = {
    recipient: preferred?.recipient ?? user.name,
    line1: preferred?.line1 ?? "",
    line2: preferred?.line2 ?? "",
    city: preferred?.city ?? "",
    postcode: preferred?.postcode ?? "",
    country: preferred?.country ?? "US",
    phone: preferred?.phone ?? user.phone ?? "",
  };

  return (
    <div className="bg-surface">
      <Container className="py-10 sm:py-14">
        <header className="mb-10">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
            <Lock className="size-3.5" aria-hidden />
            Secure checkout
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Checkout</h1>
        </header>

        <CheckoutFlow csrfToken={csrfToken} defaults={defaults} />
      </Container>
    </div>
  );
}
