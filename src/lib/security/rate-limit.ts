import "server-only";

/**
 * Rate limiting.
 *
 * A fixed-window in-memory limiter keyed by (bucket, client) — enough to stop
 * credential stuffing and form spam on a single instance. The interface is the
 * seam: `RateLimiter` can be re-implemented over Upstash Redis or any shared
 * counter for multi-instance deployments, and the proxy stays unchanged.
 *
 * Windows are deliberately generous for humans and hostile to scripts:
 * nobody types their password wrong twenty times in five minutes.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets — for the Retry-After header. */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(bucket: string, client: string): RateLimitResult;
}

interface Rule {
  limit: number;
  windowSeconds: number;
}

/** Per-bucket policies. Anything unlisted is not limited. */
const RULES: Record<string, Rule> = {
  "auth:login": { limit: 30, windowSeconds: 300 },
  "auth:register": { limit: 40, windowSeconds: 3600 },
  "auth:forgot": { limit: 8, windowSeconds: 900 },
  "admin:login": { limit: 30, windowSeconds: 300 },
  "api:contact": { limit: 5, windowSeconds: 3600 },
  "api:uploads": { limit: 60, windowSeconds: 3600 },
};

interface Window {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __samruxRateWindows?: Map<string, Window>;
};

function state() {
  if (!globalForRateLimit.__samruxRateWindows) {
    globalForRateLimit.__samruxRateWindows = new Map();
  }
  return globalForRateLimit.__samruxRateWindows;
}

export const memoryRateLimiter: RateLimiter = {
  check(bucket, client) {
    const rule = RULES[bucket];
    if (!rule) return { allowed: true, remaining: Infinity, retryAfterSeconds: 0 };

    const key = `${bucket}:${client}`;
    const now = Date.now();
    const window = state().get(key);

    if (!window || window.resetAt <= now) {
      state().set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
      // Opportunistic sweep so the map cannot grow without bound.
      if (state().size > 10_000) {
        for (const [k, w] of state()) if (w.resetAt <= now) state().delete(k);
      }
      return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
    }

    window.count += 1;
    const allowed = window.count <= rule.limit;
    return {
      allowed,
      remaining: Math.max(0, rule.limit - window.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((window.resetAt - now) / 1000),
    };
  },
};

export const rateLimiter: RateLimiter = memoryRateLimiter;

/** Which bucket, if any, a request path falls into. POSTs only. */
export function bucketForPath(pathname: string): string | null {
  if (pathname === "/login") return "auth:login";
  if (pathname === "/register") return "auth:register";
  if (pathname === "/forgot-password" || pathname === "/reset-password") return "auth:forgot";
  if (pathname === "/admin/login" || pathname.startsWith("/admin/forgot-password")) return "admin:login";
  if (pathname === "/contact") return "api:contact";
  if (pathname === "/api/uploads") return "api:uploads";
  return null;
}
