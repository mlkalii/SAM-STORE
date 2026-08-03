import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminNav } from "@/components/admin/nav-config";
import { can } from "@/config/admin";
import { requireAdmin, toPublicStaff } from "@/lib/admin/auth";
import { adminAlerts } from "@/lib/admin";

export const metadata: Metadata = {
  title: { default: "SAMRUX Admin", template: "%s — SAMRUX Admin" },
  robots: { index: false, follow: false },
};

/**
 * Admin shell layout.
 *
 * `requireAdmin()` runs here, so every nested admin page is guaranteed a
 * signed-in staff member without repeating the check. Navigation is filtered by
 * permission on the server — a role never receives markup for a section it
 * cannot open.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireAdmin();

  const nav = adminNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(staff.role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const alerts = await adminAlerts(staff.role);

  return (
    <AdminShell staff={toPublicStaff(staff)} nav={nav} notifications={alerts}>
      {children}
    </AdminShell>
  );
}
