"use client";

import * as React from "react";

import { updateProfileAction } from "@/app/actions/account";
import { CsrfField, FormBanner, SubmitButton, TextField } from "@/components/auth/form-parts";
import { Label } from "@/components/ui/label";
import { idleFormState } from "@/lib/auth/validation";

export function ProfileForm({
  csrfToken,
  defaults,
}: {
  csrfToken: string;
  defaults: { name: string; email: string; phone: string; marketingOptIn: boolean };
}) {
  const [state, formAction] = React.useActionState(updateProfileAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <CsrfField token={csrfToken} />
      <FormBanner state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="Full name"
          autoComplete="name"
          defaultValue={defaults.name}
          error={state.errors?.name}
          required
        />
        <TextField
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          defaultValue={defaults.email}
          error={state.errors?.email}
          hint="Changing this requires verifying the new address"
          required
        />
      </div>

      <TextField
        name="phone"
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        defaultValue={defaults.phone}
        hint="Used only for delivery questions"
      />

      <Label
        htmlFor="marketingOptIn"
        className="flex cursor-pointer items-start gap-2.5 text-sm font-normal text-muted-foreground"
      >
        <input
          id="marketingOptIn"
          name="marketingOptIn"
          type="checkbox"
          defaultChecked={defaults.marketingOptIn}
          className="mt-0.5 size-4 shrink-0 rounded-[4px] border-input accent-foreground"
        />
        Email me restock notices and price drops (six times a year at most)
      </Label>

      <SubmitButton className="sm:w-auto sm:px-8" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
