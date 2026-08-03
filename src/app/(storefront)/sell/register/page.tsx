import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/common/container";
import { SellerRegistrationForm } from "@/components/marketplace/seller-registration-form";
import { Button } from "@/components/ui/button";
import { US_STATES, storeConfig } from "@/config/store";
import { getSellerContext } from "@/lib/marketplace/auth";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = {
  title: "Seller registration",
  description: "Apply to sell on the SAMRUX marketplace.",
  robots: { index: false, follow: true },
};

export default async function SellerRegisterPage() {
  const [{ user, seller }, csrfToken] = await Promise.all([getSellerContext(), getCsrfToken()]);

  // One seller account per customer. An existing application goes to its own
  // status page rather than a second form.
  if (seller) redirect(seller.status === "approved" ? "/seller" : "/seller/status");

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Seller application
        </p>
        <h1 className="mt-5 font-display text-4xl tracking-tight text-balance sm:text-5xl">
          Open your store on SAMRUX
        </h1>
        <p className="mt-5 text-lg text-muted-foreground text-pretty">
          Five minutes now, then verification. You can add products while your application is
          reviewed — they go live the moment you are approved.
        </p>

        {user ? (
          <div className="mt-10">
            <SellerRegistrationForm
              csrfToken={csrfToken}
              states={US_STATES}
              defaults={{
                contactName: user.name,
                contactEmail: user.email,
                contactPhone: user.phone ?? "",
              }}
            />
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              A seller account is attached to your SAMRUX customer account. Sign in or create one
              first — it takes a moment and keeps one password for both.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button render={<Link href="/login?next=/sell/register" />}>Sign in</Button>
              <Button variant="outline" render={<Link href="/register?next=/sell/register" />}>
                Create an account
              </Button>
            </div>
          </div>
        )}

        <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
          Questions about the application? Email{" "}
          <a href={`mailto:${storeConfig.contactEmail}`} className="underline underline-offset-4">
            {storeConfig.contactEmail}
          </a>{" "}
          or call {storeConfig.phone}. {storeConfig.legalName} operates the marketplace from{" "}
          {storeConfig.address.city}, {storeConfig.address.state}.
        </p>
      </div>
    </Container>
  );
}
