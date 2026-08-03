"use client";

import Link from "next/link";
import * as React from "react";

import {
  adminForgotPasswordAction,
  adminLoginAction,
  adminResetPasswordAction,
} from "@/app/actions/admin-auth";
import {
  CsrfField,
  FormBanner,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/auth/form-parts";
import { Label } from "@/components/ui/label";
import { idleFormState } from "@/lib/auth/validation";

export function AdminLoginForm({ csrfToken, next }: { csrfToken: string; next?: string }) {
  const [state, formAction] = React.useActionState(adminLoginAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormBanner state={state} />

      <TextField
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        placeholder="you@samrux.com"
        defaultValue={state.values?.email}
        error={state.errors?.email}
        required
      />

      <div>
        <PasswordField name="password" label="Password" error={state.errors?.password} />
        <div className="mt-2 flex items-center justify-between">
          <Label
            htmlFor="rememberMe"
            className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground"
          >
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              className="size-4 rounded-[4px] border-input accent-foreground"
            />
            Stay signed in for a week
          </Label>
          <Link
            href="/admin/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <SubmitButton pendingLabel="Signing in…">Sign in to admin</SubmitButton>
    </form>
  );
}

export function AdminForgotPasswordForm({ csrfToken }: { csrfToken: string }) {
  const [state, formAction] = React.useActionState(adminForgotPasswordAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      <FormBanner state={state} />

      {state.ok ? null : (
        <>
          <TextField
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@samrux.com"
            error={state.errors?.email}
            required
          />
          <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
        </>
      )}
    </form>
  );
}

export function AdminResetPasswordForm({
  csrfToken,
  token,
}: {
  csrfToken: string;
  token: string;
}) {
  const [state, formAction] = React.useActionState(adminResetPasswordAction, idleFormState);

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
