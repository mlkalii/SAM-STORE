import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a SAMRUX account for order tracking, saved addresses and a synced wishlist.",
  robots: { index: false },
};

export default async function RegisterPage() {
  const csrfToken = await getCsrfToken();

  return (
    <AuthCard
      title="Create your account"
      description="One account for orders, addresses, your wishlist and the compare tray."
      footer={
        <span className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </span>
      }
    >
      <SocialButtons intent="Sign up" />
      <AuthDivider label="or with email" />
      <RegisterForm csrfToken={csrfToken} />
    </AuthCard>
  );
}
