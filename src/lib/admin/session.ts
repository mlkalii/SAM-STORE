import { ADMIN_REMEMBER_TTL_SECONDS, ADMIN_SESSION_TTL_SECONDS, type AdminRole } from "@/config/admin";

/**
 * Admin sessions.
 *
 * Same signed-cookie mechanism as the storefront but a *separate* key and
 * cookie, so a customer session can never be mistaken for a staff session even
 * if one were forged. Web Crypto, so this also runs inside `proxy.ts`.
 */

export interface AdminSessionPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  exp: number;
  ver: number;
}

const encoder = new TextEncoder();

function secret() {
  const value = process.env.ADMIN_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (value && value.length >= 16) return `admin:${value}`;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_AUTH_SECRET must be set in production (32+ random characters).");
  }
  return "samrux-admin-development-only-secret";
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
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signAdminSession(payload: AdminSessionPayload) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await key(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(
  token: string | undefined,
): Promise<AdminSessionPayload | null> {
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

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as AdminSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminSessionMaxAge(remember: boolean) {
  return remember ? ADMIN_REMEMBER_TTL_SECONDS : ADMIN_SESSION_TTL_SECONDS;
}

export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    // Scoped to /admin: the cookie is never sent with storefront requests.
    path: "/",
    maxAge,
  };
}
