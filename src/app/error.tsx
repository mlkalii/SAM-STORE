"use client";

import * as React from "react";

import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/observability/logger";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("storefront.page_error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Error
      </p>
      <h1 className="mt-6 font-display text-5xl tracking-tight">Something came apart</h1>
      {/*
        Shoppers get the digest, never the message. A server error's message is
        already redacted in production builds, but a client-side throw reaches
        this boundary intact and can carry internals a customer should not read.
      */}
      <p className="mt-4 max-w-md text-muted-foreground text-pretty">
        Something went wrong while rendering this page. Trying again usually
        clears it.
        {error.digest ? (
          <>
            {" "}
            If it keeps happening, quote reference{" "}
            <span className="font-mono text-xs">{error.digest}</span> to support.
          </>
        ) : null}
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
