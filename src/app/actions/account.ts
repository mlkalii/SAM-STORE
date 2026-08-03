"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { issueSession } from "@/lib/auth/issue-session";
import { scorePassword } from "@/lib/auth/password-strength";
import { userStore } from "@/lib/auth/user-store";
import { notifications } from "@/lib/commerce/notifications";
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
 * Account server actions.
 *
 * Same contract as the auth actions: CSRF, validate, act, return `FormState`.
 * Every one re-reads the session rather than trusting an id from the form, so
 * a crafted request cannot edit somebody else's account.
 */

async function guard(form: FormData) {
  if (!(await assertCsrf(form))) {
    return { user: null, error: fail("Your session expired. Refresh and try again.") };
  }
  const user = await getCurrentUser();
  if (!user) return { user: null, error: fail("Please sign in again.") };
  return { user, error: null };
}

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, error } = await guard(form);
  if (!user) return error!;

  const name = field(form, "name");
  const email = field(form, "email");
  const phone = field(form, "phone");
  const marketingOptIn = checkbox(form, "marketingOptIn");

  const errors: Record<string, string> = {};
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  const emailChanged = email.toLowerCase() !== user.email;
  if (emailChanged) {
    const clash = await userStore.findByEmail(email);
    if (clash && clash.id !== user.id) {
      return fail("That email is already in use.", { email: "Already registered" });
    }
  }

  await userStore.update(user.id, {
    name,
    email,
    phone: phone || undefined,
    marketingOptIn,
    // Changing the address means it has to be proved again.
    ...(emailChanged ? { emailVerified: false } : {}),
  });

  revalidatePath("/account", "layout");
  return succeed(
    emailChanged
      ? "Profile updated. Your new email needs verifying before order updates resume."
      : "Profile updated.",
  );
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, error } = await guard(form);
  if (!user) return error!;

  const current = field(form, "currentPassword");
  const next = field(form, "password");
  const confirm = field(form, "confirmPassword");

  const errors: Record<string, string> = {};
  const currentError = validateRequired(current, "Current password");
  if (currentError) errors.currentPassword = currentError;

  const strength = scorePassword(next);
  if (!strength.acceptable) errors.password = strength.suggestions[0] ?? "Choose a stronger password";
  if (next !== confirm) errors.confirmPassword = "Passwords do not match";

  if (Object.keys(errors).length > 0) return fail("Please correct the highlighted fields.", errors);

  const verified = await userStore.verifyCredentials(user.email, current);
  if (!verified) return fail("That current password is not right.", { currentPassword: "Incorrect" });

  const updated = await userStore.setPassword(user.id, next);
  if (!updated) return fail("That password could not be changed. Try again.");

  // `setPassword` bumps the session version, which invalidates every existing
  // cookie — including the one belonging to the device doing the changing. Mint
  // a fresh cookie here, or the user is silently signed out by the very action
  // that was supposed to keep their account safe.
  await issueSession({
    userId: updated.id,
    email: updated.email,
    name: updated.name,
    version: updated.sessionVersion,
    rememberMe: false,
  });

  revalidatePath("/account", "layout");
  return succeed("Password changed. Any other signed-in devices have been logged out.");
}

export async function saveAddressAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, error } = await guard(form);
  if (!user) return error!;

  const id = field(form, "id");
  const values = {
    label: field(form, "label") || "Home",
    recipient: field(form, "recipient"),
    line1: field(form, "line1"),
    line2: field(form, "line2"),
    city: field(form, "city"),
    postcode: field(form, "postcode"),
    country: field(form, "country"),
    phone: field(form, "phone"),
  };

  const errors: Record<string, string> = {};
  for (const [key, label] of [
    ["recipient", "Recipient"],
    ["line1", "Address line 1"],
    ["city", "City"],
    ["postcode", "Postcode"],
    ["country", "Country"],
  ] as const) {
    const message = validateRequired(values[key], label);
    if (message) errors[key] = message;
  }

  if (Object.keys(errors).length > 0) return fail("Please complete the address.", errors);

  const makeDefault = checkbox(form, "isDefault") || user.addresses.length === 0;

  const addresses = user.addresses.map((address) => ({
    ...address,
    isDefault: makeDefault ? false : address.isDefault,
  }));

  const index = id ? addresses.findIndex((address) => address.id === id) : -1;
  const record = {
    id: id || randomUUID(),
    ...values,
    line2: values.line2 || undefined,
    phone: values.phone || undefined,
    isDefault: makeDefault,
  };

  if (index >= 0) addresses[index] = record;
  else addresses.push(record);

  await userStore.update(user.id, { addresses });
  revalidatePath("/account/addresses");
  return succeed(index >= 0 ? "Address updated." : "Address saved.");
}

export async function deleteAddressAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, error } = await guard(form);
  if (!user) return error!;

  const id = field(form, "id");
  const remaining = user.addresses.filter((address) => address.id !== id);

  // Never leave the book without a default.
  if (remaining.length > 0 && !remaining.some((address) => address.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }

  await userStore.update(user.id, { addresses: remaining });
  revalidatePath("/account/addresses");
  return succeed("Address removed.");
}

export async function markNotificationsReadAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { user, error } = await guard(form);
  if (!user) return error!;

  await userStore.update(user.id, {
    notifications: user.notifications.map((notification) => ({ ...notification, read: true })),
  });
  notifications.markAllRead(user.id);

  revalidatePath("/account/notifications");
  revalidatePath("/account", "layout");
  return succeed("All notifications marked as read.");
}
