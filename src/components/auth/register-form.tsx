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
import { registerAction } from "@/app/actions/auth";
import { idleFormState } from "@/lib/auth/validation";

export function RegisterForm({ csrfToken }: { csrfToken: string }) {
  const [state, formAction] = React.useActionState(registerAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      <FormBanner state={state} />

      <TextField
        name="name"
        label="Full name"
        autoComplete="name"
        placeholder="Alex Moreau"
        defaultValue={state.values?.name}
        error={state.errors?.name}
        required
      />

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

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        error={state.errors?.password}
        showMeter
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword}
      />

      <div>
        <Label
          htmlFor="terms"
          className="flex cursor-pointer items-start gap-2.5 text-sm font-normal text-muted-foreground"
        >
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded-[4px] border-input accent-foreground"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-foreground underline underline-offset-4">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4">
              privacy policy
            </Link>
            .
          </span>
        </Label>
        {state.errors?.terms ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {state.errors.terms}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
