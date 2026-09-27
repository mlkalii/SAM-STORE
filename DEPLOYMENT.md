# SAMRUX — deployment guide

The platform runs anywhere Next.js 16 runs. Three tested paths, in ascending
order of infrastructure ownership.

## 0. Prerequisites (all targets)

1. Copy `.env.example` and fill in, at minimum:
   - `AUTH_SECRET` — `openssl rand -hex 32`
   - `NEXT_PUBLIC_SITE_URL` — the public origin
   - `ADMIN_SEED_PASSWORD` — replaces the development staff password
2. Choose backends (each defaults to a zero-config development mode):
   - `DATA_BACKEND=prisma` + `DATABASE_URL` + `DIRECT_DATABASE_URL`
   - `EMAIL_PROVIDER=resend|sendgrid|ses` + the matching key
   - `STORAGE_PROVIDER=s3|r2|cloudinary` + the matching credentials
   - Payment provider keys (`STRIPE_*`, `PAYPAL_*`)
3. Database bring-up (once per environment):

   ```sh
   npm run db:migrate     # applies prisma/migrations (0001_init creates all tables)
   npm run db:seed        # staff accounts, catalogue, gift cards
   ```

## 1. Vercel

Import the repository; framework preset **Next.js**; no build overrides needed.
`postinstall` runs `prisma generate`, which works with no database attached.

### Read this before the first deploy

**A deploy with no `DATABASE_URL` will look broken, and the code is behaving
correctly.** With `DATA_BACKEND=memory` every store lives in the RAM of one
serverless instance. Vercel runs many instances and discards them freely, so:

- an account registered on one request may not exist on the next,
- orders and support messages disappear on redeploy,
- rate-limit counters are per instance, so the effective limit is the
  configured one multiplied by the number of live instances,
- each cold start re-seeds the demo catalogue and orders.

That mode is a demo. `GET /api/health` reports `persistent: false` and lists
exactly what is unset — check it immediately after the first deploy.

### Do not set `NODE_ENV` yourself

Vercel sets it. Adding `NODE_ENV=production` (or `NPM_CONFIG_PRODUCTION=true`) to the
project's environment variables makes the install skip `devDependencies`, and
the build then fails on `@tailwindcss/postcss` while compiling `globals.css`.
The CSS toolchain is build-time by design and lives in `devDependencies`, which
Vercel installs by default.

### Environment variables

Set these in Project Settings → Environment Variables, for Production *and*
Preview (a preview build with no `AUTH_SECRET` cannot sign anyone in).

| Variable | Needed for | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | sign-in, registration | `openssl rand -hex 32`. Without it every auth request throws. |
| `NEXT_PUBLIC_SITE_URL` | canonicals, sitemap, email links | Falls back to the Vercel domain; set it once a custom domain is attached. |
| `DATA_BACKEND=prisma` + `DATABASE_URL` + `DIRECT_DATABASE_URL` | persistence | Supabase: pooled string as `DATABASE_URL`, direct as `DIRECT_DATABASE_URL`. |
| `EMAIL_PROVIDER` + `RESEND_API_KEY` / `SENDGRID_API_KEY` | real mail | Without it mail is logged, not sent. |
| `STORAGE_PROVIDER` + credentials | staff uploads | Without it `/api/uploads` answers 503 — the local driver is refused in production because the filesystem is read-only. |
| `ADMIN_SEED_PASSWORD` | staff sign-in | Otherwise the seeded development password applies. |
| Payment keys | checkout, webhooks | `STRIPE_*`, `PAYPAL_*`. Webhooks answer 503 until their secrets exist. |

### `NEXT_PUBLIC_*` changes need a redeploy

Next inlines every `NEXT_PUBLIC_*` variable into the bundle at build time.
Adding or changing `NEXT_PUBLIC_SITE_URL` in the Vercel dashboard does nothing
to the deployment already running — redeploy for it to take effect. Everything
else (`AUTH_SECRET`, `DATABASE_URL`, provider keys) is read at runtime and
takes effect on the next request.

`GET /api/health` reports the origin it actually resolved, so it will tell you
if a deployment is still building links from `localhost`.

### Migrations

Run them from CI or locally against the production database, never from the
serverless runtime:

```sh
DATABASE_URL=… npm run db:migrate
DATABASE_URL=… npm run db:seed
```

### After deploying

- `GET /api/health` — `status`, `persistent`, and a `configuration` array
  naming anything still unset. This is the uptime target too.
- Logs are structured JSON (`LOG_LEVEL`), ready for Vercel Log Drains.
- HSTS is sent automatically: Vercel terminates TLS and forwards
  `x-forwarded-proto`, which is what the proxy keys on.

## 2. Docker (any container host)

```sh
docker build -t samrux .
docker run -p 3000:3000 --env-file .env.production samrux
```

- The image is multi-stage, standalone-output, non-root, with a built-in
  `HEALTHCHECK` against `/api/health`.
- `STORAGE_PROVIDER=local` is ephemeral inside a container — use `s3`, `r2` or
  `cloudinary` in production.
- Horizontal scaling note: the in-memory rate limiter and (if still enabled)
  the memory data backend are per-instance. For more than one replica, run
  `DATA_BACKEND=prisma` and swap the rate limiter for a shared store (the
  `RateLimiter` interface in `src/lib/security/rate-limit.ts` is the seam).

## 3. AWS

- **App**: the Docker image on ECS/Fargate or App Runner; ALB health check
  path `/api/health`; minimum 2 tasks across AZs.
- **Database**: RDS PostgreSQL (or Aurora). `DATABASE_URL` through RDS Proxy;
  `DIRECT_DATABASE_URL` straight to the instance for migrations.
- **Email**: SES — install `@aws-sdk/client-sesv2` and complete the two-line
  `deliver()` in `src/lib/email/transports.ts`; verify the sending domain.
- **Media**: S3 + CloudFront; set `S3_PUBLIC_BASE_URL` to the distribution.
- **Secrets**: Parameter Store / Secrets Manager → task environment. Nothing
  in the codebase reads keys from anywhere but `process.env`.

## Observability

- `/api/health` — status, backend, catalogue reachability, version, latency.
- `src/lib/observability/logger.ts` — one JSON line per event in production
  (`email.delivery_failed`, `stripe.webhook.received`, `upload.stored`…).
- Audit trail of privileged mutations: Admin → Settings → Security.

## Production checklist

- [ ] `AUTH_SECRET` set and unique per environment
- [ ] `ADMIN_SEED_PASSWORD` set (or seed accounts disabled after first login)
- [ ] `DATA_BACKEND=prisma`, migrations applied, seed run
- [ ] Payment provider keys + webhook secrets set; webhook endpoints registered
      (`/api/webhooks/stripe`, `/api/webhooks/paypal`)
- [ ] `EMAIL_PROVIDER` set; sending domain verified (SPF/DKIM)
- [ ] `STORAGE_PROVIDER` set to a durable backend
- [ ] TLS terminated in front of the app, with `x-forwarded-proto` passed
      through — HSTS is sent on any request that arrives as https
- [ ] Uptime monitor on `/api/health`; log drain configured
