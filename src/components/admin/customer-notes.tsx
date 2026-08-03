"use client";

import * as React from "react";

import { addNoteAction } from "@/app/actions/admin";
import { CsrfField, FormBanner, SubmitButton } from "@/components/auth/form-parts";
import { Label } from "@/components/ui/label";
import { idleFormState } from "@/lib/auth/validation";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function CustomerNotes({
  customerId,
  csrfToken,
  canEdit,
  notes,
}: {
  customerId: string;
  csrfToken: string;
  canEdit: boolean;
  notes: { id: string; body: string; by: string; at: string }[];
}) {
  const [state, formAction] = React.useActionState(addNoteAction, idleFormState);

  return (
    <div className="space-y-4">
      <FormBanner state={state} />

      {canEdit ? (
        <form action={formAction} className="space-y-2.5">
          <CsrfField token={csrfToken} />
          <input type="hidden" name="scope" value="customer" />
          <input type="hidden" name="refId" value={customerId} />
          <input type="hidden" name="internal" value="on" />

          <Label htmlFor="customerNote" className="text-xs">
            Add a note
          </Label>
          <textarea
            id="customerNote"
            name="body"
            rows={2}
            placeholder="Prefers deliveries left with the neighbour at number 12."
            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
          />
          {state.errors?.body ? (
            <p role="alert" className="text-xs text-destructive">
              {state.errors.body}
            </p>
          ) : null}
          <SubmitButton className="h-8 w-auto px-4 text-xs" pendingLabel="Saving…">
            Add note
          </SubmitButton>
        </form>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes on this customer.</p>
      ) : (
        <ul className="space-y-2.5 border-t pt-4">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">{note.by}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {dateFormat.format(new Date(note.at))}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
