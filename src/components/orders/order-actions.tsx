"use client";

import { RotateCcw, ShoppingBag, Undo2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  cancelOrderAction,
  requestRefundAction,
  requestReturnAction,
} from "@/app/actions/checkout";
import { CsrfField, FormBanner, SubmitButton } from "@/components/auth/form-parts";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { idleFormState } from "@/lib/auth/validation";
import type { Order } from "@/lib/commerce/types";

/**
 * Order lifecycle controls.
 *
 * Which controls appear is decided by the server (`canCancel` / `canReturn`),
 * passed down as booleans — the client never re-derives eligibility rules.
 */
export function OrderActions({
  order,
  csrfToken,
  canCancel,
  canReturn,
  canRefund,
  reorderItems,
}: {
  order: Order;
  csrfToken: string;
  canCancel: boolean;
  canReturn: boolean;
  canRefund: boolean;
  reorderItems: { slug: string; variantId: string; quantity: number }[];
}) {
  const [cancelState, cancelAction] = React.useActionState(cancelOrderAction, idleFormState);
  const [returnState, returnAction] = React.useActionState(requestReturnAction, idleFormState);
  const [refundState, refundAction] = React.useActionState(requestRefundAction, idleFormState);

  const [showCancel, setShowCancel] = React.useState(false);
  const [showReturn, setShowReturn] = React.useState(false);

  const banner = cancelState.message
    ? cancelState
    : returnState.message
      ? returnState
      : refundState;

  return (
    <div className="space-y-5">
      <FormBanner state={banner} />

      <div className="flex flex-wrap gap-2.5">
        <ReorderButton items={reorderItems} />

        {canCancel ? (
          <Button variant="outline" onClick={() => setShowCancel((value) => !value)}>
            <XCircle className="size-4" aria-hidden />
            Cancel order
          </Button>
        ) : null}

        {canReturn ? (
          <Button variant="outline" onClick={() => setShowReturn((value) => !value)}>
            <Undo2 className="size-4" aria-hidden />
            Return items
          </Button>
        ) : null}

        {canRefund ? (
          <form action={refundAction}>
            <CsrfField token={csrfToken} />
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" variant="ghost" className="text-muted-foreground">
              <RotateCcw className="size-4" aria-hidden />
              Request refund
            </Button>
          </form>
        ) : null}
      </div>

      {showCancel ? (
        <form action={cancelAction} className="rounded-xl border bg-surface p-4">
          <CsrfField token={csrfToken} />
          <input type="hidden" name="orderId" value={order.id} />

          <Label htmlFor="cancelReason" className="text-sm">
            Why are you cancelling? (optional)
          </Label>
          <textarea
            id="cancelReason"
            name="reason"
            rows={2}
            className="mt-2 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Ordered the wrong size"
          />
          <div className="mt-3">
            <SubmitButton className="h-10 w-auto px-5 text-sm" pendingLabel="Cancelling…">
              Confirm cancellation
            </SubmitButton>
          </div>
        </form>
      ) : null}

      {showReturn ? (
        <form action={returnAction} className="rounded-xl border bg-surface p-4">
          <CsrfField token={csrfToken} />
          <input type="hidden" name="orderId" value={order.id} />

          <Label htmlFor="returnReason" className="text-sm">
            What is going back, and why?
          </Label>
          <textarea
            id="returnReason"
            name="reason"
            rows={3}
            required
            className="mt-2 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="The jacket runs large — I need the next size down."
          />
          {returnState.errors?.reason ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {returnState.errors.reason}
            </p>
          ) : null}
          <div className="mt-3">
            <SubmitButton className="h-10 w-auto px-5 text-sm" pendingLabel="Starting…">
              Start return
            </SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/** Re-adds every line of a past order to the live cart. */
function ReorderButton({
  items,
}: {
  items: { slug: string; variantId: string; quantity: number }[];
}) {
  const { addMany } = useCart();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      disabled={pending || items.length === 0}
      onClick={async () => {
        setPending(true);
        const added = await addMany(items);
        setPending(false);

        if (added === 0) {
          toast.error("Nothing from that order is available right now.");
          return;
        }

        toast.success(`${added} item${added === 1 ? "" : "s"} added to your cart`);
        router.push("/cart");
      }}
    >
      <ShoppingBag className="size-4" aria-hidden />
      {pending ? "Adding…" : "Reorder"}
    </Button>
  );
}
