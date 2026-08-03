import { Check, Circle, PackageCheck, Truck, XCircle } from "lucide-react";

import { ORDER_STATUS_FLOW, type Order, type OrderStatus } from "@/lib/commerce/types";
import { cn } from "@/lib/utils";

/**
 * Order timeline.
 *
 * Two views in one: the fulfilment track (processing → delivered) as a progress
 * rail, and the raw event log beneath it. A cancelled or refunded order drops
 * the rail, because progress through a path it left is meaningless.
 */

const STEP_LABELS: Record<(typeof ORDER_STATUS_FLOW)[number], string> = {
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
};

const TERMINAL: OrderStatus[] = ["cancelled", "returned", "refunded"];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function OrderTimeline({ order }: { order: Order }) {
  const isTerminal = TERMINAL.includes(order.status);
  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    order.status as (typeof ORDER_STATUS_FLOW)[number],
  );

  return (
    <div>
      {isTerminal ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-4">
          <XCircle className="size-5 shrink-0 text-destructive" aria-hidden />
          <p className="text-sm">
            This order was <span className="font-medium capitalize">{order.status}</span>.
          </p>
        </div>
      ) : (
        <ol className="flex flex-wrap gap-y-6" aria-label="Fulfilment progress">
          {ORDER_STATUS_FLOW.map((status, index) => {
            const done = index <= currentIndex;
            const active = index === currentIndex;

            return (
              <li key={status} className="flex min-w-[7rem] flex-1 flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "h-px flex-1",
                      index === 0 ? "bg-transparent" : done ? "bg-gold" : "bg-border",
                    )}
                  />
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      done
                        ? "border-gold bg-gold text-gold-foreground"
                        : "border-border bg-background text-muted-foreground",
                      active && "ring-4 ring-gold/20",
                    )}
                  >
                    {done ? (
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    ) : (
                      <Circle className="size-2 fill-current" aria-hidden />
                    )}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "h-px flex-1",
                      index === ORDER_STATUS_FLOW.length - 1
                        ? "bg-transparent"
                        : index < currentIndex
                          ? "bg-gold"
                          : "bg-border",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs",
                    done ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {STEP_LABELS[status]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingNumber ? (
        <p className="mt-6 flex items-center gap-2 rounded-xl border bg-surface p-3 text-sm">
          <Truck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Tracking <span className="font-mono">{order.trackingNumber}</span>
        </p>
      ) : null}

      <ol className="mt-8 space-y-4">
        {[...order.timeline].reverse().map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <span
              aria-hidden
              className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"
            >
              <PackageCheck className="size-3 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{entry.label}</p>
              {entry.detail ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{entry.detail}</p>
              ) : null}
              <time dateTime={entry.at} className="mt-0.5 block text-xs text-muted-foreground">
                {dateFormat.format(new Date(entry.at))}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
