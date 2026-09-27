"use client";

import { History, LayoutGrid, Loader2, Search, Tag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Suggestion {
  slug: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  gradient: string;
  image: string;
}

interface SuggestResponse {
  q: string;
  products: Suggestion[];
  categories: { slug: string; name: string }[];
  brands: { brand: string; count: number }[];
  /** Aggregate popular queries, shown before anything is typed. */
  trending: string[];
  /** Popular products, shown before anything is typed. */
  popular: Suggestion[];
}

const EMPTY: SuggestResponse = {
  q: "",
  products: [],
  categories: [],
  brands: [],
  trending: [],
  popular: [],
};

const HISTORY_KEY = "samrux.search-history.v1";
const HISTORY_LIMIT = 6;

/** Recent searches live in this browser only — never sent anywhere. */
function readHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function rememberSearch(term: string) {
  const value = term.trim();
  if (value.length < 2) return;
  try {
    const next = [value, ...readHistory().filter((entry) => entry !== value)].slice(0, HISTORY_LIMIT);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Private mode — the field still works, it just forgets.
  }
}

/**
 * Header search. Suggestions come from `/api/search` so the catalogue stays on
 * the server; submitting goes to `/search`, which does the full query.
 */
export function SearchBar({
  className,
  autoFocus = false,
  onNavigate,
}: {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SuggestResponse>(EMPTY);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const trimmed = query.trim();

  // Results are keyed by the query that produced them, so staleness is derived
  // rather than tracked in a second piece of state.
  const fresh = results.q === trimmed ? results : EMPTY;
  const loading = trimmed.length >= 2 && results.q !== trimmed;

  // Idle panel: trending terms and popular products, fetched the first time the
  // field is opened rather than on every page load.
  const [idle, setIdle] = React.useState<SuggestResponse | null>(null);
  React.useEffect(() => {
    if (!open || idle || trimmed.length >= 2) return;

    const controller = new AbortController();
    fetch("/api/search?q=", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: SuggestResponse | null) => {
        if (payload) setIdle(payload);
      })
      .catch(() => {
        // Nothing to show is an acceptable outcome here.
      });

    return () => controller.abort();
  }, [open, idle, trimmed]);

  const [history, setHistory] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setHistory(readHistory()), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  React.useEffect(() => {
    if (trimmed.length < 2) return;

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const payload = (await response.json()) as SuggestResponse;
        setResults({ ...payload, q: trimmed });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults({ ...EMPTY, q: trimmed });
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // "/" focuses search from anywhere, unless the user is already typing.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function search(term: string) {
    rememberSearch(term);
    go(`/search?q=${encodeURIComponent(term)}`);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed) return;
    search(trimmed);
  }

  const hasResults =
    fresh.products.length > 0 ||
    fresh.categories.length > 0 ||
    fresh.brands.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="site-search" className="sr-only">
          Search all products
        </label>

        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />

        <Input
          id="site-search"
          ref={inputRef}
          type="search"
          autoFocus={autoFocus}
          value={query}
          placeholder="Search products, brands and departments"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="h-10 rounded-full border-border/70 bg-surface/60 pl-9 pr-16 transition-[border-color,box-shadow] duration-300 focus-visible:border-gold/50 focus-visible:ring-gold/20"
          autoComplete="off"
        />

        {/* Keyboard hint — hidden once there is anything to clear. */}
        {!query && !loading ? (
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:block"
          >
            /
          </kbd>
        ) : null}

        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </form>

      {open && trimmed.length < 2 && (history.length > 0 || idle) ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
          {history.length > 0 ? (
            <div className="border-b p-2">
              <p className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Recent searches
              </p>
              {history.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => search(term)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <History className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  {term}
                </button>
              ))}
            </div>
          ) : null}

          {idle && idle.trending.length > 0 ? (
            <div className="border-b p-2">
              <p className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Trending
              </p>
              <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                {idle.trending.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => search(term)}
                    className="rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {idle && idle.popular.length > 0 ? (
            <div className="p-2">
              <p className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Popular right now
              </p>
              <ul>
                {idle.popular.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={`/shop/${product.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        gradient={product.gradient}
                        category={product.category}
                        sizes="48px"
                        className="size-10 shrink-0 rounded-md"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {formatPrice(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {open && trimmed.length >= 2 ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
          {hasResults ? (
            <>
              {fresh.categories.length > 0 || fresh.brands.length > 0 ? (
                <div className="border-b p-2">
                  {fresh.categories.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => go(`/categories/${category.slug}`)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      Browse <span className="font-medium">{category.name}</span>
                    </button>
                  ))}

                  {fresh.brands.map((entry) => (
                    <button
                      key={entry.brand}
                      type="button"
                      onClick={() => go(`/shop?brand=${encodeURIComponent(entry.brand)}`)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Tag className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="font-medium">{entry.brand}</span>
                      <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                        {entry.count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <ul className="max-h-96 overflow-y-auto p-2">
                {fresh.products.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={`/shop/${product.slug}`}
                      onClick={() => {
                        rememberSearch(trimmed);
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        gradient={product.gradient}
                        category={product.category}
                        sizes="48px"
                        className="size-11 shrink-0 rounded-md"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {product.brand}
                        </span>
                      </span>
                      <span className="font-mono text-sm tabular-nums">
                        {formatPrice(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => search(trimmed)}
                className="w-full border-t px-4 py-3 text-left text-sm font-medium hover:bg-muted"
              >
                See all results for “{trimmed}”
              </button>
            </>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {loading ? "Searching…" : `No matches for “${trimmed}”.`}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
