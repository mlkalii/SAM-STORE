import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  ADMIN_LOGIN,
  ADMIN_SESSION_COOKIE,
  can,
  type AdminRole,
  type Permission,
} from "@/config/admin";
import { verifyAdminSession } from "@/lib/admin/session";
import { staffStore, type StaffUser } from "@/lib/admin/staff-store";

/**
 * The read side of admin authentication.
 *
 * `getAdminUser` is the only way an admin page learns who is signed in, and
 * `requireAdmin` / `requirePermission` are the only ways it enforces access —
 * so a new page cannot accidentally be public.
 */
export const getAdminUser = cache(async (): Promise<StaffUser | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifyAdminSession(token);
  if (!payload) return null;

  const staff = await staffStore.findById(payload.sub);
  if (!staff || !staff.active) return null;

  // A password change bumps `sessionVersion`, retiring older cookies.
  if (staff.sessionVersion !== payload.ver) return null;

  return staff;
});

export async function requireAdmin(next = "/admin"): Promise<StaffUser> {
  const staff = await getAdminUser();
  if (!staff) redirect(`${ADMIN_LOGIN}?next=${encodeURIComponent(next)}`);
  return staff;
}

/**
 * Page-level authorisation. Redirects to the dashboard rather than 404ing, so
 * a staff member following a link they cannot use gets an explanation instead
 * of a dead end.
 */
export async function requirePermission(
  permission: Permission,
  next = "/admin",
): Promise<StaffUser> {
  const staff = await requireAdmin(next);
  if (!can(staff.role, permission)) redirect(`/admin?denied=${encodeURIComponent(permission)}`);
  return staff;
}

export interface PublicStaff {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarColor: string;
  initials: string;
}

/** Safe projection for client components — never carries the password hash. */
export function toPublicStaff(staff: StaffUser): PublicStaff {
  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    avatarColor: staff.avatarColor,
    initials: staff.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
  };
}
