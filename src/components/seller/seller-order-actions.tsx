"use client";

import * as React from "react";
import { toast } from "sonner";

import { acceptOrderAction, rejectOrderAction, shipOrderAction } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CSRF_FIELD } from "@/config/auth";

/**
 * The three things a seller does to an order: accept it, ship it, or escalate
 * it because they cannot fulfil. Everything else — cancellation, refunds — is
 * marketplace support's, so it is deliberately absent here.
 */
export function SellerOrderActions({
  csrfToken,
  orderId,
  status,
  trackingNumber,
}: {
  csrfToken: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const [tracking, setTracking] = React.useState(trackingNumber ?? "");
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  function post(
    action: (prev: never, form: FormData) => Promise<{ ok: boolean; message?: string }>,
    entries: Record<string, string> = {},
  ) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("orderId", orderId);
      for (const [key, value] of Object.entries(entries)) form.set(key, value);

      const result = await action(undefined as never, form);
      if (result.ok) {
        toast.success(result.message ?? "Done");
        setRejecting(false);
      } else {
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  if (status === "cancelled" || status === "refunded" || status === "delivered") {
    return (
      <p className="text-xs text-muted-foreground">
        This order is closed. Nothing further is needed from you.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {status === "processing" ? (
        <>
          <Button size="sm" className="w-full" disabled={pending} onClick={() => post(acceptOrderAction)}>
            Accept and mark packed
          </Button>

          {rejecting ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="reject-reason" className="text-xs">
                Why can you not fulfil this?
              </Label>
              <Input
                id="reject-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Out of stock at the warehouse"
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs"
                  disabled={pending || !reason}
                  onClick={() => post(rejectOrderAction, { reason })}
                >
                  Send to support
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setRejecting(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => setRejecting(true)}
            >
              I cannot fulfil this
            </Button>
          )}
        </>
      ) : null}

      {status === "packed" || status === "shipped" ? (
        <div className="space-y-2">
          <Label htmlFor="tracking" className="text-xs">
            Tracking number
          </Label>
          <Input
            id="tracking"
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            placeholder="1Z999AA10123456784"
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => post(shipOrderAction, { trackingNumber: tracking })}
          >
            {status === "shipped" ? "Update tracking" : "Mark shipped"}
          </Button>
        </div>
      ) : null}

      {status === "out-for-delivery" ? (
        <p className="text-xs text-muted-foreground">
          Out for delivery with the carrier. Delivery is confirmed by the marketplace.
        </p>
      ) : null}
    </div>
  );
}
