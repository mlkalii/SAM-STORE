import type { Metadata } from "next";
import { KeyRound, Lock, ShieldCheck, Timer } from "lucide-react";

import { Card, Pill } from "@/components/admin/ui";
import {
  ADMIN_REMEMBER_TTL_SECONDS,
  ADMIN_ROLES,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  permissionsFor,
  type Permission,
} from "@/config/admin";
import { CSRF_COOKIE, REMEMBER_ME_TTL_SECONDS, SESSION_TTL_SECONDS } from "@/config/auth";
import { requirePermission } from "@/lib/admin/auth";
import { staffStore } from "@/lib/admin/staff-store";
import { auditLog } from "@/lib/security/audit-log";
import { formatStoreDateTime } from "@/config/store";

export const metadata: Metadata = { title: "Security" };

const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "products.view", "products.edit", "products.delete",
  "categories.view", "categories.edit",
  "brands.view", "brands.edit",
  "orders.view", "orders.edit", "orders.refund",
  "customers.view", "customers.edit",
  "inventory.view", "inventory.edit",
  "marketing.view", "marketing.edit",
  "content.view", "content.edit",
  "reports.view",
  "settings.view", "settings.edit",
  "staff.view", "staff.edit",
];

function hours(seconds: number) {
  const value = seconds / 3600;
  return value >= 24 ? `${Math.round(value / 24)} days` : `${value} hours`;
}

export default async function AdminSecuritySettingsPage() {
  await requirePermission("settings.view", "/admin/settings/security");

  const staff = await staffStore.list();
  const audit = auditLog.recent(25);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sessions" description="How long a signed-in session stays valid">
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Timer className="size-3.5" aria-hidden />
                Admin session
              </dt>
              <dd className="font-mono text-xs">{hours(ADMIN_SESSION_TTL_SECONDS)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Timer className="size-3.5" aria-hidden />
                Admin “remember me”
              </dt>
              <dd className="font-mono text-xs">{hours(ADMIN_REMEMBER_TTL_SECONDS)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Timer className="size-3.5" aria-hidden />
                Customer session
              </dt>
              <dd className="font-mono text-xs">{hours(SESSION_TTL_SECONDS)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Timer className="size-3.5" aria-hidden />
                Customer “remember me”
              </dt>
              <dd className="font-mono text-xs">{hours(REMEMBER_ME_TTL_SECONDS)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-muted-foreground">
            Admin and storefront sessions use separate cookies (
            <code className="font-mono">{ADMIN_SESSION_COOKIE}</code>) signed with separate secrets,
            so a customer session can never be replayed against the admin.
          </p>
        </Card>

        <Card title="Protections" description="Active on every request">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <Lock className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="font-medium">HMAC-signed session cookies</p>
                <p className="text-xs text-muted-foreground">
                  httpOnly, sameSite=lax, secure in production. Tampering invalidates the signature.
                </p>
              </div>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="font-medium">Double-submit CSRF</p>
                <p className="text-xs text-muted-foreground">
                  Minted in the proxy as <code className="font-mono">{CSRF_COOKIE}</code>; every
                  mutation re-checks it server-side.
                </p>
              </div>
            </li>
            <li className="flex gap-2.5">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="font-medium">scrypt password hashing</p>
                <p className="text-xs text-muted-foreground">
                  Per-user salt, timing-safe comparison. A password change bumps the session
                  version, retiring every older cookie.
                </p>
              </div>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="font-medium">Server-side authorisation</p>
                <p className="text-xs text-muted-foreground">
                  Pages call <code className="font-mono">requirePermission</code>; actions re-check
                  with <code className="font-mono">can(role, permission)</code>. Hiding a button is
                  never the control.
                </p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <Card
        title="Role permissions"
        description="What each role may do. Super admin holds the wildcard."
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="px-5 py-2.5 text-xs font-medium text-muted-foreground">
                  Permission
                </th>
                {ADMIN_ROLES.map((role) => (
                  <th
                    key={role.id}
                    scope="col"
                    className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground"
                  >
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((permission) => (
                <tr key={permission} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-2 font-mono text-xs">{permission}</td>
                  {ADMIN_ROLES.map((role) => {
                    const allowed = permissionsFor(role.id);
                    const granted = allowed[0] === "*" || (allowed as Permission[]).includes(permission);
                    return (
                      <td key={role.id} className="px-3 py-2 text-center">
                        <span
                          className={
                            granted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground/40"
                          }
                          aria-label={granted ? "allowed" : "not allowed"}
                        >
                          {granted ? "●" : "–"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Audit log"
        description="Privileged mutations, newest first — who did what to which resource"
        bodyClassName="p-0"
      >
        {audit.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Nothing recorded yet. Approvals, refunds, payouts, moderation and settings changes
            land here as they happen.
          </p>
        ) : (
          <ul className="divide-y">
            {audit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {entry.action}
                </code>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                  {entry.resource}
                </span>
                <span className="text-xs">{entry.actorLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {formatStoreDateTime(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Staff accounts" description="Who can reach the admin" bodyClassName="p-0">
        <ul className="divide-y">
          {staff.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: member.avatarColor }}
                aria-hidden
              >
                {member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <Pill tone="info">{member.role.replaceAll("-", " ")}</Pill>
              <Pill tone={member.active ? "positive" : "neutral"}>
                {member.active ? "active" : "suspended"}
              </Pill>
              <span className="text-xs text-muted-foreground">
                {member.lastSeenAt ? `last seen ${member.lastSeenAt.slice(0, 10)}` : "never signed in"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
