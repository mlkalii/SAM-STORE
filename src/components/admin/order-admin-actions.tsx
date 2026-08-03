"use client";

import * as React from "react";

import { addNoteAction, refundOrderAction, updateOrderStatusAction } from "@/app/actions/admin";
import { CsrfField, FormBanner, SubmitButton } from "@/components/auth/form-parts";
import { Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_FLOW } from "@/lib/commerce/types";
import { idleFormState } from "@/lib/auth/validation";
import { formatPrice } from "@/lib/format";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Staff controls for an order: advance the status, issue a refund, and leave
 * notes. Which controls render is decided by the server from the role, and
 * every action re-checks the permission — the UI is a convenience, not a gate.
 */
export function OrderAdminActions({
  orderId,
  csrfToken,
  status,
  canEdit,
  canRefund,
  canCancel,
  maxRefund,
  notes,
  customerNote,
}: {
  orderId: string;
  csrfToken: string;
  status: string;
  canEdit: boolean;
  canRefund: boolean;
  canCancel: boolean;
  maxRefund: number;
  notes: { id: string; body: string; internal: boolean; by: string; at: string }[];
  customerNote?: string;
}) {
  const [statusState, statusAction] = React.useActionState(updateOrderStatusAction, idleFormState);
  const [refundState, refundAction] = React.useActionState(refundOrderAction, idleFormState);
  const [noteState, noteAction] = React.useActionState(addNoteAction, idleFormState);

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
  const nextStatus = currentIndex >= 0 ? ORDER_STATUS_FLOW[currentIndex + 1] : undefined;

  const banner = statusState.message ? statusState : refundState.message ? refundState : noteState;

  return (
    <div className="space-y-6">
      <FormBanner state={banner} />

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2">
          {nextStatus ? (
            <form action={statusAction}>
              <CsrfField token={csrfToken} />
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="status" value={nextStatus} />
              <SubmitButton className="h-9 w-auto px-4 text-sm" pendingLabel="Updating…">
                Mark as {nextStatus.replaceAll("-", " ")}
              </SubmitButton>
            </form>
          ) : null}

          {canCancel ? (
            <form action={statusAction}>
              <CsrfField token={csrfToken} />
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="status" value="cancelled" />
              <Button type="submit" variant="outline" size="sm">
                Cancel order
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      {canRefund ? (
        <form action={refundAction} className="rounded-lg border bg-surface p-4">
          <CsrfField token={csrfToken} />
          <input type="hidden" name="orderId" value={orderId} />

          <Label htmlFor="refundAmount" className="text-xs">
            Refund amount (leave blank for the full {formatPrice(maxRefund)})
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="refundAmount"
              name="amount"
              inputMode="decimal"
              placeholder={(maxRefund / 100).toFixed(2)}
              className="h-9 max-w-40 text-sm"
            />
            <SubmitButton className="h-9 w-auto px-4 text-sm" pendingLabel="Issuing…">
              Issue refund
            </SubmitButton>
          </div>
        </form>
      ) : null}

      {customerNote ? (
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium">Customer note</p>
          <p className="mt-1 text-xs text-muted-foreground">{customerNote}</p>
        </div>
      ) : null}

      {canEdit ? (
        <form action={noteAction} className="space-y-2.5">
          <CsrfField token={csrfToken} />
          <input type="hidden" name="scope" value="order" />
          <input type="hidden" name="refId" value={orderId} />

          <Label htmlFor="noteBody" className="text-xs">
            Add a note
          </Label>
          <textarea
            id="noteBody"
            name="body"
            rows={2}
            placeholder="Called the courier — redelivery booked for Thursday."
            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
          />
          {noteState.errors?.body ? (
            <p role="alert" className="text-xs text-destructive">
              {noteState.errors.body}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="noteInternal" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                id="noteInternal"
                name="internal"
                type="checkbox"
                defaultChecked
                className="size-3.5 rounded-[3px] border-input accent-foreground"
              />
              Internal only
            </label>
            <SubmitButton className="h-8 w-auto px-4 text-xs" pendingLabel="Saving…">
              Add note
            </SubmitButton>
          </div>
        </form>
      ) : null}

      {notes.length > 0 ? (
        <ul className="space-y-2.5 border-t pt-4">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium">{note.by}</span>
                <Pill tone={note.internal ? "neutral" : "info"}>
                  {note.internal ? "internal" : "customer visible"}
                </Pill>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {dateFormat.format(new Date(note.at))}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
