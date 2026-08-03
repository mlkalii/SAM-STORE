import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buildHref, type BrowseState } from "@/lib/browse-params";
import { cn } from "@/lib/utils";

/** Windowed page list: first, last, and a run around the current page. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < pageCount) pages.add(page + 1);
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
  if (page >= pageCount - 2)
    [pageCount - 3, pageCount - 2, pageCount - 1].forEach((value) => pages.add(value));

  const ordered = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);

  const output: (number | "gap")[] = [];
  ordered.forEach((value, index) => {
    if (index > 0 && value - ordered[index - 1] > 1) output.push("gap");
    output.push(value);
  });
  return output;
}

export function Pagination({
  basePath,
  state,
  page,
  pageCount,
}: {
  basePath: string;
  state: BrowseState;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors hover:bg-muted";

  return (
    <nav
      aria-label="Pagination"
      className="no-scrollbar mt-14 flex items-center justify-start gap-1.5 overflow-x-auto sm:justify-center"
    >
      {page > 1 ? (
        <Link
          href={buildHref(basePath, { ...state, page: page - 1 })}
          rel="prev"
          aria-label="Previous page"
          className={linkClass}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(page, pageCount).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(basePath, { ...state, page: entry })}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              linkClass,
              "font-mono tabular-nums",
              entry === page && "border-foreground bg-foreground text-background hover:bg-foreground",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link
          href={buildHref(basePath, { ...state, page: page + 1 })}
          rel="next"
          aria-label="Next page"
          className={linkClass}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
