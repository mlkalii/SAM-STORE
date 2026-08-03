import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/config/auth";
import { sessionCookieOptions, sessionMaxAge, signSession } from "@/lib/auth/session";

/**
 * Signs a session and writes the cookie.
 *
 * Separate from `session.ts` for two reasons:
 *
 *   - `session.ts` is imported by `proxy.ts`, which must not pull in
 *     `next/headers`.
 *   - It must not live in an action file: every export of a `"use server"`
 *     module is reachable as a server action, and an exported "mint a session
 *     for this id" function would let anyone sign in as anyone.
 */
export async function issueSession(input: {
  userId: string;
  email: string;
  name: string;
  version: number;
  rememberMe: boolean;
}) {
  const maxAge = sessionMaxAge(input.rememberMe);
  const token = await signSession({
    sub: input.userId,
    email: input.email,
    name: input.name,
    ver: input.version,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  });

  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
}
