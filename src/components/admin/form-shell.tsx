"use client";

import * as React from "react";

import { CsrfField, FormBanner, SubmitButton } from "@/components/auth/form-parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleFormState, type FormState } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

/**
 * Admin form primitives.
 *
 * Every admin form is "server action + CSRF + banner + fields + save button".
 * `AdminForm` is that skeleton; the field components below are compact,
 * label-above-input variants sized for dense admin layouts. Reused across
 * products, categories, brands, settings, staff, inventory and content.
 */
export function AdminForm({
  action,
  csrfToken,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  hidden,
  className,
  footer,
  disabled,
  onSuccess,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  csrfToken: string;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  hidden?: Record<string, string>;
  className?: string;
  footer?: React.ReactNode;
  disabled?: boolean;
  /** Fired once per successful submit — navigate, close a panel, refetch. */
  onSuccess?: (state: FormState) => void;
}) {
  const [state, formAction] = React.useActionState(action, idleFormState);

  // Deliberately an effect, not the adjust-during-render pattern: `onSuccess`
  // typically navigates, and updating the router while another component is
  // rendering is exactly what React warns about. `useActionState` returns a
  // new object per submit, so this fires once per result.
  React.useEffect(() => {
    if (state.ok) onSuccess?.(state);
    // `onSuccess` is intentionally not a dependency — callers pass an inline
    // arrow, which would re-fire the callback on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className={cn("space-y-5", className)} noValidate>
      <CsrfField token={csrfToken} />
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <FormBanner state={state} />

      <AdminFormContext.Provider value={state}>{children}</AdminFormContext.Provider>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <SubmitButton
          className="h-9 w-auto px-5 text-sm"
          pendingLabel={pendingLabel}
          disabled={disabled}
        >
          {submitLabel}
        </SubmitButton>
        {footer}
      </div>
    </form>
  );
}

const AdminFormContext = React.createContext<FormState>(idleFormState);

export function useAdminFormState() {
  return React.useContext(AdminFormContext);
}

export function Field({
  name,
  label,
  hint,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const state = useAdminFormState();
  const error = state.errors?.[name];

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  name,
  label,
  hint,
  className,
  ...rest
}: {
  name: string;
  label: string;
  hint?: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, "name">) {
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      <Input id={name} name={name} className="h-9 text-sm" {...rest} />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  hint,
  rows = 3,
  defaultValue,
  className,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  rows?: number;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </Field>
  );
}

export function SelectInput({
  name,
  label,
  hint,
  options,
  defaultValue,
  className,
  value,
  onValueChange,
}: {
  name: string;
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  className?: string;
  /** Controlled mode — pass both, or neither. */
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const controlled = value !== undefined && onValueChange !== undefined;

  return (
    <Field name={name} label={label} hint={hint} className={className}>
      <select
        id={name}
        name={name}
        {...(controlled
          ? { value, onChange: (event) => onValueChange(event.target.value) }
          : { defaultValue })}
        className="h-9 w-full rounded-md border bg-background px-2.5 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxInput({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label htmlFor={name} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 rounded-[4px] border-input accent-foreground"
      />
      <span>
        <span className="block text-sm">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Two-column grid used by most admin forms. */
export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

/** A labelled group within a long form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t pt-5 first:border-0 first:pt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
