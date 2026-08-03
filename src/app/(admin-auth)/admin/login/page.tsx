import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { AdminLoginForm } from "@/components/admin/admin-auth-forms";
import { ADMIN_ROOT } from "@/config/admin";
import { getAdminUser } from "@/lib/admin/auth";
import { SEED_STAFF_PASSWORD, staffStore } from "@/lib/admin/staff-store";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  if (await getAdminUser()) redirect(ADMIN_ROOT);

  const csrfToken = await getCsrfToken();
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;

  // Demo credentials are surfaced only outside production, and only because the
  // staff store is seeded rather than provisioned.
  const showDemo = process.env.NODE_ENV !== "production";
  const demoAccounts = showDemo ? (await staffStore.list()).slice(0, 5) : [];

  return (
    <AdminAuthCard
      title="Staff sign in"
      description="This panel is separate from the storefront. Access is by role and every action is attributed."
    >
      <AdminLoginForm csrfToken={csrfToken} next={next} />

      {showDemo ? (
        <div className="mt-7 rounded-xl border border-dashed p-4">
          <p className="text-xs font-medium">Development accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Password for all: <code className="font-mono">{SEED_STAFF_PASSWORD}</code>
          </p>
          <ul className="mt-2.5 space-y-1">
            {demoAccounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3 text-xs">
                <code className="font-mono text-muted-foreground">{account.email}</code>
                <span className="capitalize text-muted-foreground">
                  {account.role.replaceAll("-", " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AdminAuthCard>
  );
}
