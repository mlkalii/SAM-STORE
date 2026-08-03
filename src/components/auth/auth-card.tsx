import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

/**
 * Shell for every authentication page: brand, heading, the form, and a footer
 * link. Keeps the five auth pages visually identical without repeating layout.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <Link href="/" aria-label="SAMRUX home" className="inline-block">
        <Logo />
      </Link>

      <div className="mt-8 rounded-3xl border bg-card p-6 shadow-premium sm:p-8">
        <h1 className="font-display text-3xl tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-7">{children}</div>
      </div>

      {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Need a hand?{" "}
        <a href={`mailto:${siteConfig.supportEmail}`} className="underline underline-offset-4">
          {siteConfig.supportEmail}
        </a>
      </p>
    </div>
  );
}

/** Divider used between the social row and the credential form. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span aria-hidden className="h-px flex-1 rule-fade" />
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 rule-fade" />
    </div>
  );
}
