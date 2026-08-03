"use client";

import { CheckCircle2, CircleDashed, Clock, XCircle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { setSellerVerificationAction } from "@/app/actions/admin";
import { Card, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_FIELD } from "@/config/auth";
import { formatStoreDate } from "@/config/store";
import type { VerificationRecord } from "@/lib/marketplace/types";

const statusTone: Record<string, "positive" | "warning" | "info" | "danger" | "neutral"> = {
  verified: "positive",
  submitted: "warning",
  "in-review": "info",
  rejected: "danger",
  "not-started": "neutral",
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />;
    case "rejected":
      return <XCircle className="size-4 text-destructive" aria-hidden />;
    case "submitted":
    case "in-review":
      return <Clock className="size-4 text-amber-500" aria-hidden />;
    default:
      return <CircleDashed className="size-4 text-muted-foreground" aria-hidden />;
  }
}

/**
 * The four verification checks, each approvable or rejectable in place.
 *
 * Rejection asks for a reason before it will submit — a seller told only "no"
 * cannot fix anything.
 */
export function SellerVerificationPanel({
  csrfToken,
  sellerId,
  records,
}: {
  csrfToken: string;
  sellerId: string;
  records: VerificationRecord[];
}) {
  const [pending, startTransition] = React.useTransition();
  const [rejecting, setRejecting] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  function decide(kind: string, status: string, reason?: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", sellerId);
      form.set("kind", kind);
      form.set("status", status);
      if (reason) form.set("note", reason);

      const result = await setSellerVerificationAction(undefined as never, form);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        setRejecting(null);
        setNote("");
      } else {
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  return (
    <Card
      title="Verification"
      description="Identity, business and tax are required to trade. Banking is required to withdraw."
      bodyClassName="p-0"
    >
      <ul className="divide-y">
        {records.map((record) => (
          <li key={record.kind} className="px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusIcon status={record.status} />
              <span className="text-sm font-medium capitalize">{record.kind}</span>
              <Pill tone={statusTone[record.status] ?? "neutral"}>
                {record.status.replaceAll("-", " ")}
              </Pill>

              {record.documentRef ? (
                <code className="font-mono text-[11px] text-muted-foreground">
                  {record.documentRef}
                </code>
              ) : null}

              {record.reviewedAt ? (
                <span className="text-xs text-muted-foreground">
                  {formatStoreDate(record.reviewedAt)}
                  {record.reviewedBy ? ` · ${record.reviewedBy}` : ""}
                </span>
              ) : null}

              <div className="ml-auto flex gap-1">
                {record.status !== "verified" ? (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={pending}
                    onClick={() => decide(record.kind, "verified")}
                  >
                    Verify
                  </Button>
                ) : null}
                {record.status !== "rejected" && record.status !== "not-started" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setRejecting(record.kind)}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>
            </div>

            {record.note ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{record.note}</p>
            ) : null}

            {rejecting === record.kind ? (
              <div className="mt-3 flex flex-wrap gap-2 rounded-lg border p-3">
                <Input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What does the seller need to fix?"
                  aria-label={`Reason for rejecting ${record.kind} verification`}
                  className="h-8 min-w-52 flex-1 text-sm"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs"
                  disabled={pending || !note.trim()}
                  onClick={() => decide(record.kind, "rejected", note)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setRejecting(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
