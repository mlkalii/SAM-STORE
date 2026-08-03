"use client";

import * as React from "react";

import { markNotificationsReadAction } from "@/app/actions/account";
import { CsrfField, SubmitButton } from "@/components/auth/form-parts";
import { idleFormState } from "@/lib/auth/validation";

export function MarkAllRead({ csrfToken }: { csrfToken: string }) {
  const [, formAction] = React.useActionState(markNotificationsReadAction, idleFormState);

  return (
    <form action={formAction}>
      <CsrfField token={csrfToken} />
      <SubmitButton className="h-9 w-auto px-4 text-sm" pendingLabel="Marking…">
        Mark all read
      </SubmitButton>
    </form>
  );
}
