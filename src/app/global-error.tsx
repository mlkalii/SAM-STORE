"use client";

import * as React from "react";

import { fontVariables } from "@/lib/fonts";
import { logger } from "@/lib/observability/logger";

import "./globals.css";

/**
 * Last-resort boundary.
 *
 * `error.tsx` renders *inside* the root layout, so it cannot catch a throw from
 * the root layout itself — that case lands here, which is why this file ships
 * its own `<html>` and `<body>`. It deliberately depends on nothing but the
 * stylesheet: any provider it pulled in could be the very thing that failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("app.global_error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            SAMRUX
          </p>
          <h1 className="mt-6 font-display text-5xl tracking-tight">
            The store is briefly unavailable
          </h1>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">
            Something failed before the page could be built. Reloading usually
            clears it.
            {error.digest ? (
              <>
                {" "}
                If it keeps happening, quote reference{" "}
                <span className="font-mono text-xs">{error.digest}</span> to
                support.
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
