import { cn } from "@/lib/utils";

/**
 * SAMRUX identity.
 *
 * The mark is two chevrons meeting on the centre line — an abstract "X" that
 * reads as convergence: many departments, one storefront. It is drawn on a
 * squircle with a fixed indigo→cyan gradient so the brand colour stays constant
 * across light and dark themes, while the wordmark inherits `currentColor`.
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="presentation"
      aria-hidden
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id="samrux-mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="55%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11.5" fill="url(#samrux-mark-gradient)" />

      <g
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13.4 11.6 L21.2 20 L13.4 28.4" />
        <path d="M27.2 11.6 L19.4 20 L27.2 28.4" opacity="0.62" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  markClassName,
}: {
  className?: string;
  showWordmark?: boolean;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {showWordmark ? (
        <span className="text-[1.0625rem] font-semibold uppercase leading-none tracking-[0.32em]">
          Samrux
        </span>
      ) : null}
    </span>
  );
}
