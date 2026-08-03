import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Admin design primitives.
 *
 * Every admin page is built from these, so twenty screens share one set of
 * paddings, borders and type scales. Deliberately flatter and denser than the
 * storefront: an operator scanning a table wants information density, not the
 * generous rhythm a shopper wants.
 */

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3" aria-hidden /> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    // `min-w-0` matters: as a flex or grid item the card would otherwise take
    // its content's intrinsic width, and a wide table would push the whole page
    // sideways instead of scrolling inside its own container.
    <section className={cn("min-w-0 rounded-xl border bg-card", className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

const toneClasses: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  positive: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  gold: "bg-gold/15 text-gold",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap capitalize",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: keyof typeof toneClasses;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("flex size-7 items-center justify-center rounded-lg", toneClasses[tone])}>
            <Icon className="size-3.5" />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>

      <div className="mt-1 flex items-center gap-2 text-xs">
        {typeof delta === "number" ? (
          <span
            className={cn(
              "font-medium",
              delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </>
  );

  const className =
    "rounded-xl border bg-card p-4 transition-colors" + (href ? " hover:bg-muted/50" : "");

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** Definition row used across order, customer and product detail panels. */
export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
