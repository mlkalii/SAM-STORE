import "server-only";

import { randomUUID } from "node:crypto";

/**
 * Audit log.
 *
 * Every privileged mutation — admin and seller actions — records who did what
 * to which resource. Append-only; the in-memory implementation mirrors the
 * `AuditLog` table in the Prisma schema row for row.
 *
 * `actorLabel` is denormalised on purpose: the log must still make sense after
 * the actor's account is gone.
 */

export interface AuditEntry {
  id: string;
  actorType: "staff" | "seller" | "user" | "system";
  actorId: string;
  actorLabel: string;
  /** Verb-object, e.g. "product.update", "seller.approve", "payout.paid". */
  action: string;
  /** e.g. "product:aeris-wireless-headphones", "seller:seller-northline". */
  resource: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

const globalForAudit = globalThis as unknown as { __samruxAuditLog?: AuditEntry[] };

function state() {
  if (!globalForAudit.__samruxAuditLog) globalForAudit.__samruxAuditLog = [];
  return globalForAudit.__samruxAuditLog;
}

const MAX_IN_MEMORY = 5_000;

export const auditLog = {
  record(input: Omit<AuditEntry, "id" | "createdAt">) {
    const entry: AuditEntry = {
      ...input,
      id: `aud-${randomUUID().slice(0, 12)}`,
      createdAt: new Date().toISOString(),
    };
    state().unshift(entry);
    // Memory backend keeps a bounded window; the database keeps everything.
    if (state().length > MAX_IN_MEMORY) state().length = MAX_IN_MEMORY;
    return entry;
  },

  recent(limit = 50) {
    return state().slice(0, limit);
  },

  forResource(resource: string, limit = 50) {
    return state()
      .filter((entry) => entry.resource === resource)
      .slice(0, limit);
  },
};
