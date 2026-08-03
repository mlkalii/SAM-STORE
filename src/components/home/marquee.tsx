"use client";

import * as React from "react";

import { categories } from "@/data/categories";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const phrases = categories.map((category) => category.name);

/**
 * Continuous ticker. GSAP drives the loop and ScrollTrigger flips its
 * timeScale so the strip reverses when the page scrolls back up.
 */
export function Marquee() {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      const track = root?.querySelector<HTMLElement>("[data-track]");
      if (!root || !track) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const loop = gsap.to(track, {
        xPercent: -50,
        duration: 26,
        ease: "none",
        repeat: -1,
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          gsap.to(loop, { timeScale: self.direction, duration: 0.4, overwrite: true });
        },
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative overflow-hidden border-y bg-surface-raised py-4 select-none"
    >
      <div data-track className="flex w-max gap-10 whitespace-nowrap will-change-transform">
        {[...phrases, ...phrases].map((phrase, index) => (
          <span
            key={`${phrase}-${index}`}
            className="flex items-center gap-10 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground"
          >
            {phrase}
            <span aria-hidden className="text-gold">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
