import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";

import { SellerStatusShell } from "@/components/seller/seller-shell";
import { Button } from "@/components/ui/button";
import { storeConfig, formatStoreDate } from "@/config/store";
import { requireSellerAccount } from "@/lib/marketplace/auth";

export const metadata: Metadata = {
  title: "Application status",
  robots: { index: false, follow: false },
};

/**
 * Holding page for a store that cannot trade yet.
 *
 * The seller layout redirects here rather than rendering a dashboard full of
 * controls a pending or suspended store cannot use.
 */
export default async function SellerStatusPage() {
  const { seller } = await requireSellerAccount("/seller/status");

  // An approved store has no business here.
  if (seller.status === "approved") redirect("/seller");

  const copy = {
    pending: {
      icon: Clock,
      tone: "text-amber-600 dark:text-amber-400",
      title: "Application under review",
      body: "Your store has been submitted and a marketplace reviewer is looking at it. Most applications are decided within two business days.",
    },
    draft: {
      icon: Clock,
      tone: "text-muted-foreground",
      title: "Application not submitted",
      body: "Finish your application and submit it for review.",
    },
    suspended: {
      icon: ShieldAlert,
      tone: "text-destructive",
      title: "Store suspended",
      body: "Your storefront is hidden and your listings are delisted while this is resolved.",
    },
    rejected: {
      icon: XCircle,
      tone: "text-destructive",
      title: "Application declined",
      body: "We were not able to approve this application.",
    },
  }[seller.status];

  const Icon = copy.icon;

  return (
    <SellerStatusShell>
      <div className="rounded-2xl border bg-card p-8">
        <Icon className={`size-8 ${copy.tone}`} aria-hidden />
        <h1 className="mt-5 font-display text-3xl tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground text-pretty">{copy.body}</p>

        <dl className="mt-6 space-y-2 border-t pt-6 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Store</dt>
            <dd className="text-right font-medium">{seller.storeName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Applied</dt>
            <dd className="text-right">{formatStoreDate(seller.joinedAt)}</dd>
          </div>
          {seller.statusChangedAt ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="text-right">{formatStoreDate(seller.statusChangedAt)}</dd>
            </div>
          ) : null}
        </dl>

        {seller.statusNote ? (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-sm text-amber-800 dark:text-amber-300">
            {seller.statusNote}
          </p>
        ) : null}

        {seller.status === "pending" ? (
          <div className="mt-6 rounded-xl border p-4">
            <p className="text-sm font-medium">While you wait</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Completing verification now means you can start selling the moment you are approved.
            </p>
            <Button size="sm" className="mt-3" render={<Link href="/seller/verification" />}>
              <CheckCircle2 className="size-3.5" aria-hidden />
              Complete verification
            </Button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href="/account" />}>
            Back to my account
          </Button>
          <Button
            variant="ghost"
            render={<a href={`mailto:${storeConfig.contactEmail}`} />}
          >
            Contact {storeConfig.contactEmail}
          </Button>
        </div>
      </div>
    </SellerStatusShell>
  );
}
