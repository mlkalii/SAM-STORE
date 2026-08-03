import type { Metadata } from "next";

import { StaffManager } from "@/components/admin/staff-manager";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { ADMIN_ROLES } from "@/config/admin";
import { requirePermission } from "@/lib/admin/auth";
import { staffStore } from "@/lib/admin/staff-store";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const me = await requirePermission("staff.view", "/admin/staff");
  const csrfToken = await getCsrfToken();

  const staff = await staffStore.list();

  // The password hash never leaves the server.
  const rows = staff.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    active: member.active,
    createdAt: member.createdAt,
    lastSeenAt: member.lastSeenAt,
    avatarColor: member.avatarColor,
    isSelf: member.id === me.id,
  }));

  return (
    <>
      <PageHeader
        title="Staff"
        description="Who can reach the admin panel, and what their role allows."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Staff" }]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Staff accounts" value={rows.length} />
        <StatCard
          label="Active"
          value={rows.filter((row) => row.active).length}
          tone="positive"
        />
        <StatCard
          label="Super admins"
          value={rows.filter((row) => row.role === "super-admin").length}
          tone="gold"
        />
        <StatCard label="Roles defined" value={ADMIN_ROLES.length} />
      </div>

      <StaffManager csrfToken={csrfToken} staff={rows} roles={ADMIN_ROLES} />
    </>
  );
}
