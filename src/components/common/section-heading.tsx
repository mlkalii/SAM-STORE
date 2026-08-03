import * as React from "react";

import { Reveal } from "@/components/common/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
  /**
   * Heading level. Listing pages whose SectionHeading is the page title pass
   * "h1"; homepage sections keep the default "h2" so the document outline
   * stays hierarchical.
   */
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
            <span aria-hidden className="h-px w-8 bg-gold/50" />
            {eyebrow}
          </p>
        ) : null}
        <Heading className="mt-4 font-display text-4xl leading-[1.02] tracking-tight text-balance sm:text-5xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}
