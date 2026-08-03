"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shows a code and copies it — used for coupons and gift cards alike. */
export function CopyCode({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code className="flex-1 truncate rounded-lg border border-dashed bg-background px-3 py-2 font-mono text-sm">
        {code}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Copy ${code}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
            toast.success("Code copied");
          } catch {
            toast.error("Could not copy the code");
          }
        }}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </Button>
    </div>
  );
}
