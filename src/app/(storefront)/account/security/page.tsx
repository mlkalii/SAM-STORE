import type { Metadata } from "next";
import { KeyRound, ShieldCheck, Smartphone } from "lucide-react";

import { Panel } from "@/components/account/account-ui";
import { PasswordForm } from "@/components/account/password-form";
import { requireUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { REMEMBER_ME_TTL_SECONDS, SESSION_TTL_SECONDS } from "@/config/auth";

export const metadata: Metadata = { title: "Security", robots: { index: false } };

export default async function SecurityPage() {
  const user = await requireUser();
  const csrfToken = await getCsrfToken();

  const facts = [
    {
      icon: ShieldCheck,
      label: "Email verification",
      value: user.emailVerified ? "Verified" : "Not verified yet",
    },
    {
      icon: KeyRound,
      label: "Password storage",
      value: "scrypt with a per-account salt",
    },
    {
      icon: Smartphone,
      label: "Session length",
      value: `${SESSION_TTL_SECONDS / 3600} hours, or ${REMEMBER_ME_TTL_SECONDS / 86400} days with “remember me”`,
    },
  ];

  return (
    <>
      <Panel title="Security overview" description="How this account is protected right now.">
        <dl className="grid gap-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border p-4">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <fact.icon className="size-3.5" aria-hidden />
                {fact.label}
              </dt>
              <dd className="mt-2 text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel
        title="Change password"
        description="Changing it signs out every other device immediately."
      >
        <PasswordForm csrfToken={csrfToken} />
      </Panel>

      <Panel title="Two-factor authentication">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Not available yet. Sessions are signed cookies with a per-account version counter, so a
          password change already revokes every existing session — the piece 2FA will slot into is
          in place.
        </p>
      </Panel>
    </>
  );
}
