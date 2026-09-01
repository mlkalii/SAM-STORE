import { isSortKey, type ProductQuery, type SortKey } from "@/data/products";

/**
 * One shared URL contract for every listing page (shop, category, search,
 * deals, new arrivals, best sellers). Filter state lives entirely in the query
 * string, so results are shareable, bookmarkable and server-rendered.
 */
export interface BrowseState {
  q: string;
  subcategories: string[];
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sort?: SortKey;
  page: number;
  /** Cross-department edit. Part of the page's subject, not a filter chip. */
  collection?: string;
  /** Marketplace vendor slug. Likewise. */
  seller?: string;
  /** Multi-select "sold by" filter, alongside brands. */
  sellers: string[];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PER_PAGE = 24;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | string[] | undefined): string[] {
  const raw = first(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function number(value: string | string[] | undefined) {
  const raw = first(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseBrowseParams(params: RawSearchParams): BrowseState {
  const sortRaw = first(params.sort);
  const pageRaw = number(params.page) ?? 1;

  return {
    q: first(params.q)?.trim() ?? "",
    subcategories: list(params.sub),
    brands: list(params.brand),
    minPrice: number(params.min),
    maxPrice: number(params.max),
    inStockOnly: first(params.stock) === "1",
    onSaleOnly: first(params.sale) === "1",
    sort: isSortKey(sortRaw) ? sortRaw : undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    collection: first(params.collection)?.trim() || undefined,
    seller: first(params.seller)?.trim() || undefined,
    sellers: list(params.vendor),
  };
}

/** Turns browse state into the shape `queryProducts` expects. */
export function toProductQuery(
  state: BrowseState,
  extra: Pick<ProductQuery, "category" | "scope"> = {},
): ProductQuery {
  return {
    q: state.q || undefined,
    subcategories: state.subcategories,
    brands: state.brands,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStockOnly: state.inStockOnly,
    onSaleOnly: state.onSaleOnly,
    sort: state.sort,
    page: state.page,
    perPage: PER_PAGE,
    collection: state.collection,
    seller: state.seller,
    sellers: state.sellers,
    ...extra,
  };
}

export function buildHref(basePath: string, state: Partial<BrowseState>): string {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.subcategories?.length) params.set("sub", state.subcategories.join(","));
  if (state.brands?.length) params.set("brand", state.brands.join(","));
  if (typeof state.minPrice === "number") params.set("min", String(state.minPrice));
  if (typeof state.maxPrice === "number") params.set("max", String(state.maxPrice));
  if (state.inStockOnly) params.set("stock", "1");
  if (state.onSaleOnly) params.set("sale", "1");
  if (state.sort) params.set("sort", state.sort);
  // Carried through every filter change — losing the collection on a sort
  // would silently widen the results the shopper is looking at.
  if (state.collection) params.set("collection", state.collection);
  if (state.seller) params.set("seller", state.seller);
  if (state.sellers?.length) params.set("vendor", state.sellers.join(","));
  if (state.page && state.page > 1) params.set("page", String(state.page));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Toggling any filter always returns to page one. */
export function toggleValue(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value].sort();
}

export function withFilter(state: BrowseState, patch: Partial<BrowseState>): BrowseState {
  return { ...state, ...patch, page: 1 };
}

export function countActiveFilters(state: BrowseState) {
  return (
    state.subcategories.length +
    state.brands.length +
    state.sellers.length +
    (typeof state.minPrice === "number" || typeof state.maxPrice === "number" ? 1 : 0) +
    (state.inStockOnly ? 1 : 0) +
    (state.onSaleOnly ? 1 : 0)
  );
}
