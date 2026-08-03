import { cn } from "@/lib/utils";

/**
 * Charts.
 *
 * Hand-rolled inline SVG rather than a charting dependency: these three shapes
 * are all the dashboard needs, they render on the server with no hydration cost,
 * and they inherit the theme's colours automatically. Every chart is given a
 * text alternative, since an SVG polyline means nothing to a screen reader.
 */

export interface SeriesPoint {
  label: string;
  value: number;
}

function path(points: SeriesPoint[], width: number, height: number, padding = 4) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(1, points.length - 1);

  return points.map((point, index) => {
    const x = padding + index * step;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y };
  });
}

export function LineChart({
  data,
  height = 200,
  className,
  label,
  format = (value: number) => String(value),
}: {
  data: SeriesPoint[];
  height?: number;
  className?: string;
  label: string;
  format?: (value: number) => string;
}) {
  if (data.length === 0) return null;

  const width = 600;
  const points = path(data, width, height, 10);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  const peak = data.reduce((best, point) => (point.value > best.value ? point : best), data[0]);

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full sm:h-48"
        role="img"
        aria-label={`${label}. Peak ${format(peak.value)} on ${peak.label}.`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#chart-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <figcaption className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </figcaption>
    </figure>
  );
}

export function BarChart({
  data,
  className,
  label,
  format = (value: number) => String(value),
}: {
  data: SeriesPoint[];
  className?: string;
  label: string;
  format?: (value: number) => string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <figure className={cn("w-full", className)}>
      {/*
        Bars sit directly in the row: a percentage height only resolves against
        a parent with a definite height, which the `h-40` row has and an
        auto-height wrapper would not.
      */}
      <div className="flex h-40 items-end gap-1.5 sm:h-48" role="img" aria-label={label}>
        {data.map((point) => (
          <span
            key={point.label}
            className="min-w-0 flex-1 rounded-t-sm bg-gold/70 transition-colors hover:bg-gold"
            style={{ height: `${Math.max(2, (point.value / max) * 100)}%` }}
            title={`${point.label}: ${format(point.value)}`}
          />
        ))}
      </div>

      <figcaption className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </figcaption>
    </figure>
  );
}

/** Horizontal proportion bar — used for status and category breakdowns. */
export function BreakdownBar({
  segments,
  className,
}: {
  segments: { label: string; value: number; className: string }[];
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label="Breakdown">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%` }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>

      <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", segment.className)} aria-hidden />
            <span className="capitalize text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-medium tabular-nums">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
