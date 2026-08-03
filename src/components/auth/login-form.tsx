"use client";

import Link from "next/link";
import * as React from "react";

import {
  CsrfField,
  FormBanner,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/auth/form-parts";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/actions/auth";
import { idleFormState } from "@/lib/auth/validation";

export function LoginForm({ csrfToken, next }: { csrfToken: string; next?: string }) {
  const [state, formAction] = React.useActionState(loginAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormBanner state={state} />

      <TextField
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
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
            Remember me for 30 days
          </Label>

          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
