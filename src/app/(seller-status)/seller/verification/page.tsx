import type { Metadata } from "next";
import { CheckCircle2, Clock, CircleDashed, XCircle } from "lucide-react";

import { AdminForm, TextArea, TextInput } from "@/components/admin/form-shell";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { submitVerificationAction } from "@/app/actions/seller";
import { formatStoreDate } from "@/config/store";
import { requireSellerAccount } from "@/lib/marketplace/auth";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Verification" };

const KINDS = [
  {
    kind: "identity" as const,
    title: "Identity verification",
    blurb:
      "A government-issued photo ID for the person who controls the account. Checked against the business record.",
    document: "Passport, driver's licence or state ID",
  },
  {
    kind: "business" as const,
    title: "Business verification",
    blurb:
      "Proof the entity exists and that you may act for it. Sole proprietors upload their trade name registration.",
    document: "Articles of incorporation, LLC certificate or DBA filing",
  },
  {
    kind: "tax" as const,
    title: "Tax verification",
    blurb:
      "Your EIN or SSN on a signed W-9, so marketplace earnings can be reported correctly.",
    document: "IRS Form W-9",
  },
  {
    kind: "banking" as const,
    title: "Banking verification",
    blurb:
      "Confirms the payout destination belongs to the verified business. Submitted automatically when you save payout details.",
    document: "Bank letter, voided cheque or wallet signature",
  },
];

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

export default async function SellerVerificationPage() {
  const { seller } = await requireSellerAccount("/seller/verification");
  const csrfToken = await getCsrfToken();

  const verified = seller.verification.filter((record) => record.status === "verified").length;

  return (
    <>
      <PageHeader
        title="Verification"
        description={`${verified} of ${seller.verification.length} checks complete. A fully verified store gets the marketplace verification badge.`}
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Verification" }]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {KINDS.map((entry) => {
          const record = seller.verification.find((item) => item.kind === entry.kind);
          const status = record?.status ?? "not-started";

          return (
            <Card key={entry.kind} title={entry.title}>
              <div className="mb-3 flex items-center gap-2">
                <StatusIcon status={status} />
                <Pill tone={statusTone[status] ?? "neutral"}>{status.replaceAll("-", " ")}</Pill>
                {record?.reviewedAt ? (
                  <span className="text-xs text-muted-foreground">
                    reviewed {formatStoreDate(record.reviewedAt)}
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">{entry.blurb}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Accepted:</span> {entry.document}
              </p>

              {record?.note ? (
                <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/8 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  {record.note}
                </p>
              ) : null}

              {status === "verified" ? null : (
                <div className="mt-4 border-t pt-4">
                  <AdminForm
                    action={submitVerificationAction}
                    csrfToken={csrfToken}
                    hidden={{ kind: entry.kind }}
                    submitLabel={status === "rejected" ? "Resubmit" : "Submit for review"}
                  >
                    <TextInput
                      name="documentRef"
                      label="Document reference"
                      hint="Left blank we generate one. File upload lands here once media storage is connected."
                    />
                    <TextArea name="note" label="Anything we should know" rows={2} />
                  </AdminForm>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card title="How review works" className="mt-4">
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1.</span> You submit a document. It is
            recorded against your store with a reference, never stored in plain text here.
          </li>
          <li>
            <span className="font-medium text-foreground">2.</span> A marketplace reviewer checks
            it and marks the item verified or rejected with a reason.
          </li>
          <li>
            <span className="font-medium text-foreground">3.</span> Identity, business and tax
            verification are required to trade. Banking verification is required to withdraw.
          </li>
          <li>
            <span className="font-medium text-foreground">4.</span> All four verified earns the
            badge shown on your storefront and in search results.
          </li>
        </ol>
      </Card>
    </>
  );
}
