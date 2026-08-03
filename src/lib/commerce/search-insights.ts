import "server-only";

/**
 * Search insights.
 *
 * Records what people search for so the field can offer trending terms and
 * popular products instead of an empty dropdown. Aggregate only — no query is
 * tied to a person.
 */

interface QueryStat {
  term: string;
  count: number;
  lastAt: number;
}

const globalForSearch = globalThis as unknown as { __samruxSearchStats?: Map<string, QueryStat> };

function state() {
  if (!globalForSearch.__samruxSearchStats) {
    globalForSearch.__samruxSearchStats = new Map(
      // Seeded so the first visitor sees something useful rather than nothing.
      [
        ["headphones", 42],
        ["espresso machine", 31],
        ["standing desk", 27],
        ["cashmere", 24],
        ["dash camera", 19],
        ["running vest", 16],
        ["coffee", 14],
        ["lego", 12],
      ].map(([term, count]) => [
        term as string,
        { term: term as string, count: count as number, lastAt: Date.now() },
      ]),
    );
  }
  return globalForSearch.__samruxSearchStats;
}

/** Ceiling on distinct tracked terms. Well above real vocabulary size. */
const MAX_TERMS = 5000;

export const searchInsights = {
  record(term: string) {
    const key = term.trim().toLowerCase();
    if (key.length < 2 || key.length > 60) return;

    const existing = state().get(key);
    if (existing) {
      existing.count += 1;
      existing.lastAt = Date.now();
      return;
    }

    // Bounded, because the only thing feeding this is an unauthenticated GET.
    // Every distinct query string would otherwise become a permanent entry for
    // the life of the instance, and `trending()` sorts the whole map on each
    // call — so an enumerating crawler degrades the type-ahead as it grows it.
    // Once full, evict the least useful: fewest hits, oldest first.
    if (state().size >= MAX_TERMS) {
      const victims = [...state().values()]
        .sort((a, b) => a.count - b.count || a.lastAt - b.lastAt)
        .slice(0, Math.ceil(MAX_TERMS / 10));
      for (const victim of victims) state().delete(victim.term);
    }

    state().set(key, { term: key, count: 1, lastAt: Date.now() });
  },

  /** Most searched overall. */
  popular(limit = 6) {
    return [...state().values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((entry) => entry.term);
  },

  /** Weighted toward recency, so a spike shows up without dominating forever. */
  trending(limit = 6) {
    const now = Date.now();
    return [...state().values()]
      .map((entry) => ({
        term: entry.term,
        score: entry.count / Math.max(1, (now - entry.lastAt) / 86_400_000 + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.term);
  },
};
