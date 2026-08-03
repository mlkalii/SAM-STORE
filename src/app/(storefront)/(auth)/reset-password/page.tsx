import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false },
};

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const csrfToken = await getCsrfToken();
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";

  if (!token) {
    return (
      <AuthCard
        title="That link is incomplete"
        description="The reset link is missing its token. Request a fresh one and use the most recent email."
        footer={
          <Link href="/forgot-password" className="text-foreground underline underline-offset-4">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Reset links expire after one hour and can only be used once.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose something you have not used elsewhere. Signing in again on your other devices will be required."
      footer={
        <Link href="/login" className="text-muted-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm csrfToken={csrfToken} token={token} />
    </AuthCard>
  );
}
