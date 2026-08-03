import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false },
};

export default async function ForgotPasswordPage() {
  const csrfToken = await getCsrfToken();

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email address on your account and we will send a link to set a new password. The link lasts one hour."
      footer={
        <Link href="/login" className="text-muted-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm csrfToken={csrfToken} />
    </AuthCard>
  );
}
