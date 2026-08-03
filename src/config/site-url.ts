/**
 * The origin this deployment is reachable at.
 *
 * Every canonical tag, sitemap entry, `robots.txt` host, JSON-LD `@id`, OG
 * image and password-reset link is built from this. Hardcoding it means a
 * deployed site tells crawlers it lives at `localhost:3000` and emails
 * customers reset links they cannot open, so it is resolved from the
 * environment instead.
 *
 * Only `NEXT_PUBLIC_*` variables are read. `siteConfig` is imported by client
 * components as well as server ones, and Next inlines only that prefix into the
 * browser bundle — anything else would resolve to one origin on the server and
 * another in the browser, which is a hydration mismatch waiting to happen.
 *
 * Order of preference:
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — the custom domain. Always wins.
 *   2. The project's stable production domain (Vercel provides this).
 *   3. This specific deployment's URL — correct for preview builds, and a
 *      per-deploy hostname, which is why it ranks below the production domain.
 *   4. localhost, for development.
 */
function normalise(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  // A trailing slash would double up in every `${siteUrl}${path}` template.
  return withScheme.replace(/\/+$/, "");
}

export const siteUrl: string =
  normalise(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalise(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ??
  normalise(process.env.NEXT_PUBLIC_VERCEL_URL) ??
  "http://localhost:3000";
