import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_LOGIN,
  ADMIN_ROOT,
  ADMIN_SESSION_COOKIE,
} from "@/config/admin";
import {
  AFTER_LOGIN_REDIRECT,
  CSRF_COOKIE,
  GUEST_ONLY_PREFIXES,
  PROTECTED_PREFIXES,
  SESSION_COOKIE,
} from "@/config/auth";
import { verifyAdminSession } from "@/lib/admin/session";
import { verifySession } from "@/lib/auth/session";
import { bucketForPath, rateLimiter } from "@/lib/security/rate-limit";

/** Admin routes that must stay reachable without a staff session. */
const ADMIN_PUBLIC_PATHS = [ADMIN_LOGIN, "/admin/forgot-password", "/admin/reset-password"];

/**
 * Ensures a CSRF token exists for this request.
 *
 * It has to happen here: `cookies().set()` throws in a Server Component render,
 * so a page can never mint its own. Setting it on the *request* as well as the
 * response means the very first render already sees the value and its forms
 * carry a token that will validate.
 */
function ensureCsrfToken(request: NextRequest): string | null {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  if (existing) return null;

  const token = crypto.randomUUID();
  request.cookies.set(CSRF_COOKIE, token);
  return token;
}

/**
 * Strict-Transport-Security, decided per request.
 *
 * It cannot live in `next.config.ts`: `headers()` runs at build time and is
 * baked into the routes manifest, so a build that did not happen to have
 * `NEXT_PUBLIC_SITE_URL` set would ship a production site with no HSTS at all,
 * and a production build served over plain http — a local smoke test, or a
 * container behind a proxy that has not been given TLS yet — would pin a host
 * that cannot answer over https. (Chrome and Firefox exempt localhost; WebKit
 * does not, so Safari breaks until the user clears the HSTS cache.)
 *
 * The request's own protocol is the only signal that is right in every one of
 * those cases. Behind a load balancer that is `x-forwarded-proto`.
 */
function withHsts(response: NextResponse, request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwarded ?? request.nextUrl.protocol.replace(":", "");
  if (protocol === "https") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

function withCsrf(response: NextResponse, minted: string | null, request: NextRequest) {
  if (minted) {
    response.cookies.set(CSRF_COOKIE, minted, {
      // Readable by the form renderer, not httpOnly — the protection is that a
      // cross-origin page cannot read it, not that it is secret.
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return withHsts(response, request);
}

/**
 * Route protection and CSRF issuance.
 *
 * Next 16 renamed `middleware` to `proxy`; the runtime is Node, so the same Web
 * Crypto session verification used everywhere else works here too.
 *
 * Session checking here only proves the cookie is *signed and unexpired* — it
 * deliberately does not touch the user store, because this runs on every
 * matched request. Pages call `requireUser()`, which does the full lookup, so a
 * revoked session still fails at the page even if it slips past here.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Rate limiting before anything else touches the request. POSTs only — the
  // limited paths are all form submissions or API mutations.
  if (request.method === "POST") {
    const bucket = bucketForPath(pathname);
    if (bucket) {
      const client =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      const verdict = rateLimiter.check(bucket, client);
      if (!verdict.allowed) {
        return withHsts(
          new NextResponse("Too many requests. Try again shortly.", {
            status: 429,
            headers: { "retry-after": String(verdict.retryAfterSeconds) },
          }),
          request,
        );
      }
    }
  }

  const mintedCsrf = ensureCsrfToken(request);

  /*
   * The admin panel is a separate authentication domain: its own cookie, its
   * own secret, its own sign-in page. A customer session grants nothing here,
   * and a staff session grants nothing on the storefront.
   */
  if (pathname === ADMIN_ROOT || pathname.startsWith(`${ADMIN_ROOT}/`)) {
    const isAdminPublic = ADMIN_PUBLIC_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    const adminSession = await verifyAdminSession(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    );

    if (!isAdminPublic && !adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return withCsrf(NextResponse.redirect(url), mintedCsrf, request);
    }

    if (isAdminPublic && adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_ROOT;
      url.search = "";
      return withCsrf(NextResponse.redirect(url), mintedCsrf, request);
    }

    return withCsrf(NextResponse.next({ request }), mintedCsrf, request);
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isGuestOnly = GUEST_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected && !isGuestOnly) {
    return withCsrf(NextResponse.next({ request }), mintedCsrf, request);
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return withCsrf(NextResponse.redirect(url), mintedCsrf, request);
  }

  if (isGuestOnly && session) {
    const url = request.nextUrl.clone();
    url.pathname = AFTER_LOGIN_REDIRECT;
    url.search = "";
    return withCsrf(NextResponse.redirect(url), mintedCsrf, request);
  }

  return withCsrf(NextResponse.next({ request }), mintedCsrf, request);
}

export const config = {
  // Everything except static assets, images and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
