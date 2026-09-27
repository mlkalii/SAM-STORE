"use server";

import { revalidatePath } from "next/cache";

import { assertCsrf } from "@/lib/auth/csrf";
import { fail, field, succeed, type FormState } from "@/lib/auth/validation";
import { getCurrentUser } from "@/lib/auth";
import { messaging } from "@/lib/support/messaging";

/**
 * Customer support mutations.
 *
 * Every action re-checks CSRF and re-derives the customer from the session, so
 * a form can post any id it likes and it will be ignored. A customer may only
 * ever write into their own conversation.
 */

export async function replyAsCustomerAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await assertCsrf(form))) return fail("Your session expired. Refresh and try again.");

  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");

  const threadId = field(form, "threadId");
  const thread = messaging.thread(threadId);
  if (!thread || thread.customerId !== user.id) return fail("That conversation is not yours.");

  const body = field(form, "body");
  if (!body) return fail("Write a reply first.", { body: "Required" });

  messaging.reply({
    threadId,
    authorRole: "customer",
    authorId: user.id,
    authorName: user.name,
    body,
  });

  revalidatePath(`/account/messages/${threadId}`);
  return succeed("Reply sent.");
}
