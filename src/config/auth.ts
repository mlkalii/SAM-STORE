/**
 * Authentication configuration.
 *
 * Everything tunable about sessions and providers lives here so the auth
 * modules stay mechanism-only. Nothing in this file is secret; the signing key
 * comes from the environment (see `lib/auth/session.ts`).
 */

export const SESSION_COOKIE = "samrux_session";
export const CSRF_COOKIE = "samrux_csrf";
export const CSRF_FIELD = "csrfToken";

/** How long a session lasts without "remember me". */
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/** How long a session lasts with "remember me" ticked. */
export const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Single-use tokens for email verification and password resets. */
export const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

/** Routes that require a signed-in user. Checked in `src/proxy.ts`. */
/**
 * `/seller` is here too: a seller account is a customer account that owns a
 * store, so the same session guards it. The seller layout does the finer check
 * — that the store exists and is approved.
 */
export const PROTECTED_PREFIXES = ["/account", "/checkout", "/seller"];

/** Routes a signed-in user should be bounced away from. */
export const GUEST_ONLY_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

export const AFTER_LOGIN_REDIRECT = "/account";
export const AFTER_LOGOUT_REDIRECT = "/";

/**
 * Social providers.
 *
 * The architecture is in place — provider metadata, the button row, the
 * callback route shape — but no provider is wired to a real OAuth app yet.
 * Set `enabled` once client credentials exist in the environment; the UI reads
 * this list and needs no further change.
 */
export interface SocialProvider {
  id: "google" | "apple";
  label: string;
  /** Where the sign-in flow would start. */
  authorizeUrl: string;
  /** Environment variables that must be present before this can be enabled. */
  requiredEnv: string[];
  enabled: boolean;
}

export const socialProviders: SocialProvider[] = [
  {
    id: "google",
    label: "Continue with Google",
    authorizeUrl: "/api/auth/google",
    requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  {
    id: "apple",
    label: "Continue with Apple",
    authorizeUrl: "/api/auth/apple",
    requiredEnv: ["APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"],
    enabled: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID),
  },
];
