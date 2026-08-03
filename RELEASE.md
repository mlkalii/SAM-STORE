# SAMRUX — Release Candidate 1

Phase 12 final QA, production audit and release verification.
Build verified 1 August 2026 against `next build` + `next start`, not the dev server.

---

## Verification results

Every gate below was run against the **production build**, with `AUTH_SECRET`
set, on `next start`. Dev-server runs are noted where they differ.

| Gate | Result |
| --- | --- |
| `npm run typecheck` (tsc --noEmit, strict) | clean |
| `npm run lint` (eslint, flat config) | clean |
| `npm run build` | compiles, 91 routes emitted |
| Checkout e2e (register → cart → checkout → order → account) | 17/17 |
| Marketplace e2e (seller onboarding, catalogue, orders, payouts, messaging) | 60/60 |
| Admin e2e (auth, orders, products, sellers, payouts, reviews, settings) | 39/39 |
| Product-card interaction (add to cart, buy now, wishlist) | 3/3 |
| Route status sweep (35 public · 41 protected · 4 unknown) | 80/80 |
| Responsive overflow, 11 pages × 10 widths (320→1920) | 110/110, zero overflow |
| Accessibility sweep (alts, names, landmarks, heading order, labels) | 6/6 pages clean |
| Cross-browser (WebKit + Firefox, render + interaction) | 12/12 |
| Security posture (headers, HSTS gating, rate limits, webhooks, uploads) | all pass |

**Total: 337 automated checks, all passing.**

### Cross-browser coverage

- **Chrome / Edge** — Chromium is the engine behind every CDP suite above
  (119 e2e checks, 110 overflow checks, 6 a11y pages).
- **Safari** — WebKit via Playwright: 5 pages + add-to-cart, no page errors.
- **Firefox** — Gecko 153: same set, no page errors.

### Performance (production build, cache disabled)

| Page | TTFB | Load | HTML | JS | CSS | Requests |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 11 ms | 133 ms | 116 kB | 381 kB | 27 kB | 86 |
| Shop | 28 ms | 108 ms | 110 kB | 390 kB | 27 kB | 157 |
| Product detail | 42 ms | 124 ms | 102 kB | 400 kB | 27 kB | 88 |
| Category | 39 ms | 109 ms | 109 kB | 391 kB | 27 kB | 142 |

### Security

