"use client";

import * as React from "react";

import {
  CsrfField,
  FormBanner,
  PasswordField,
  SubmitButton,
} from "@/components/auth/form-parts";
import { resetPasswordAction } from "@/app/actions/auth";
import { idleFormState } from "@/lib/auth/validation";

export function ResetPasswordForm({ csrfToken, token }: { csrfToken: string; token: string }) {
  const [state, formAction] = React.useActionState(resetPasswordAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      <input type="hidden" name="token" value={token} />

      <FormBanner state={state} />

      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        error={state.errors?.password}
        showMeter
      />
      <PasswordField
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword}
      />

      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
