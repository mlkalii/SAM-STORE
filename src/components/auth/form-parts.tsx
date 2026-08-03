"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CSRF_FIELD } from "@/config/auth";
import { scorePassword } from "@/lib/auth/password-strength";
import type { FormState } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for every auth form.
 *
 * One set of primitives — field, password field with meter, banner, submit
 * button — so login, register, reset and the account forms all behave and look
 * identical without repeating markup.
 */

export function CsrfField({ token }: { token: string }) {
  return <input type="hidden" name={CSRF_FIELD} value={token} />;
}

/** Top-of-form banner. Renders success and failure from the same state shape. */
export function FormBanner({ state }: { state: FormState }) {
  if (!state.message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
        state.ok
          ? "border-emerald-600/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/25 bg-destructive/8 text-destructive",
      )}
    >
      {state.ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <span>{state.message}</span>
    </div>
  );
}

export function Field({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  type = "text",
  error,
  hint,
  defaultValue,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "type" | "defaultValue">) {
  return (
    <Field name={name} label={label} error={error} hint={hint}>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className="h-11"
        {...rest}
      />
    </Field>
  );
}

/** Password field with a reveal toggle and, optionally, a live strength meter. */
export function PasswordField({
  name,
  label,
  error,
  autoComplete = "current-password",
  showMeter = false,
}: {
  name: string;
  label: string;
  error?: string;
  autoComplete?: string;
  showMeter?: boolean;
}) {
  const [visible, setVisible] = React.useState(false);
  const [value, setValue] = React.useState("");
  const strength = showMeter && value ? scorePassword(value) : null;

  return (
    <Field name={name} label={label} error={error}>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="h-11 pr-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </Button>
      </div>

      {strength ? (
        <div className="pt-1">
          <div className="flex items-center gap-2">
            <div className="flex h-1 flex-1 gap-1" aria-hidden>
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-full flex-1 rounded-full transition-colors",
                    index < strength.score
                      ? strength.score >= 4
                        ? "bg-emerald-500"
                        : strength.score >= 3
                          ? "bg-gold"
                          : "bg-amber-500"
                      : "bg-muted",
                  )}
                />
              ))}
            </div>
            <span className="w-14 text-right text-[11px] text-muted-foreground">
              {strength.label}
            </span>
          </div>
          {strength.suggestions[0] ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{strength.suggestions[0]}</p>
          ) : null}
        </div>
      ) : null}
    </Field>
  );
}

/** Submit button that shows the pending state of the enclosing form. */
export function SubmitButton({
  children,
  className,
  pendingLabel = "Working…",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending || disabled}
      className={cn("h-11 w-full", className)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
