import { cn } from "@/lib/utils";

/**
 * Presentational primitives shared by every dashboard page, so panels, empty
 * states and stat tiles stay identical across nine routes.
 */

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-6 shadow-premium sm:p-7", className)}>
      {title ? (
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
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
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 flex justify-center gap-3">{action}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Avatar({
  initials,
  gradient,
  className,
}: {
  initials: string;
  gradient: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-full bg-linear-to-br font-medium text-white",
        gradient,
        className,
      )}
    >
      {initials}
    </span>
  );
}

const statusTone: Record<string, string> = {
  processing: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  shipped: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  delivered: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
        statusTone[status] ?? statusTone.cancelled,
      )}
    >
      {status}
    </span>
  );
}
