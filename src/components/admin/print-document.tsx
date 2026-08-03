"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Print documents render as plain pages with a single control that opens the
 * browser's print dialog. Deliberately not a PDF library: the browser already
 * produces correct, selectable, accessible output, and `@media print` hides the
 * chrome.
 */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button size="sm" className="print:hidden" onClick={() => window.print()}>
      <Printer className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
