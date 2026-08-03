import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/config/auth";
import { verifySession } from "@/lib/auth/session";
import { userStore, type User } from "@/lib/auth/user-store";

/**
 * The read side of authentication.
 *
 * `getCurrentUser` is the only way pages and components learn who is signed in.
 * It is wrapped in `cache()`, so a layout, a page and three components asking
 * in the same request cost one cookie read and one store lookup.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;

  const user = await userStore.findById(payload.sub);
  if (!user) return null;

  // A password change bumps `sessionVersion`, which retires older cookies even
  // though they are still within their expiry.
  if (user.sessionVersion !== payload.ver) return null;

  return user;
});

/**
 * For pages that must have a user. `proxy.ts` already redirects unauthenticated
 * traffic away from protected prefixes; this is the second line, so a route
 * that is ever mis-configured fails closed rather than rendering blank.
 */
export async function requireUser(redirectTo = "/account"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(redirectTo)}`);
  return user;
}

/** Safe projection for client components — never leaks the password hash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarColor: string;
  initials: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    avatarColor: user.avatarColor,
    initials: user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
  };
}
