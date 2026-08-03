"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/observability/logger";

/**
 * Admin error boundary. Placed inside the /seller tree so a failing page keeps
 * the SellerShell — staff retain the sidebar and can retry or move on instead
 * of landing on the storefront-styled root boundary.
 */
export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("seller.page_error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="py-16">
      <EmptyState
        icon={RotateCcw}
        title="That page hit an error"
        description={error.digest ? `Reference ${error.digest} is in the server log.` : error.message}
      />
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" render={<Link href="/seller" />}>
          Back to the dashboard
        </Button>
      </div>
    </div>
  );
}
