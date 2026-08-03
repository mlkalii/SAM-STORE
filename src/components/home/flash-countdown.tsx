"use client";

import * as React from "react";

/**
 * Countdown to the end of the current day, in the visitor's own timezone.
 *
 * Rendered client-side only: a prerendered page cannot know "now", and baking a
 * timestamp into static HTML would freeze the clock. Renders dashes until it
 * hydrates, so there is no layout shift and no hydration mismatch.
 */
function remainingUntilMidnight(now: Date) {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const ms = Math.max(0, end.getTime() - now.getTime());

  return {
    hours: Math.floor(ms / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

export function FlashCountdown({ className }: { className?: string }) {
  const [time, setTime] = React.useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  React.useEffect(() => {
    // The first value is set from inside the interval callback rather than the
    // effect body, so this never triggers a cascading render on mount.
    const tick = () => setTime(remainingUntilMidnight(new Date()));
    const id = window.setInterval(tick, 1000);
    const raf = window.requestAnimationFrame(tick);

    return () => {
      window.clearInterval(id);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const cells = [
    { label: "hrs", value: time?.hours },
    { label: "min", value: time?.minutes },
    { label: "sec", value: time?.seconds },
  ];

  return (
    <div className={className}>
      <p className="sr-only" aria-live="off">
        {time
          ? `Offer ends in ${time.hours} hours, ${time.minutes} minutes`
          : "Loading time remaining"}
      </p>

      <div className="flex items-center gap-2" aria-hidden>
        {cells.map((cell, index) => (
          <React.Fragment key={cell.label}>
            {index > 0 ? <span className="text-gold/50">:</span> : null}
            <span className="flex min-w-14 flex-col items-center rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5">
              <span className="font-mono text-xl tabular-nums text-gold">
                {cell.value === undefined ? "--" : String(cell.value).padStart(2, "0")}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {cell.label}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
