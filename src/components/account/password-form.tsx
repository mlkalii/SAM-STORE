"use client";

import * as React from "react";

import { changePasswordAction } from "@/app/actions/account";
import {
  CsrfField,
  FormBanner,
  PasswordField,
  SubmitButton,
} from "@/components/auth/form-parts";
import { idleFormState } from "@/lib/auth/validation";

export function PasswordForm({ csrfToken }: { csrfToken: string }) {
  const [state, formAction] = React.useActionState(changePasswordAction, idleFormState);

  return (
    <form action={formAction} className="max-w-md space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      <FormBanner state={state} />

      <PasswordField
        name="currentPassword"
        label="Current password"
        error={state.errors?.currentPassword}
      />
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

      <SubmitButton className="sm:w-auto sm:px-8" pendingLabel="Updating…">
        Change password
      </SubmitButton>
    </form>
  );
}
