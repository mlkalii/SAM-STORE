# SAMRUX — direct-to-consumer store across fourteen departments

A production-shaped Next.js commerce front end: fourteen departments, 285 catalogue products,
server-rendered filtering and search, on a dark-luxury design system. App Router, React Server Components, Tailwind v4,
shadcn/ui, Framer Motion for interaction, GSAP for the scripted hero and scroll work.

## Stack

| Concern     | Choice                                                |
| ----------- | ----------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)                    |
| UI runtime  | React 19                                              |
| Language    | TypeScript 5 (strict)                                 |
| Styling     | Tailwind CSS v4 (CSS-first `@theme`)                  |
| Components  | shadcn/ui (`base-nova` style, Base UI primitives)     |
| Interaction | Framer Motion — shipped as the `motion` package       |
| Timelines   | GSAP 3 + ScrollTrigger via `@gsap/react`              |
| Icons       | lucide-react                                          |
| Fonts       | `next/font` — Inter, Instrument Serif, JetBrains Mono |

## Getting started

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the build
npm run lint       # eslint (flat config)
npm run typecheck  # tsc --noEmit
npm run catalog    # regenerate src/data/catalog.json
```

Node lives at `/opt/homebrew/bin` on this machine; add it to `PATH` if `node` is not found.

## Brand

`components/brand/logo.tsx` holds the identity: a squircle mark of two converging chevrons
(an abstract X — many departments, one storefront) on a fixed indigo→cyan gradient, beside a
wide-tracked `SAMRUX` wordmark that inherits `currentColor`. `app/icon.svg` is the same mark
as the favicon. Nothing else in the app hard-codes the brand — copy comes from `config/site.ts`.

## Connecting a real inventory source

Two settings, both intentionally **empty**. While empty, the app serves the bundled
catalogue. Fill either in and the data layer switches over with no other change.

```ts
// src/config/data-source.ts
export const PRODUCT_DATA_SOURCE = "";     // store-wide feed (JSON or CSV)

