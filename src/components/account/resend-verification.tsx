"use client";

import * as React from "react";
import { toast } from "sonner";

import { resendVerificationAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

/** Requests a fresh verification link and reports the outcome inline. */
export function ResendVerification() {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await resendVerificationAction();
          if (result.ok) toast.success(result.message ?? "Link sent");
          else toast.error(result.message ?? "Could not send the link");
        })
      }
    >
      {pending ? "Sending…" : "Resend link"}
    </Button>
  );
}
