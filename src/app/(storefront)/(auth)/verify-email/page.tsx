import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getCsrfToken } from "@/lib/auth/csrf";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false },
};

export default async function VerifyEmailPage(props: PageProps<"/verify-email">) {
  const csrfToken = await getCsrfToken();
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const welcome = searchParams.welcome === "1";

  return (
    <AuthCard
      title={welcome ? "One last step" : "Verify your email"}
      description={
        welcome
          ? "Your account is created. Confirm your email address to secure it and switch on order updates."
          : "Confirming your address secures the account and enables delivery notifications."
      }
      footer={
        <Link href="/account" className="text-muted-foreground underline underline-offset-4">
          Skip for now
        </Link>
      }
    >
      {token ? (
        <VerifyEmailForm csrfToken={csrfToken} token={token} />
      ) : (
        <div className="flex items-start gap-3 rounded-xl border bg-surface p-4 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Open the verification link from your email to finish. Nothing arrived? Write to{" "}
            <a href={`mailto:${siteConfig.supportEmail}`} className="underline underline-offset-4">
              {siteConfig.supportEmail}
            </a>
            .
          </span>
        </div>
      )}
    </AuthCard>
  );
}
