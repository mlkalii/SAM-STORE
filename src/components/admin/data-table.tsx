"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Admin data table.
 *
 * One table serves products, orders, customers, inventory, coupons and staff.
 * It owns search, sorting, pagination and bulk selection; each page supplies
 * columns and, optionally, bulk actions. Filtering is client-side by design —
 * admin lists are bounded (hundreds, not millions), and keeping it local means
 * instant response with no endpoint per screen. The seam for server-side
 * paging is `rows`: hand it a page instead of the whole set.
 */

export interface Column<T> {
  id: string;
  header: string;
  /** Cell content. */
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting and search; omit to make the column inert. */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export interface BulkAction<T> {
  id: string;
  label: string;
  destructive?: boolean;
  run: (rows: T[]) => void | Promise<void>;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchPlaceholder = "Search…",
  searchable = true,
  bulkActions = [],
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Once there is data it will appear in this table.",
  perPage = 15,
  toolbar,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  searchable?: boolean;
  bulkActions?: BulkAction<T>[];
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
  perPage?: number;
  toolbar?: React.ReactNode;
  initialSort?: { columnId: string; direction: "asc" | "desc" };
}) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState(initialSort ?? null);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
      columns.some((column) => {
        const value = column.sortValue?.(row);
        return value !== undefined && String(value).toLowerCase().includes(needle);
      }),
    );
  }, [rows, columns, query]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((entry) => entry.id === sort.columnId);
    if (!column?.sortValue) return filtered;

    return [...filtered].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sort.direction === "asc" ? result : -result;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const visibleIds = visible.map(getRowId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const selectedRows = rows.filter((row) => selected.has(getRowId(row)));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestSort(columnId: string) {
    setSort((current) =>
      current?.columnId === columnId
        ? { columnId, direction: current.direction === "asc" ? "desc" : "asc" }
        : { columnId, direction: "asc" },
    );
  }

  return (
    <div>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          {searchable ? (
            <div className="relative min-w-52 flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 pl-8 text-sm"
              />
            </div>
          ) : null}

          {toolbar}

          <span className="ml-auto text-xs text-muted-foreground">
            {sorted.length.toLocaleString("en-US")} result
            {sorted.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {/* Bulk action bar — only present once something is selected. */}
      {selected.size > 0 && bulkActions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-5 py-2.5">
          <span className="text-xs font-medium">{selected.size} selected</span>
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={action.destructive ? "destructive" : "outline"}
              onClick={async () => {
                await action.run(selectedRows);
                setSelected(new Set());
              }}
            >
              {action.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X className="size-3.5" aria-hidden />
            Clear
          </Button>
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          {/* Wide tables scroll inside their own container, never the page. */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {bulkActions.length > 0 ? (
                    <th scope="col" className="w-10 px-5 py-2.5">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        aria-label="Select all rows on this page"
                        className="size-3.5 rounded-[3px] border-input accent-foreground"
                      />
                    </th>
                  ) : null}

                  {columns.map((column) => (
                    <th
                      key={column.id}
                      scope="col"
                      className={cn(
                        "px-3 py-2.5 text-xs font-medium text-muted-foreground first:pl-5 last:pr-5",
                        column.headerClassName,
                      )}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => requestSort(column.id)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          aria-label={`Sort by ${column.header}`}
                        >
                          {column.header}
                          {sort?.columnId === column.id ? (
                            <span aria-hidden>{sort.direction === "asc" ? "↑" : "↓"}</span>
                          ) : null}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visible.map((row) => {
                  const id = getRowId(row);
                  return (
                    <tr key={id} className="border-b last:border-0 hover:bg-muted/40">
                      {bulkActions.length > 0 ? (
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={() => toggleRow(id)}
                            aria-label={`Select row ${id}`}
                            className="size-3.5 rounded-[3px] border-input accent-foreground"
                          />
                        </td>
                      ) : null}

                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn("px-3 py-3 align-middle first:pl-5 last:pr-5", column.className)}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {pageCount}
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
