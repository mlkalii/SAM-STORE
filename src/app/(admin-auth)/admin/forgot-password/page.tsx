import type { Metadata } from "next";
import Link from "next/link";

import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { AdminForgotPasswordForm } from "@/components/admin/admin-auth-forms";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Reset password" };

export default async function AdminForgotPasswordPage() {
  const csrfToken = await getCsrfToken();

  return (
    <AdminAuthCard
      title="Reset your password"
      description="Enter your work email and we will send a link to set a new password. The link lasts one hour."
      footer={
        <Link href="/admin/login" className="text-muted-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <AdminForgotPasswordForm csrfToken={csrfToken} />
    </AdminAuthCard>
  );
}
