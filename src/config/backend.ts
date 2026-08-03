/**
 * Which storage backend the domain stores run against.
 *
 * "memory"  the in-process seeded stores this project has always used —
 *           zero-dependency, resets on restart. The default.
 * "prisma"  PostgreSQL through Prisma (local Postgres, Supabase, RDS…).
 *           Requires DATABASE_URL and `npm run db:migrate && npm run db:seed`.
 *
 * Each store module reads this flag and exports the matching implementation
 * behind its existing interface, so nothing above the store layer changes.
 * See src/lib/db/adapters/ for the Prisma implementations.
 */
export type DataBackend = "memory" | "prisma";

export const DATA_BACKEND: DataBackend =
  process.env.DATA_BACKEND === "prisma" ? "prisma" : "memory";
