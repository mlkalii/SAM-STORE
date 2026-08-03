import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { siteConfig } from "@/config/site";

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Shared layout for the policy and help pages, so five routes share one set of
 * type styles, one contact block and one breadcrumb rather than five copies.
 */
export function PolicyPage({
  title,
  intro,
  updated,
  sections,
  contactLabel = "Questions about this policy?",
}: {
  title: string;
  intro: string;
  updated: string;
  sections: PolicySection[];
  contactLabel?: string;
}) {
  return (
    <Container className="py-14 sm:py-20">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">{title}</span>
      </nav>

      <Reveal className="mt-8 max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
          Updated {updated}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">{intro}</p>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[16rem_1fr]">
        <nav
          aria-label="On this page"
          className="hidden lg:sticky lg:top-32 lg:block lg:self-start"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            On this page
          </p>
          <ul className="mt-4 space-y-2">
            {sections.map((section) => (
              <li key={section.heading}>
                <a
                  href={`#${slugify(section.heading)}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-2xl space-y-12">
          {sections.map((section) => (
            <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-32">
              <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 leading-relaxed text-muted-foreground text-pretty"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-muted-foreground">
                      <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-gold" />
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section className="rounded-2xl border bg-surface p-6">
            <h2 className="font-display text-xl">{contactLabel}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Customer support:{" "}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-foreground underline underline-offset-4"
              >
                {siteConfig.supportEmail}
              </a>
              <br />
              Company, press and legal:{" "}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-foreground underline underline-offset-4"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