// src/data/categories.ts — one per department
{ slug: "electronics", /* … */ sourceUrl: "" }   // the per-category feed URL
```

Precedence: `PRODUCT_DATA_SOURCE` → each department's `sourceUrl` → `catalog.json`.
A department with a feed replaces only its own products; a failed feed logs and falls
back rather than breaking the page.

```
src/lib/product-source/
├── index.ts        resolves the source, caches per request, merges feeds
├── parse-feed.ts   JSON array / {products:[…]} / CSV with a header row
└── normalize.ts    THE translation point — map supplier fields here, nothing else changes
```

## Theme

Light luxury pages, dark chrome. `:root` is the storefront palette — white canvas, soft grey
sections, black type, deep gold accents, near-black primary actions. `.dark` is a full second
palette used *only* by the chrome: the announcement bar, header stack, footer and policies
strip, and the mobile tab bar each carry a `dark` class, so everything inside them (buttons,
inputs, the mega menu) themes correctly with no one-off overrides.

Shared utilities live in the same file: `glass`, `shadow-premium`, `shadow-premium-lg`,
`ring-luxe`, `text-gold-gradient`, `rule-fade`, `no-scrollbar`. The shadow and gradient
utilities carry a `.dark` variant, since near-black shadows read as dirt on white.

## Authentication

```
src/config/auth.ts          cookie names, TTLs, protected prefixes, social providers
src/lib/auth/session.ts     signed cookies (Web Crypto HMAC) — works in pages, actions and proxy
src/lib/auth/password.ts    scrypt hashing (server only)
src/lib/auth/password-strength.ts  scoring shared by the live meter and the server check
src/lib/auth/user-store.ts  UserStore interface + in-memory implementation
src/lib/auth/csrf.ts        double-submit verification (the token is minted in proxy.ts)
src/lib/auth/validation.ts  validators + the single FormState shape every action returns
src/proxy.ts                route protection and CSRF issuance (Next 16 renamed middleware)
```

Sessions are `base64url(payload).base64url(hmac)` in an httpOnly, sameSite=lax cookie that is
`secure` outside development. A password change bumps a per-account `sessionVersion`, which
retires every existing cookie. `AUTH_SECRET` is required in production; development falls back
to a fixed dev key so sessions never survive a restart.

**The user store is in-memory and not persistent** — accounts disappear on restart. That is a
deliberate placeholder behind an interface; swap `memoryStore` for a database-backed
implementation and nothing above it changes. Verification and reset links are logged rather
than emailed until a transport is wired into `deliverLink`.

`normalize.ts` already accepts common aliases (`title`/`product_name`, `sale_price`,
`compare_at_price`, `image_urls`, `inventory`, …) and handles cents-vs-decimal pricing,
so many feeds work without edits. Everything downstream reads
`src/data/products.ts`, which never touches the JSON directly.

## Catalogue data

285 products — 14 departments × up to 7 product types × 3 tiers (Lite / standard / Pro), each with a verified, self-hosted photo under `public/products/` (credits in `public/products/CREDITS.json`).
Every name, SKU and slug is unique; brands are assigned on a stride co-prime with the
pool size so no two concepts in a department share one.

```
scripts/catalog-source.mjs         10 original departments × 10 concepts
scripts/catalog-source-extra.mjs   +3 concepts for each of those
scripts/catalog-source-tech.mjs    computers & accessories, mobile phones
scripts/catalog-source-lifestyle.mjs  fashion, grocery, toys
scripts/generate-catalog.mjs   deterministic generator → src/data/catalog.json
src/data/catalog.json          the catalogue (6.8 MB, committed and reviewable)
scripts/image-pool.mjs         124 verified Unsplash photo IDs, one pool per department
scripts/review-source.mjs      review copy pools
src/data/products.ts           typed accessors + the query engine
src/data/categories.ts         the ten departments
```

Every product carries: name, brand, SKU, short and long description, features,
specifications, price, discount and compare-at price, rating, review count, written reviews,
stock status and count, category, subcategory, variants, tags, release date, warranty months,
return window, dispatch hours, a video flag, six images, and the
featured / best-seller / new-arrival / trending flags.

Totals: **285 products · 95 product photos · 21 per department (18 automotive, 15 computers)**.

The generator is deterministic — running it twice produces a byte-identical file, so the
catalogue diffs like any other source. Nothing imports the script at runtime.

## Structure

```
src/
├── app/                    # routes only — every file here is a route or a boundary
│   ├── layout.tsx          # fonts, metadata, providers, header/footer shell
│   ├── page.tsx            # home
│   ├── shop/               # /shop and /shop/[slug]
│   ├── categories/         # /categories and /categories/[slug]
│   ├── deals/ new-arrivals/ best-sellers/
│   ├── search/             # full search results
│   ├── api/search/         # type-ahead: products, brands, departments
│   ├── api/products/       # rehydrate products by slug (compare tray)
│   ├── wishlist/ compare/  # client-side lists
│   ├── cart/ about/ contact/
│   ├── sitemap.ts          # static routes + 10 categories + 300 products
│   └── loading · error · not-found
├── components/
│   ├── ui/                 # shadcn primitives (lint-ignored, kept near upstream)
│   ├── brand/              # logo and mark
│   ├── common/             # container, reveal, magnetic, category icon, motion wrappers
│   ├── layout/             # header, mobile nav, cart drawer, footer
│   ├── product/            # card, image, gallery, badges, actions, reviews, buy panel
│   ├── skeletons/          # loading placeholders that mirror real layouts
│   ├── shop/               # browser shell: filters, sort, pagination, department rail
│   ├── search/             # header search field
│   ├── cart/ contact/ home/
│   └── providers/          # cart context + toaster
├── config/site.ts          # brand, nav, thresholds
├── data/                   # catalogue, categories, query engine
├── hooks/ lib/ types/
```

### Browsing, filtering and search

All listing pages share one shell — `components/shop/product-browser.tsx` — and one URL
contract defined in `lib/browse-params.ts`:

```
?q=      free text          ?sub=    subcategories (comma separated)
?brand=  brands             ?min= ?max=  price band in cents
?rating= minimum rating     ?stock=1 ?sale=1
?sort=   relevance | popular | new | price-asc | price-desc | rating | discount
?page=   1-based, 24 per page
```

Filters are plain `<Link>`s, not client state, so every combination is a real server-rendered
URL that can be shared or bookmarked. Facet counts come from the pool *before* narrowing, so a
shopper can always see what unticking a box would give back. The mobile drawer wraps the same
Server Component rather than duplicating it.

Search runs over name, brand, SKU, subcategory, tags and description with a weighted score;
`/api/search` serves type-ahead — products, brands and departments — so the 2.6 MB
catalogue never reaches the client bundle.

### Conventions

- `src/app` holds routes and boundaries only. Anything reusable lives in `src/components`.
- Server Components by default. `"use client"` appears only where state, refs, or animation
  demand it — cards, drawers, forms, the hero, the search field.
- Prices are integer cents and format through `lib/format.ts`.
- Dynamic routes use the generated `PageProps<"/route">` helper and `await props.params`.
- GSAP plugins are registered once in `lib/gsap.ts`; import `gsap`/`ScrollTrigger` from there.
- Every animation checks `prefers-reduced-motion` before it runs.

## Cart

`lib/cart-store.ts` is a small external store read through `useSyncExternalStore`: no hydration
round trip, `localStorage` persistence, cross-tab sync. Each line carries a product snapshot
(name, brand, price, gradient, variant), so the cart renders without importing the catalogue.

## Product imagery

Real photography from Unsplash (free for commercial use under the Unsplash License).
`scripts/image-pool.mjs` holds 124 curated photo IDs — every one verified to resolve and
visually checked against its department — and the generator assigns six per product with a
rotating offset so neighbouring products never share a lead shot.

`components/product/product-image.tsx` wraps `next/image`: responsive `sizes`, AVIF/WebP
negotiation, lazy loading below the fold, `priority` on the first grid row and the PDP hero,
and descriptive alt text. The department gradient paints underneath as both the loading state
and the offline/dead-URL fallback, so a card always has its final shape.

To use your own photography: drop files under `public/products/<slug>/` and point
`buildImages` in `scripts/generate-catalog.mjs` at them. Add your CDN to
`images.remotePatterns` in `next.config.ts`.

## Product detail page

Gallery with cursor-tracking zoom, a full-screen viewer (arrow-key navigable), a thumbnail
slider and a video slot. Brand link, copyable SKU, specifications, features, description,
warranty, shipping and returns. Delivery estimate that resolves after hydration so a
prerendered page never shows a stale date. Reviews with distribution bars, star ratings and
verified-purchase badges — server-rendered, so they are indexable. Wishlist, compare, share,
sticky add-to-cart, buy now, related products, more-from-this-brand, and recently viewed.
`Product`, `Offer`, `AggregateRating` and `Review` JSON-LD ship with every page.

## Client-side lists

Wishlist, compare and recently-viewed all use one factory —
`lib/client-store.ts` — built on `useSyncExternalStore`: no hydration round trip, no
setState-in-effect, `localStorage` persistence and cross-tab sync. They store compact
`ProductRef`s; `/api/products` rehydrates full records for the compare table, so the
2.6 MB catalogue never reaches the browser.

## Commerce domain

Business logic lives in `src/lib/commerce/` and is free of React — services, not
components. UI calls them; nothing recalculates money on its own.

```
types.ts        the vocabulary (Cents, PricedLine, Order, Promotion, …)
pricing.ts      THE totals pipeline — subtotal → promotions → coupons → shipping → tax → gift cards
promotions.ts   one evaluator for percentage / fixed / free-shipping / BOGO / bundle / flash
gift-cards.ts   balances, validation, redemption, restore-on-cancel
shipping.ts     zones, methods, rates, business-day delivery estimates
tax.ts          destination rate table (swap for Avalara/TaxJar/Stripe Tax)
inventory.ts    stock snapshots, reservations, backorder eligibility
orders.ts       placement + the whole lifecycle (advance, cancel, return, refund, reorder)
notifications.ts  order / price / stock / promo feed
search-insights.ts  trending and popular queries
```

`priceCart()` is the single source of every number a customer sees. The browser
submits *what* is in the basket; the server decides *what it costs*, always
re-derived from the catalogue — a tampered payload can change the basket but
never the price (verified: a client claiming `unitPrice: 1` is priced at $248.99).

`src/lib/payments/` holds one `PaymentProvider` interface and six providers
(Stripe, PayPal, Apple Pay, Google Pay, bank transfer, cash on delivery). None
hold credentials; `isConfigured()` reads the environment, and an unconfigured
provider is shown as unavailable rather than pretending to work.

`src/lib/email/` renders nine transactional templates through one shared layout
and sends them via an `EmailTransport` seam. The console transport logs a
summary; swap it for Resend/Postmark/SES and every message ships.

`src/lib/admin/` is architecture only — the query surface a future admin
dashboard sits on (products, categories, orders, customers, coupons, reviews,
reports). Mutations deliberately stay in the domain services, so there is one
place an order can change state whoever triggered it.

## Not wired up

Checkout and the contact form are deliberate stubs — connect a payment provider and a Server
Action respectively. `/collections` and `/collections/:slug` permanently redirect to the
`/categories` equivalents, left over from the store's single-department origins.
