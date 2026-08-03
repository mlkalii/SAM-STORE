import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

/** Shell shared by the three admin authentication screens. */
export function AdminAuthCard({
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
    <>
      <div className="flex items-center gap-3">
        <LogoMark className="size-9" />
        <div>
          <p className="text-sm font-semibold tracking-[0.2em]">SAMRUX</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3" aria-hidden />
            Staff panel
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border bg-card p-6 shadow-premium sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </div>

      {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}

      <p className="mt-7 text-center text-xs text-muted-foreground">
        Locked out?{" "}
        <a href={`mailto:${siteConfig.contactEmail}`} className="underline underline-offset-4">
          {siteConfig.contactEmail}
        </a>
        {" · "}
        <Link href="/" className="underline underline-offset-4">
          Back to the store
        </Link>
      </p>
    </>
  );
}