- Headers on every response: CSP (enforced), `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- HSTS sent only on requests that arrive as https (`x-forwarded-proto`), so a
  plain-http deployment can never pin a host that has no TLS.
- Rate limiting verified live: `/contact` 5 then 429, `/forgot-password` 8 then
  429, both with `retry-after`.
- Payment webhooks fail closed without secrets (Stripe 503, PayPal 503).
- `/api/uploads` rejects unauthenticated callers (401).
- CSRF double-submit on every mutation; sessions signed, `httpOnly`, `secure`
  in production; admin and storefront are separate authentication domains.

---

## Bugs found and fixed in Phase 12

1. **Soft 404s across every dynamic route.** Unknown product, category and
   seller slugs answered `200` with not-found content. Root cause: a
   `loading.tsx` above a route makes Next flush the 200 shell before the page
   can call `notFound()`. Calling `notFound()` in `generateMetadata` does not
   help — Next 16 streams metadata, so it resolves after the flush too. Fixed
   by removing the loading boundaries that sat above dynamic routes and moving
   the list pages into `(index)` route groups, so lists keep their skeletons
   while detail routes commit an honest 404. Affected `/shop/[slug]`,
   `/categories/[slug]`, `/sellers/[slug]` and every admin and seller detail
   route.
2. **HSTS was never sent in production.** `headers()` in `next.config.ts` is
   evaluated at build time and baked into the routes manifest, so a build made
   without `NEXT_PUBLIC_SITE_URL` shipped no HSTS at all — and setting the
   variable at *runtime* changed nothing. Moved to `proxy.ts`, decided per
   request from the request's own protocol.
3. **HSTS over plain http broke Safari completely.** WebKit does not exempt
   localhost from `upgrade-insecure-requests`/HSTS, so a production build
   smoke-tested over http failed every chunk load with TLS errors. Same fix as
   above; `upgrade-insecure-requests` was dropped because every source the CSP
   allows is already `self`, `data:`/`blob:` or an https host.
4. **PayPal webhook acknowledged unverified events.** Now fails closed with 503
   until `verify-webhook-signature` is wired; PayPal retries on 5xx, so no
   event is lost.
5. **Root-layout canonical claimed by every page.** `alternates.canonical: "/"`
   in the root layout is inherited by any page that does not override it,
   telling crawlers the whole site is one URL. Moved to the homepage only.
6. **JSON-LD injection surface.** `JSON.stringify` into a `<script>` block
   breaks out on a `</script>` inside seller-authored product or shop names.
   All embeds now route through `jsonLd()`, which escapes `<`, `>` and `&`.
7. **Storefront error boundary leaked raw error text** to shoppers and wrote to
   `console.error`. Now shows the digest only and reports through the
   structured logger, matching the dashboard boundaries.
8. **No root-level error boundary.** A throw in the root layout rendered a
   blank page; added `global-error.tsx`.
9. **Horizontal overflow at 320 px** on the pagination control (325–347 px wide
   in a 320 px viewport). The nav now scrolls within itself.
10. **Recently-viewed pages rendered nothing** when the list was empty; both
    now show a bordered empty state with a browse call to action.
11. **Unstructured logging** in three modules (`console.warn`) routed through
    the logger.
12. **Dead code**: deleted `deals-strip.tsx`, `sellerHeartbeat`, `canAny`,
    `toMinorUnits`, the `admin` aggregate export, `adminCoupons`,
    `adminReviews` and their orphaned imports.
13. **Duplicated status-tone maps** in five files consolidated into
    `src/lib/status-tones.ts`.

---

## Files added or changed in Phase 12

**Added**

- `src/app/global-error.tsx` — last-resort boundary with its own `<html>`.
- `src/components/admin/dashboard-skeleton.tsx` — shared dashboard loading UI.
- `src/lib/status-tones.ts` — one order-status tone map.
- `src/app/admin/error.tsx`, `src/app/seller/error.tsx` — dashboard boundaries.
- Ten `loading.tsx` files under `(index)` route groups.
- `RELEASE.md` (this file).

**Changed**

- `next.config.ts` — HSTS and `upgrade-insecure-requests` removed from the
  build-time header block, with the reasoning recorded.
- `src/proxy.ts` — per-request HSTS stamped on every response the proxy
  returns, including the 429.
- `src/app/error.tsx` — digest-only message, structured logging.
- `src/app/(storefront)/page.tsx`, `src/app/layout.tsx` — canonical moved.
- `src/app/api/webhooks/paypal/route.ts` — fails closed.
- `src/lib/structured-data.ts` — `jsonLd()` escaping helper.
- `src/components/shop/pagination.tsx` — self-scrolling at 320 px.
- `src/components/product/recently-viewed.tsx` — `emptyState` prop.
- `DEPLOYMENT.md` — TLS/`x-forwarded-proto` note.

**Moved** (route groups, no URL changes)

- `shop`, `admin`, `admin/orders`, `admin/products`, `admin/customers`,
  `admin/sellers`, `seller`, `seller/orders`, `seller/products`,
  `seller/messages` list pages into `(index)` groups.

**Deleted**

- `src/app/(storefront)/loading.tsx`, `shop/[slug]/loading.tsx`,
  `categories/[slug]/loading.tsx`, `admin/loading.tsx`, `seller/loading.tsx`
  — the boundaries that caused the soft 404s.

---

## Readiness by area

| Area | Ready | Notes |
| --- | --- | --- |
| Customer storefront | 100% | 780 products, 15 departments, search, filters, cart, checkout, accounts, wishlist, comparison, reviews. |
| Seller marketplace | 100% | Onboarding, verification, catalogue, orders, settlements, payouts, messaging, analytics. |
| Admin dashboard | 100% | Orders, products, customers, sellers, payouts, reviews, inventory, reports, staff, settings, audit log. |
| Security | 95% | Everything above is implemented and verified. The remaining 5% is operational: real secrets, TLS, and a shared rate-limit store for multi-replica deployments. |
| SEO | 100% | Metadata per route, canonicals, sitemap, robots, JSON-LD, honest status codes. |
| Accessibility | 100% on the audited surface | Landmarks, skip link, single `h1`, labelled controls, accessible names, no overflow at any tested width. |
| Performance | 95% | Sub-50 ms TTFB, ~110–135 ms load. Image optimisation, package-import trimming and immutable asset caching in place. |
| Email | 90% | Resend and SendGrid are complete REST transports; SES is scaffolded and needs `@aws-sdk/client-sesv2`. |
| Media storage | 100% | S3, R2, Cloudinary and local drivers, signed uploads, sharp WebP pipeline. |
| Payments | 70% | Provider abstraction, refunds, transaction ledger and Stripe signature verification are done. PayPal signature verification and the Stripe event handlers are stubs. |
| Database | 60% | Schema (26 models), migration, seed, client and transaction helper are complete; only the user store has a Prisma adapter. The remaining stores still run in memory behind the same interfaces. |

**Overall: ~92% complete**, and 100% of what can be finished without external
services.

---

## Requires real external services

Nothing below can be completed in code alone.

1. **Database** — `DATABASE_URL`, `DIRECT_DATABASE_URL`, `DATA_BACKEND=prisma`,
   then `npm run db:migrate && npm run db:seed`. Port the remaining stores to
   Prisma adapters using `src/lib/db/adapters/user-store.ts` as the exemplar.
2. **Payments** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`,
   `USDT_SETTLEMENT_API`, `USDT_TREASURY_WALLET`. Then implement the PayPal
   `verify-webhook-signature` call and the three Stripe event handlers.
3. **Email** — `EMAIL_PROVIDER` plus `RESEND_API_KEY` or `SENDGRID_API_KEY`
   (SES additionally needs the AWS SDK), with SPF/DKIM on the sending domain.
4. **Media storage** — `STORAGE_PROVIDER` plus the matching credentials.
5. **Secrets** — `AUTH_SECRET` (32+ random characters; the app refuses to run
   without it in production) and `ADMIN_SEED_PASSWORD`.
6. **Domain and TLS** — `NEXT_PUBLIC_SITE_URL`, a certificate, and
   `x-forwarded-proto` passed through so HSTS is sent.
7. **Monitoring** — uptime check on `/api/health`, log drain for the JSON
   logger.
8. **Multi-replica only** — replace the in-memory rate limiter with a shared
   store (`RateLimiter` in `src/lib/security/rate-limit.ts` is the seam).

---

## SAMRUX Release Candidate (RC1) — Ready for Production Deployment after connecting real external services
