"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { setPayoutStatusAction } from "@/app/actions/admin";
import { Card, EmptyState, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_FIELD } from "@/config/auth";
import { formatStoreDateTime } from "@/config/store";
import { formatPrice } from "@/lib/format";

export interface PayoutRow {
  id: string;
  reference: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  status: string;
  destination: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  transactionRef?: string;
  note?: string;
}

const statusTone: Record<string, "positive" | "warning" | "info" | "danger" | "neutral"> = {
  requested: "warning",
  approved: "info",
  processing: "info",
  paid: "positive",
  rejected: "danger",
};

const FILTERS = ["all", "requested", "approved", "paid", "rejected"] as const;

export function PayoutManager({ csrfToken, rows }: { csrfToken: string; rows: PayoutRow[] }) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");
  const [settling, setSettling] = React.useState<string | null>(null);
  const [txRef, setTxRef] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function decide(id: string, status: string, extra: Record<string, string> = {}) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", id);
      form.set("status", status);
      for (const [key, value] of Object.entries(extra)) form.set(key, value);

      const result = await setPayoutStatusAction(undefined as never, form);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        setSettling(null);
        setTxRef("");
      } else {
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  const visible = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <Card
      title={`${visible.length} withdrawals`}
      bodyClassName="p-0"
      actions={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((entry) => (
            <Button
              key={entry}
              size="sm"
              variant={filter === entry ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs capitalize"
              onClick={() => setFilter(entry)}
            >
              {entry}
            </Button>
          ))}
        </div>
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Wallet}
            title="No withdrawals"
            description="Sellers request payouts from their own dashboard."
          />
        </div>
      ) : (
        <ul className="divide-y">
          {visible.map((row) => (
            <li key={row.id} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <code className="font-mono text-xs">{row.reference}</code>
                <Link
                  href={`/admin/sellers/${row.sellerId}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >
                  {row.sellerName}
                </Link>
                <Pill tone={statusTone[row.status] ?? "neutral"}>{row.status}</Pill>
                <span className="text-xs text-muted-foreground">
                  {formatStoreDateTime(row.requestedAt)}
                </span>
                <span className="w-28 text-right font-mono text-sm tabular-nums">
                  {formatPrice(row.amount)}
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                To {row.destination}
                {row.transactionRef ? ` · tx ${row.transactionRef}` : ""}
                {row.processedBy ? ` · handled by ${row.processedBy}` : ""}
              </p>

              {row.status === "requested" ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={pending}
                    onClick={() => decide(row.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    disabled={pending}
                    onClick={() => decide(row.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}

              {row.status === "approved" || row.status === "processing" ? (
                settling === row.id ? (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Input
                      value={txRef}
                      onChange={(event) => setTxRef(event.target.value)}
                      placeholder="Transaction hash or bank reference"
                      aria-label={`Transaction reference for ${row.reference}`}
                      className="h-8 min-w-56 flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      disabled={pending}
                      onClick={() => decide(row.id, "paid", { transactionRef: txRef })}
                    >
                      Confirm paid
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => setSettling(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSettling(row.id)}
                    >
                      Mark paid
                    </Button>
                  </div>
                )
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
