import type { Metadata } from "next";
import Link from "next/link";

import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { AdminResetPasswordForm } from "@/components/admin/admin-auth-forms";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Set a new password" };

export default async function AdminResetPasswordPage(props: PageProps<"/admin/reset-password">) {
  const csrfToken = await getCsrfToken();
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";

  if (!token) {
    return (
      <AdminAuthCard
        title="That link is incomplete"
        description="The reset link is missing its token. Request a fresh one and use the most recent email."
        footer={
          <Link href="/admin/forgot-password" className="underline underline-offset-4">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Reset links expire after one hour and can only be used once.
        </p>
      </AdminAuthCard>
    );
  }

  return (
    <AdminAuthCard
      title="Set a new password"
      description="Changing it signs out every other admin session immediately."
      footer={
        <Link href="/admin/login" className="text-muted-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <AdminResetPasswordForm csrfToken={csrfToken} token={token} />
    </AdminAuthCard>
  );
}
