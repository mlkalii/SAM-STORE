import { NextResponse } from "next/server";

import { DATA_BACKEND } from "@/config/backend";
import { siteUrl } from "@/config/site-url";
import { StorageNotConfiguredError, storageDriver } from "@/lib/storage";
import { getProducts } from "@/data/products";

/**
 * Health check for load balancers, uptime monitors and container orchestration.
 *
 * `GET /api/health` answers in constant time with the things a probe actually
 * needs: is the process up, can it read its data source, which backend is it
 * on, and which build is running. No secrets, no internals.
 *
 * It also names the configuration a deployment is missing. On a serverless host
 * the usual failures are not crashes — they are a build that came up with no
 * database, no mail provider and no media bucket, and then quietly lost every
 * account it created. Those read as application bugs unless something says
 * plainly what is unset, so this endpoint does.
 */

/** Configuration that must be real before the deployment is production-grade. */
function warnings(): string[] {
  const notes: string[] = [];
  if (process.env.NODE_ENV !== "production") return notes;

  if (DATA_BACKEND !== "prisma") {
    notes.push(
      "DATA_BACKEND is 'memory': accounts, orders and seller records live in this " +
        "instance's RAM. On a serverless host every instance has its own copy and " +
        "loses it on shutdown. Set DATA_BACKEND=prisma with DATABASE_URL to persist.",
    );
  } else if (!process.env.DATABASE_URL) {
    notes.push("DATA_BACKEND=prisma but DATABASE_URL is unset.");
  }

  // Mirror the length rule in lib/auth/session.ts. Testing only for presence
  // would give a green probe for AUTH_SECRET="changeme" while every sign-in
  // throws — and this endpoint is the post-deploy gate the guide points at.
  const authSecret = process.env.AUTH_SECRET ?? "";
  if (authSecret.length < 16) {
    notes.push(
      authSecret
        ? "AUTH_SECRET is shorter than 16 characters: sign-in and registration will fail."
        : "AUTH_SECRET is unset: sign-in and registration will fail.",
    );
  }
  const adminSecret = process.env.ADMIN_AUTH_SECRET;
  if (adminSecret !== undefined && adminSecret.length < 16) {
    notes.push("ADMIN_AUTH_SECRET is set but shorter than 16 characters: admin sign-in will fail.");
  }
  if (!process.env.EMAIL_PROVIDER) {
    notes.push("EMAIL_PROVIDER is unset: transactional mail is logged, not delivered.");
  }
  // Ask the driver itself rather than testing one variable, so a provider
  // named without its credentials is reported here instead of at upload time.
  try {
    storageDriver();
  } catch (error) {
    notes.push(
      error instanceof StorageNotConfiguredError
        ? `Media uploads unavailable: ${error.message}`
        : "Media uploads unavailable: storage configuration could not be resolved.",
    );
  }
  // The resolved origin, not the variable — on Vercel the deployment domain
  // is a perfectly good fallback, and warning about it would be noise.
  if (siteUrl.startsWith("http://localhost")) {
    notes.push(
      "No public origin resolved: canonicals, the sitemap and email links point at localhost. " +
        "Set NEXT_PUBLIC_SITE_URL.",
    );
  }
  return notes;
}

export async function GET() {
  const startedAt = Date.now();

  let catalogOk = false;
  let productCount = 0;
  try {
    const products = await getProducts();
    productCount = products.length;
    catalogOk = productCount > 0;
  } catch {
    catalogOk = false;
  }

  const configuration = warnings();

  // Warnings never fail the probe: an uptime monitor should page for a process
  // that cannot serve, not for one that is serving with demo-grade storage.
  const healthy = catalogOk;

  return NextResponse.json(
    {
      status: healthy ? (configuration.length > 0 ? "ok:unconfigured" : "ok") : "degraded",
      backend: DATA_BACKEND,
      persistent: DATA_BACKEND === "prisma" && Boolean(process.env.DATABASE_URL),
      catalog: { ok: catalogOk, products: productCount },
      configuration,
      version: process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
