import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * DATABASE_URL         the pooled runtime connection (Supabase: the pgbouncer
 *                      URL; RDS: the proxy endpoint)
 * DIRECT_DATABASE_URL  the direct connection Migrate needs for DDL
 *
 * Both come from the environment — see .env.example. `npm run db:migrate`
 * applies migrations, `npm run db:seed` loads the demo catalogue.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Migrate uses the DIRECT url when one is provided (Supabase: the
    // non-pooled connection); the runtime pool is configured in
    // src/lib/db/client.ts from DATABASE_URL.
    //
    // The fallback exists so schema-only commands (validate, generate, format)
    // work without a database — `prisma generate` runs from postinstall on
    // every Vercel build, where no DATABASE_URL is set. It deliberately points
    // at the reserved `.invalid` TLD, which can never resolve: an earlier
    // `localhost:5432` default meant an unconfigured `prisma migrate deploy`
    // would quietly find a developer's local Postgres and migrate that instead
    // of failing.
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgresql://unset.invalid:5432/samrux?schema=public",
  },
});
