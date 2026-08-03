"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_LOGIN, ADMIN_ROOT, ADMIN_SESSION_COOKIE } from "@/config/admin";
import { siteConfig } from "@/config/site";
import { getAdminUser } from "@/lib/admin/auth";
import { adminCookieOptions, adminSessionMaxAge, signAdminSession } from "@/lib/admin/session";
import { staffStore } from "@/lib/admin/staff-store";
import { assertCsrf } from "@/lib/auth/csrf";
import { scorePassword } from "@/lib/auth/password-strength";
import { sendEmail } from "@/lib/email/send";
import {
  checkbox,
  fail,
  field,
  succeed,
  validateEmail,
  validateRequired,
  type FormState,
} from "@/lib/auth/validation";

/** One hour, same as the storefront's reset window. */
const RESET_TTL = 60 * 60;

async function startAdminSession(
  staffId: string,
  email: string,
  name: string,
  role: Parameters<typeof signAdminSession>[0]["role"],
  version: number,
  remember: boolean,
) {
  const maxAge = adminSessionMaxAge(remember);
  const token = await signAdminSession({
    sub: staffId,
    email,
    name,
    role,
    ver: version,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  });
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, adminCookieOptions(maxAge));
}

export async function adminLoginAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const email = field(form, "email");
  const password = field(form, "password");
  const remember = checkbox(form, "rememberMe");
  const next = field(form, "next") || ADMIN_ROOT;

  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validateRequired(password, "Password");
  if (passwordError) errors.password = passwordError;

  if (Object.keys(errors).length > 0) {
    return fail("Please correct the highlighted fields.", errors, { email });
  }

  const staff = await staffStore.verify(email, password);
  if (!staff) {
    // Never reveals whether the address exists or the account is suspended.
    return fail("Those details do not match an active staff account.", {}, { email });
  }

  await staffStore.update(staff.id, { lastSeenAt: new Date().toISOString() });
  await startAdminSession(staff.id, staff.email, staff.name, staff.role, staff.sessionVersion, remember);

  redirect(next.startsWith("/admin") ? next : ADMIN_ROOT);
}

export async function adminLogoutAction() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
  redirect(ADMIN_LOGIN);
}

export async function adminForgotPasswordAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const email = field(form, "email");
  const emailError = validateEmail(email);
  if (emailError) return fail("Please correct the highlighted field.", { email: emailError });

  const staff = await staffStore.findByEmail(email);
  if (staff) {
    const token = await staffStore.issueToken(staff.id, RESET_TTL);
    await sendEmail("password-reset", staff.email, {
      name: staff.name,
      url: `${siteConfig.url}/admin/reset-password?token=${token}`,
    });
  }

  return succeed("If that address belongs to a staff account, a reset link is on its way.");
}

export async function adminResetPasswordAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const token = field(form, "token");
  const password = field(form, "password");
  const confirm = field(form, "confirmPassword");
  if (!token) return fail("That reset link is not valid. Request a new one.");

  const errors: Record<string, string> = {};
  const strength = scorePassword(password);
  if (!strength.acceptable) errors.password = strength.suggestions[0] ?? "Choose a stronger password";
  if (password !== confirm) errors.confirmPassword = "Passwords do not match";
  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  const record = await staffStore.consumeToken(token);
  if (!record) return fail("That reset link has expired or has already been used.");

  const staff = await staffStore.setPassword(record.staffId, password);
  if (!staff) return fail("We could not find that staff account.");

  await startAdminSession(staff.id, staff.email, staff.name, staff.role, staff.sessionVersion, false);
  redirect(`${ADMIN_ROOT}?reset=1`);
}

export async function adminChangePasswordAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const staff = await getAdminUser();
  if (!staff) return fail("Please sign in again.");

  const current = field(form, "currentPassword");
  const next = field(form, "password");
  const confirm = field(form, "confirmPassword");

  const errors: Record<string, string> = {};
  if (!current) errors.currentPassword = "Current password is required";
  const strength = scorePassword(next);
  if (!strength.acceptable) errors.password = strength.suggestions[0] ?? "Choose a stronger password";
  if (next !== confirm) errors.confirmPassword = "Passwords do not match";
  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  const verified = await staffStore.verify(staff.email, current);
  if (!verified) return fail("That current password is not right.", { currentPassword: "Incorrect" });

  await staffStore.setPassword(staff.id, next);
  return succeed("Password changed. Other admin sessions have been signed out.");
}
