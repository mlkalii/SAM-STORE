"use client";

import { MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import * as React from "react";

import { deleteAddressAction, saveAddressAction } from "@/app/actions/account";
import { EmptyState } from "@/components/account/account-ui";
import { CsrfField, FormBanner, SubmitButton, TextField } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { idleFormState } from "@/lib/auth/validation";
import type { Address } from "@/lib/auth/user-store";
import { cn } from "@/lib/utils";

/**
 * Address book. One form serves both "add" and "edit" — the presence of a
 * hidden id decides which, so there is no duplicate markup.
 */
export function AddressManager({
  csrfToken,
  addresses,
}: {
  csrfToken: string;
  addresses: Address[];
}) {
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [saveState, saveAction] = React.useActionState(saveAddressAction, idleFormState);
  const [deleteState, deleteAction] = React.useActionState(deleteAddressAction, idleFormState);

  const open = adding || editing !== null;

  // Close the editor once a save reports success. This is React's documented
  // "adjust state during render" pattern: compare the action state object with
  // the last one handled, rather than syncing through an effect or a ref.
  const [handled, setHandled] = React.useState(saveState);
  if (handled !== saveState) {
    setHandled(saveState);
    if (saveState.ok && open) {
      setAdding(false);
      setEditing(null);
    }
  }

  return (
    <div className="space-y-6">
      <FormBanner state={saveState.message ? saveState : deleteState} />

      {addresses.length === 0 && !open ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Save an address once and checkout becomes two clicks."
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Add an address
            </Button>
          }
        />
      ) : null}

      {addresses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "rounded-2xl border p-5",
                address.isDefault && "border-gold/40 bg-gold/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {address.label}
                    {address.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                        <Star className="size-2.5 fill-current" aria-hidden />
                        Default
                      </span>
                    ) : null}
                  </p>
                  <address className="mt-2 text-sm not-italic leading-relaxed text-muted-foreground">
                    {address.recipient}
                    <br />
                    {address.line1}
                    {address.line2 ? (
                      <>
                        <br />
                        {address.line2}
                      </>
                    ) : null}
                    <br />
                    {address.city}, {address.postcode}
                    <br />
                    {address.country}
                  </address>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdding(false);
                    setEditing(address);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>

                <form action={deleteAction}>
                  <CsrfField token={csrfToken} />
                  <input type="hidden" name="id" value={address.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                    <Trash2 className="size-3.5" aria-hidden />
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <form action={saveAction} className="rounded-2xl border bg-surface p-5 sm:p-6" noValidate>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-xl">
              {editing ? "Edit address" : "Add an address"}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel"
              onClick={() => {
                setAdding(false);
                setEditing(null);
              }}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>

          <CsrfField token={csrfToken} />
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="label" label="Label" defaultValue={editing?.label ?? "Home"} />
            <TextField
              name="recipient"
              label="Recipient"
              autoComplete="name"
              defaultValue={editing?.recipient}
              error={saveState.errors?.recipient}
              required
            />
            <TextField
              name="line1"
              label="Address line 1"
              autoComplete="address-line1"
              defaultValue={editing?.line1}
              error={saveState.errors?.line1}
              required
            />
            <TextField
              name="line2"
              label="Address line 2 (optional)"
              autoComplete="address-line2"
              defaultValue={editing?.line2}
            />
            <TextField
              name="city"
              label="City"
              autoComplete="address-level2"
              defaultValue={editing?.city}
              error={saveState.errors?.city}
              required
            />
            <TextField
              name="postcode"
              label="Postcode"
              autoComplete="postal-code"
              defaultValue={editing?.postcode}
              error={saveState.errors?.postcode}
              required
            />
            <TextField
              name="country"
              label="Country"
              autoComplete="country-name"
              defaultValue={editing?.country}
              error={saveState.errors?.country}
              required
            />
            <TextField
              name="phone"
              label="Phone (optional)"
              type="tel"
              autoComplete="tel"
              defaultValue={editing?.phone}
            />
          </div>

          <Label
            htmlFor="isDefault"
            className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm font-normal text-muted-foreground"
          >
            <input
              id="isDefault"
              name="isDefault"
              type="checkbox"
              defaultChecked={editing?.isDefault}
              className="size-4 rounded-[4px] border-input accent-foreground"
            />
            Use this as my default delivery address
          </Label>

          <div className="mt-6">
            <SubmitButton className="sm:w-auto sm:px-8" pendingLabel="Saving…">
              {editing ? "Save address" : "Add address"}
            </SubmitButton>
          </div>
        </form>
      ) : addresses.length > 0 ? (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add another address
        </Button>
      ) : null}
    </div>
  );
}
