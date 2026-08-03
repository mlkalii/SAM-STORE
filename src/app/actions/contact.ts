"use server";

import { assertCsrf } from "@/lib/auth/csrf";
import { sendEmail } from "@/lib/email/send";
import {
  fail,
  field,
  succeed,
  validateEmail,
  validateName,
  validateRequired,
  type FormState,
} from "@/lib/auth/validation";

/**
 * Contact form.
 *
 * Validates, then sends the customer their confirmation through the same email
 * pipeline as every other transactional message. The internal copy to the
 * support inbox is the line to add once a transport is configured.
 */
export async function contactAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) {
    return fail("Your session expired. Refresh the page and try again.");
  }

  const name = field(form, "name");
  const email = field(form, "email");
  const topic = field(form, "topic") || "Something else";
  const message = field(form, "message");

  const errors: Record<string, string> = {};
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const messageError = validateRequired(message, "Message");
  if (messageError) errors.message = messageError;
  if (!messageError && message.length < 10) errors.message = "Tell us a little more";

  if (Object.keys(errors).length > 0) {
    return fail("Please correct the highlighted fields.", errors, { name, email });
  }

  await sendEmail("contact-confirmation", email, { name, topic });

  return succeed(
    `Thanks ${name} — your message about ${topic.toLowerCase()} is with a real person. Expect a reply within one working day.`,
  );
}
