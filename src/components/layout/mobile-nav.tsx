"use client";

import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { CategoryIcon } from "@/components/common/category-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav } from "@/config/site";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="-ml-2 md:hidden" />}
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
          <SheetDescription>Premium essentials across fourteen departments.</SheetDescription>
        </SheetHeader>

        <nav
          className="flex-1 overflow-y-auto px-4 pb-6"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-0.5">
            {mainNav
              .filter((item) => item.href !== "/categories")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex items-center justify-between rounded-md px-2 py-2.5 text-base font-medium transition-colors hover:bg-muted"
                >
                  {item.label}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              ))}
          </div>

          <Separator className="my-4" />

          <p className="px-2 pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Departments
          </p>

          <div className="flex flex-col gap-0.5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                onClick={close}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white",
                    category.gradient,
                  )}
                >
                  <CategoryIcon name={category.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{category.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {category.tagline}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
