"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import * as React from "react";

import { CategoryIcon } from "@/components/common/category-icon";
import { Button } from "@/components/ui/button";
import { categories, categoryGroups } from "@/data/categories";
import { cn } from "@/lib/utils";

/**
 * Department mega menu.
 *
 * Fifteen departments is too many for a flat dropdown, so they are grouped into
 * four columns with a promoted panel on the right. Opens on hover with a short
 * close delay (so a diagonal mouse path does not dismiss it) and on click or
 * Enter for keyboard and touch. Escape closes; focus leaving the panel closes.
 */
export function MegaMenu() {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<number | undefined>(undefined);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  React.useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const featured = categories.slice(0, 3);

  return (
    <div
      ref={containerRef}
      className="static"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-1.5 font-normal", open && "bg-muted text-foreground")}
        aria-expanded={open}
        aria-haspopup="true"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        Categories
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
          aria-hidden
        />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-full z-50 border-b border-t bg-popover/95 backdrop-blur-2xl"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1fr_1fr_1fr_22rem]">
              {categoryGroups.map((group) => (
                <div key={group.title}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                    {group.title}
                  </p>

                  <ul className="mt-4 space-y-0.5">
                    {group.slugs.map((slug) => {
                      const category = categories.find((entry) => entry.slug === slug);
                      if (!category) return null;

                      return (
                        <li key={slug}>
                          <Link
                            href={`/categories/${slug}`}
                            onClick={() => setOpen(false)}
                            className="group/item flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                          >
                            <CategoryIcon
                              name={category.icon}
                              className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/item:text-gold"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {category.name}
                            </span>
                            <ArrowRight
                              className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-60"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {/* Promoted panel */}
              <div className="hidden lg:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                  Featured
                </p>

                <div className="mt-4 space-y-2">
                  {featured.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="ring-luxe group/tile relative flex items-center gap-3 overflow-hidden rounded-xl p-3 transition-transform duration-500 hover:-translate-y-0.5"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-0 -z-10 bg-linear-to-br opacity-70 transition-opacity duration-500 group-hover/tile:opacity-90",
                          category.gradient,
                        )}
                      />
                      <span aria-hidden className="absolute inset-0 -z-10 bg-black/45" />

                      <CategoryIcon name={category.icon} className="size-5 shrink-0 text-white" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-white">
                          {category.name}
                        </span>
                        <span className="block truncate text-[11px] text-white/70">
                          {category.tagline}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  render={<Link href="/categories" onClick={() => setOpen(false)} />}
                >
                  All 15 departments
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
