import { ArrowRight, ShieldCheck, Truck, Undo2 } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

const promises = [
  { icon: Truck, label: "Free delivery", detail: `over ${formatPrice(siteConfig.freeShippingThreshold)}` },
  { icon: Undo2, label: "30-day returns", detail: "postage covered" },
  { icon: ShieldCheck, label: "Warranty in-house", detail: "up to 5 years" },
];

/**
 * Promotional banner.
 *
 * Sits directly under the hero: one offer, three promises, one action. The gold
 * hairline and the slow radial glow are the only decoration — everything else
 * is type.
 */
export function PromoBanner() {
  return (
    <Container as="section" className="py-10">
      <Reveal className="relative overflow-hidden rounded-3xl border border-gold/20 bg-surface/60 px-6 py-10 shadow-premium sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 size-[28rem] rounded-full bg-gold/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
              Members&rsquo; week
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Up to <span className="text-gold-gradient">40% off</span> across every department
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Reductions measured against what we charged last month — never an invented list
              price. Ends when the allocated stock does.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/deals" />}>
                Shop the deals
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/new-arrivals" />}>
                See what&rsquo;s new
              </Button>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-3 lg:max-w-sm lg:grid-cols-1">
            {promises.map((promise) => (
              <li key={promise.label} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/8 text-gold">
                  <promise.icon className="size-4.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium">{promise.label}</span>
                  <span className="block text-xs text-muted-foreground">{promise.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Container>
  );
}
