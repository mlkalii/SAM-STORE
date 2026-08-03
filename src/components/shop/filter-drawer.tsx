"use client";

import { SlidersHorizontal } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Mobile wrapper for `FilterPanel`. The panel itself stays a Server Component —
 * it is passed in as children, so no filter logic crosses the client boundary.
 */
export function FilterDrawer({
  activeCount,
  total,
  children,
}: {
  activeCount: number;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="lg:hidden" />}
        aria-label="Open filters"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {activeCount > 0 ? (
          <Badge variant="secondary" className="ml-1">
            {activeCount}
          </Badge>
        ) : null}
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            {total.toLocaleString("en-US")} products match right now.
          </SheetDescription>
        </SheetHeader>

        <div
          className="flex-1 overflow-y-auto px-4 pb-6"
          onClick={(event) => {
            // Any filter link closes the drawer as it navigates.
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
