import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your SAMRUX account to track orders and sync your wishlist.",
  robots: { index: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const csrfToken = await getCsrfToken();
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to track orders, sync your wishlist across devices and check out faster."
      footer={
        <span className="text-muted-foreground">
          New to SAMRUX?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </span>
      }
    >
      <SocialButtons intent="Sign in" />
      <AuthDivider label="or with email" />
      <LoginForm csrfToken={csrfToken} next={next} />
    </AuthCard>
  );
}
