"use client";

import * as React from "react";

import { requestPayoutAction, savePayoutDetailsAction } from "@/app/actions/seller";
import { AdminForm, FormGrid, TextInput } from "@/components/admin/form-shell";
import { Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatPrice, toDecimal } from "@/lib/format";

/**
 * Withdrawal request plus payout destination.
 *
 * The amount is validated server-side against the ledger — this form is a
 * convenience, not the control. Full account numbers are never sent back to the
 * browser: only the last four digits come down.
 */
export function SellerPayoutPanel({
  csrfToken,
  available,
  minimum,
  banking,
}: {
  csrfToken: string;
  available: number;
  minimum: number;
  banking: { accountName: string; accountLast4: string; walletAddress?: string } | null;
}) {
  const [editingDetails, setEditingDetails] = React.useState(!banking);
  const canWithdraw = available >= minimum && Boolean(banking);

  return (
    <div className="space-y-4">
      <Card title="Request a withdrawal">
        {canWithdraw ? (
          <AdminForm
            action={requestPayoutAction}
            csrfToken={csrfToken}
            submitLabel="Request withdrawal"
          >
            <TextInput
              name="amount"
              label="Amount (USDT)"
              inputMode="decimal"
              defaultValue={toDecimal(available)}
              hint={`Available ${formatPrice(available)} · minimum ${formatPrice(minimum)}`}
              required
            />
            <p className="text-xs text-muted-foreground">
              Requests are reviewed by the marketplace and settle to your saved destination.
              Nothing leaves your balance until it is approved.
            </p>
          </AdminForm>
        ) : (
          <p className="text-sm text-muted-foreground">
            {!banking
              ? "Add a payout destination below before requesting a withdrawal."
              : `Your balance is ${formatPrice(available)}. The minimum withdrawal is ${formatPrice(minimum)}.`}
          </p>
        )}
      </Card>

      <Card
        title="Payout destination"
        actions={
          banking ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setEditingDetails((current) => !current)}
            >
              {editingDetails ? "Cancel" : "Change"}
            </Button>
          ) : null
        }
      >
        {banking && !editingDetails ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Account name</dt>
              <dd className="text-right">{banking.accountName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Bank account</dt>
              <dd className="font-mono text-xs">•••• {banking.accountLast4}</dd>
            </div>
            {banking.walletAddress ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">USDT wallet</dt>
                <dd className="truncate font-mono text-xs">{banking.walletAddress}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <AdminForm
            action={savePayoutDetailsAction}
            csrfToken={csrfToken}
            submitLabel="Save destination"
            onSuccess={() => setEditingDetails(false)}
          >
            <TextInput
              name="accountName"
              label="Account holder"
              defaultValue={banking?.accountName}
              required
            />
            <FormGrid>
              <TextInput
                name="accountNumber"
                label="Bank account number"
                hint="Only the last four digits are stored"
              />
              <TextInput name="routingNumber" label="Routing number" />
            </FormGrid>
            <TextInput
              name="walletAddress"
              label="USDT wallet address"
              defaultValue={banking?.walletAddress}
              hint="Paid in USDT — the marketplace settlement currency"
            />
            <p className="text-xs text-muted-foreground">
              Saving new details restarts banking verification. Withdrawals continue to the
              previous destination until the new one is verified.
            </p>
          </AdminForm>
        )}
      </Card>
    </div>
  );
}
