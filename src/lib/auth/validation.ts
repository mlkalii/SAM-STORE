/**
 * Form validation.
 *
 * Hand-rolled rather than pulling in a schema library: the rule set is small,
 * fully typed, and shared by client-side hints and the authoritative
 * server-side check. `FormState` is the single shape every auth action returns,
 * so one `<FormMessages>` component renders all of them.
 */

export interface FormState {
  ok: boolean;
  /** Message shown at the top of the form. */
  message?: string;
  /** Field name → first error for that field. */
  errors?: Record<string, string>;
  /** Values to re-populate the form with after a failed submit. */
  values?: Record<string, string>;
  /**
   * Anything the client needs after a successful submit — the id of the
   * record just created, so the form can navigate to it.
   */
  data?: Record<string, string>;
}

export const idleFormState: FormState = { ok: false };

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function validateEmail(value: unknown): string | null {
  const email = typeof value === "string" ? value.trim() : "";
  if (!email) return "Enter your email address";
  if (email.length > 254) return "That email address is too long";
  if (!EMAIL.test(email)) return "Enter a valid email address";
  return null;
}

export function validateName(value: unknown): string | null {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) return "Enter your name";
  if (name.length < 2) return "That name looks too short";
  if (name.length > 80) return "That name is too long";
  return null;
}

export function validateRequired(value: unknown, label: string): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? null : `${label} is required`;
}

/** Trims and coerces a FormData entry to a string. */
export function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function checkbox(form: FormData, name: string) {
  return form.get(name) === "on" || form.get(name) === "true";
}

export function fail(message: string, errors?: Record<string, string>, values?: Record<string, string>): FormState {
  return { ok: false, message, ...(errors ? { errors } : {}), ...(values ? { values } : {}) };
}

export function succeed(message: string, data?: Record<string, string>): FormState {
  return { ok: true, message, ...(data ? { data } : {}) };
}
