"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Container } from "@/components/common/container";
import { Magnetic } from "@/components/common/magnetic";
import { Button } from "@/components/ui/button";
import { gsap, useGSAP } from "@/lib/gsap";



export function Hero({
  productCount,
  departmentCount,
}: {
  /** Live counts from the catalogue, so the hero never quotes a stale number. */
  productCount: number;
  departmentCount: number;
}) {
  const words = ["Everyday", "products,", "sold", "direct", "to", "you."];
  const scope = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Everything below animates *from* a hidden state, so skipping the
      // timeline leaves the hero in its final, fully visible layout.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const targets =
        "[data-hero-eyebrow],[data-hero-word],[data-hero-copy],[data-hero-cta],[data-hero-stat]";

      // `.from()` hides these elements the instant the timeline is built, so the
      // hero is only visible once the animation finishes. If the GSAP ticker
      // ever stalls — a backgrounded tab, a throttled device, rAF never firing —
      // it would stay blank. Finishing therefore means *removing* the inline
      // styles rather than trusting them to land on their end values, and a
      // timer guarantees that happens whether or not a single frame rendered.
      let safety = 0;
      const settle = () => {
        window.clearTimeout(safety);
        gsap.set(targets, { clearProps: "opacity,transform" });
      };

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: settle,
      });
      safety = window.setTimeout(settle, 2800);

      timeline
        .from("[data-hero-eyebrow]", { opacity: 0, y: 16, duration: 0.6 })
        .from(
          "[data-hero-word]",
          { opacity: 0, yPercent: 120, duration: 0.9, stagger: 0.07 },
          "-=0.3",
        )
        .from("[data-hero-copy]", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
        .from("[data-hero-cta]", { opacity: 0, y: 20, duration: 0.6, stagger: 0.08 }, "-=0.45")
        .from("[data-hero-stat]", { opacity: 0, y: 14, duration: 0.5, stagger: 0.08 }, "-=0.3")
        // Scale only — the plates' opacity is owned by their utility classes,
        // and animating it here would override how subtle the glow should be.
        .from("[data-hero-plate]", { scale: 1.12, duration: 1.6, ease: "power2.out" }, 0);

      // Slow parallax drift on the artwork as the hero leaves the viewport.
      gsap.to("[data-hero-plate]", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: scope.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      return () => window.clearTimeout(safety);
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div
        data-hero-plate
        aria-hidden
        className="pointer-events-none absolute -right-72 -top-72 -z-10 size-[52rem] rounded-full bg-[radial-gradient(circle,var(--gold)_0%,transparent_58%)] opacity-[0.16] blur-[120px]"
      />
      <div
        data-hero-plate
        aria-hidden
        className="pointer-events-none absolute -left-80 top-40 -z-10 size-[40rem] rounded-full bg-[radial-gradient(circle,oklch(0.75_0.07_265)_0%,transparent_60%)] opacity-[0.35] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px rule-fade"
      />

      <Container>
        <p
          data-hero-eyebrow
          className="inline-flex items-center gap-3 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-gold"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          {productCount} products · {departmentCount} departments · Sold direct
        </p>

        <h1 className="mt-6 font-display text-[clamp(3rem,10vw,8rem)] leading-[0.92] tracking-tight">
          {words.map((word, index) => (
            <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-[0.08em]">
              <span data-hero-word className="inline-block pr-[0.22em]">
                {index === 3 ? (
                  <em className="text-gold-gradient italic">{word}</em>
                ) : (
                  word
                )}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <p
            data-hero-copy
            className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty"
          >
            SAMRUX LLC is an online retail store offering a range of consumer products. Every
            product is sold and shipped directly by us, with prices in US dollars.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div data-hero-cta>
              <Magnetic>
                <Button size="lg" className="h-12 px-6" render={<Link href="/shop" />}>
                  Shop all products
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Magnetic>
            </div>
            <Button
              data-hero-cta
              variant="outline"
              size="lg"
              className="h-12 px-6"
              render={<Link href="/about" />}
            >
              About us
            </Button>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-6 border-t pt-8 sm:grid-cols-4">
          {[
            { value: String(productCount), label: "Products stocked" },
            { value: String(departmentCount), label: "Departments" },
            { value: "30 day", label: "Returns window" },
            { value: "48 hr", label: "Dispatch window" },
          ].map((stat) => (
            <div key={stat.label} data-hero-stat>
              <dt className="font-display text-4xl tracking-tight text-gold-gradient">{stat.value}</dt>
              <dd className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
