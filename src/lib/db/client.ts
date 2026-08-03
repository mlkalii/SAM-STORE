import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Lazy on purpose: the client is only constructed the first time something
 * asks for it, so running with `DATA_BACKEND=memory` (the default today)
 * never opens a connection and never requires DATABASE_URL to exist.
 *
 * The `globalThis` cache is the standard Next.js pattern — dev hot reload
 * re-evaluates modules, and without it every reload would leak a pool.
 */

const globalForPrisma = globalThis as unknown as { __samruxPrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__samruxPrisma) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Set it (see .env.example) or run with DATA_BACKEND=memory.",
      );
    }

    const adapter = new PrismaPg({ connectionString: url });
    globalForPrisma.__samruxPrisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.__samruxPrisma;
}

/**
 * Serialisable transaction helper.
 *
 * Everything that moves money — placing an order, settling commission,
 * marking a payout paid — goes through here so the ledger can never observe
 * a half-applied write.
 */
export async function inTransaction<T>(
  work: (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  return getPrisma().$transaction(work, { isolationLevel: "Serializable" });
}
