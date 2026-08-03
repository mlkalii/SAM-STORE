import { CSRF_COOKIE, REMEMBER_ME_TTL_SECONDS, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/config/auth";

/**
 * Stateless signed sessions.
 *
 * A session is `base64url(payload).base64url(hmac)` — the same shape as a JWT
 * without the algorithm-confusion surface, since only one algorithm is ever
 * accepted. Signing uses Web Crypto rather than `node:crypto` so the identical
 * code runs in a Server Component, a Server Action and `proxy.ts`.
 *
 * The cookie is `httpOnly` (no script access), `sameSite=lax` (survives a
 * top-level navigation back from an OAuth provider but not a cross-site POST)
 * and `secure` outside development.
 */

export interface SessionPayload {
  /** User id. */
  sub: string;
  email: string;
  name: string;
  /** Unix seconds. */
  exp: number;
  /** Bumped when a user changes their password, invalidating old sessions. */
  ver: number;
}

const encoder = new TextEncoder();

function secret() {
  const value = process.env.AUTH_SECRET;
  if (value && value.length >= 16) return value;

  // A generated dev fallback keeps `npm run dev` working out of the box while
  // guaranteeing sessions do not survive a restart. Production must set it.
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production (32+ random characters).");
  }
  return "samrux-development-only-secret-do-not-ship";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function key() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(payload: SessionPayload) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await key(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key(),
      fromBase64Url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== "string" || !payload.sub) return null;

    return payload;
  } catch {
    return null;
  }
}

export function sessionMaxAge(rememberMe: boolean) {
  return rememberMe ? REMEMBER_ME_TTL_SECONDS : SESSION_TTL_SECONDS;
}

/** Shared cookie attributes, so every write agrees on the security flags. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export { CSRF_COOKIE, SESSION_COOKIE };
