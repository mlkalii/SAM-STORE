"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AFTER_LOGIN_REDIRECT,
  AFTER_LOGOUT_REDIRECT,
  SESSION_COOKIE,
  TOKEN_TTL_SECONDS,
} from "@/config/auth";
import { siteConfig } from "@/config/site";
import { sendEmail } from "@/lib/email/send";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { scorePassword } from "@/lib/auth/password-strength";
import { sessionCookieOptions, sessionMaxAge, signSession } from "@/lib/auth/session";
import { seedDemoOrders } from "@/lib/auth/seed";
import { userStore } from "@/lib/auth/user-store";
import {
  checkbox,
  fail,
  field,
  succeed,
  validateEmail,
  validateName,
  validateRequired,
  type FormState,
} from "@/lib/auth/validation";

/**
 * Authentication server actions.
 *
 * Every action: checks CSRF, validates input, then acts. They all return the
 * same `FormState` shape so one set of form components renders all of them.
 *
 * Note on emails: there is no mail transport wired up, so verification and
 * reset links are returned in the action result (and logged) rather than sent.
 * Swap `deliverLink` for a real transport and nothing else changes.
 */

function absolute(path: string) {
  return `${siteConfig.url}${path}`;
}

/**
 * Constrains a `?next=` destination to this site.
 *
 * A leading-slash test alone is not enough: `//evil.example` and `/\evil.example`
 * both start with `/` and are read by browsers as scheme-relative URLs, which
 * turns the sign-in form into an open redirect — the classic phishing primitive,
 * since the victim really did land on our login page before being sent on.
 */
function safeNext(next: string): string {
  const isSameSite = /^\/(?![/\\])/.test(next);
  return isSameSite ? next : AFTER_LOGIN_REDIRECT;
}

async function startSession(
  userId: string,
  email: string,
  name: string,
  version: number,
  rememberMe: boolean,
) {
  const maxAge = sessionMaxAge(rememberMe);
  const token = await signSession({
    sub: userId,
    email,
    name,
    ver: version,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  });

  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
}

/* -------------------------------------------------------------------------- */

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) {
    return fail("Your session expired. Refresh the page and try again.");
  }

  const name = field(form, "name");
  const email = field(form, "email");
  const password = field(form, "password");
  const confirm = field(form, "confirmPassword");
  const accepted = checkbox(form, "terms");
  const values = { name, email };

  const errors: Record<string, string> = {};
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const strength = scorePassword(password);
  if (!strength.acceptable) {
    errors.password = strength.suggestions[0] ?? "Choose a stronger password";
  }
  if (password !== confirm) errors.confirmPassword = "Passwords do not match";
  if (!accepted) errors.terms = "Please accept the terms to continue";

  if (Object.keys(errors).length > 0) {
    return fail("Please correct the highlighted fields.", errors, values);
  }

  if (await userStore.findByEmail(email)) {
    return fail("An account already exists for that email.", { email: "Already registered" }, values);
  }

  const user = await userStore.create({ email, name, password });
  // Gives the dashboard something real to render on a brand-new account.
  await seedDemoOrders(user);
  const token = await userStore.issueToken(user.id, "verify-email", TOKEN_TTL_SECONDS);

  await sendEmail("welcome", user.email, { name: user.name });
  await sendEmail("verify-email", user.email, {
    name: user.name,
    url: absolute(`/verify-email?token=${token}`),
  });

  await startSession(user.id, user.email, user.name, user.sessionVersion, true);
  redirect(`/verify-email?token=${token}&welcome=1`);
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) {
    return fail("Your session expired. Refresh the page and try again.");
  }

  const email = field(form, "email");
  const password = field(form, "password");
  const rememberMe = checkbox(form, "rememberMe");
  const next = field(form, "next") || AFTER_LOGIN_REDIRECT;

  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validateRequired(password, "Password");
  if (passwordError) errors.password = passwordError;

  if (Object.keys(errors).length > 0) {
    return fail("Please correct the highlighted fields.", errors, { email });
  }

  const user = await userStore.verifyCredentials(email, password);
  if (!user) {
    // Deliberately does not say which half was wrong.
    return fail("Those details do not match an account.", {}, { email });
  }

  await startSession(user.id, user.email, user.name, user.sessionVersion, rememberMe);
  redirect(safeNext(next));
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(AFTER_LOGOUT_REDIRECT);
}

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) {
    return fail("Your session expired. Refresh the page and try again.");
  }

  const email = field(form, "email");
  const emailError = validateEmail(email);
  if (emailError) return fail("Please correct the highlighted field.", { email: emailError });

  const user = await userStore.findByEmail(email);
  if (user) {
    const token = await userStore.issueToken(user.id, "reset-password", TOKEN_TTL_SECONDS);
    await sendEmail("password-reset", user.email, {
      name: user.name,
      url: absolute(`/reset-password?token=${token}`),
    });
  }

  // Same answer either way: this endpoint must not reveal who has an account.
  return succeed(
    "If that email has an account, a reset link is on its way. The link expires in one hour.",
  );
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) {
    return fail("Your session expired. Refresh the page and try again.");
  }

  const token = field(form, "token");
  const password = field(form, "password");
  const confirm = field(form, "confirmPassword");

  if (!token) return fail("That reset link is not valid. Request a new one.");

  const strength = scorePassword(password);
  const errors: Record<string, string> = {};
  if (!strength.acceptable) errors.password = strength.suggestions[0] ?? "Choose a stronger password";
  if (password !== confirm) errors.confirmPassword = "Passwords do not match";
  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  const record = await userStore.consumeToken(token, "reset-password");
  if (!record) return fail("That reset link has expired or has already been used.");

  const user = await userStore.setPassword(record.userId, password);
  if (!user) return fail("We could not find that account.");

  // Signing back in immediately, with the new session version.
  await startSession(user.id, user.email, user.name, user.sessionVersion, false);
  redirect("/account?reset=1");
}

export async function verifyEmailAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) {
    return fail("Your session expired. Refresh the page and try again.");
  }

  const token = field(form, "token");
  const record = await userStore.consumeToken(token, "verify-email");
  if (!record) return fail("That verification link has expired. Send yourself a new one.");

  await userStore.update(record.userId, { emailVerified: true });
  redirect("/account?verified=1");
}

export async function resendVerificationAction(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in first.");
  if (user.emailVerified) return succeed("That address is already verified.");

  const token = await userStore.issueToken(user.id, "verify-email", TOKEN_TTL_SECONDS);
  await sendEmail("verify-email", user.email, {
    name: user.name,
    url: absolute(`/verify-email?token=${token}`),
  });

  return succeed("A fresh verification link is on its way.");
}
