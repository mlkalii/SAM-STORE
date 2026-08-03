"use client";

import * as React from "react";

import { CsrfField, FormBanner, SubmitButton, TextField } from "@/components/auth/form-parts";
import { forgotPasswordAction } from "@/app/actions/auth";
import { idleFormState } from "@/lib/auth/validation";

export function ForgotPasswordForm({ csrfToken }: { csrfToken: string }) {
  const [state, formAction] = React.useActionState(forgotPasswordAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      <FormBanner state={state} />

      {state.ok ? null : (
        <TextField
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={state.errors?.email}
          required
        />
      )}

      {state.ok ? null : <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>}
    </form>
  );
}
