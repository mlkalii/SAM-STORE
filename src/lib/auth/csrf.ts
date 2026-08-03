import "server-only";

import { cookies } from "next/headers";

import { CSRF_COOKIE, CSRF_FIELD } from "@/config/auth";

/**
 * CSRF protection, double-submit style.
 *
 * Next.js Server Actions already verify the Origin header, which covers the
 * common case. This adds the token layer on top so the protection does not
 * depend on a single check: a random value is stored in a readable cookie and
 * echoed in a hidden field, and the two must match.
 *
 * The token is *minted in `src/proxy.ts`*, not here — cookies cannot be written
 * during a Server Component render, so a page can only read the value the proxy
 * has already placed on the request.
 */
export async function getCsrfToken() {
  return (await cookies()).get(CSRF_COOKIE)?.value ?? "";
}

export async function assertCsrf(form: FormData): Promise<boolean> {
  const submitted = form.get(CSRF_FIELD);
  const expected = (await cookies()).get(CSRF_COOKIE)?.value;
  return Boolean(expected) && typeof submitted === "string" && submitted === expected;
}

export { CSRF_FIELD };
