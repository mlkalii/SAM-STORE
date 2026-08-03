"use client";

import * as React from "react";

import { CsrfField, FormBanner, SubmitButton } from "@/components/auth/form-parts";
import { verifyEmailAction } from "@/app/actions/auth";
import { idleFormState } from "@/lib/auth/validation";

export function VerifyEmailForm({ csrfToken, token }: { csrfToken: string; token: string }) {
  const [state, formAction] = React.useActionState(verifyEmailAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <CsrfField token={csrfToken} />
      <input type="hidden" name="token" value={token} />

      <FormBanner state={state} />

      <SubmitButton pendingLabel="Verifying…">Verify my email address</SubmitButton>
    </form>
  );
}
