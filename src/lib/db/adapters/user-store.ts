import "server-only";

import { randomUUID } from "node:crypto";

import { getPrisma } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { AuthToken, User, UserStore } from "@/lib/auth/user-store";

/**
 * PostgreSQL-backed UserStore.
 *
 * The exemplar adapter: it implements the exact interface the in-memory store
 * exports, so `src/lib/auth` switches backend by changing which implementation
 * it re-exports — nothing above the store layer knows the difference.
 *
 * Two mapping decisions worth noting:
 *
 * - `orders` and `notifications` live on the in-memory User object but are
 *   separate tables here. The application already reads orders through
 *   `orderStore`, so the adapter returns them empty rather than eagerly
 *   loading a join nobody uses.
 * - Soft delete: `deletedAt` rows are invisible to every query here. Nothing
 *   in this adapter hard-deletes.
 */

const AVATAR_COLOURS = [
  "from-indigo-500 to-sky-500",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
];

type UserRow = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getPrisma>["user"]["findFirst"]>>
>;

function toUser(row: UserRow, addresses: User["addresses"] = []): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    emailVerified: row.emailVerified,
    sessionVersion: row.sessionVersion,
    createdAt: row.createdAt.toISOString(),
    avatarColor: row.avatarColor,
    phone: row.phone ?? undefined,
    marketingOptIn: row.marketingOptIn,
    addresses,
    // Read through orderStore / notification store, not from the user row.
    orders: [],
    notifications: [],
    linkedProviders: row.linkedProviders,
  };
}

async function findRow(where: { id?: string; email?: string }) {
  const prisma = getPrisma();
  const row = await prisma.user.findFirst({
    where: { ...where, deletedAt: null },
  });
  if (!row) return undefined;

  const addresses = await prisma.address.findMany({
    where: { userId: row.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return toUser(
    row,
    addresses.map((address) => ({
      id: address.id,
      label: address.label,
      recipient: address.recipient,
      line1: address.line1,
      line2: address.line2 ?? undefined,
      city: address.city,
      postcode: address.postcode,
      country: address.country,
      phone: address.phone ?? undefined,
      isDefault: address.isDefault,
    })),
  );
}

export const prismaUserStore: UserStore = {
  async findByEmail(email) {
    return findRow({ email: email.trim().toLowerCase() });
  },

  async findById(id) {
    return findRow({ id });
  },

  async create({ email, name, password }) {
    const prisma = getPrisma();
    const count = await prisma.user.count();

    const row = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        passwordHash: await hashPassword(password),
        avatarColor: AVATAR_COLOURS[count % AVATAR_COLOURS.length],
      },
    });
    return toUser(row);
  },

  async update(id, patch) {
    const prisma = getPrisma();

    // Addresses are their own table; everything else maps one-to-one.
    const { addresses, orders, notifications, createdAt, ...scalar } = patch;
    void orders;
    void notifications;
    void createdAt;

    const row = await prisma.user
      .update({ where: { id }, data: scalar })
      .catch(() => undefined);
    if (!row) return undefined;

    if (addresses) {
      // Replace-all semantics, matching the in-memory store's behaviour.
      //
      // Upsert rather than soft-delete-then-insert. Callers hand back the rows
      // they were given, ids included, so re-inserting them after a soft delete
      // collides on the primary key — the soft-deleted row is still physically
      // there. That made every address change after the very first one fail on
      // Address_pkey, which the first-address-only smoke test never reached.
      //
      // Anything the caller omitted is soft-deleted, so history survives.
      const keep = addresses.map((address) => address.id);
      await prisma.$transaction([
        prisma.address.updateMany({
          where: { userId: id, deletedAt: null, id: { notIn: keep } },
          data: { deletedAt: new Date() },
        }),
        ...addresses.map((address) => {
          const fields = {
            label: address.label,
            recipient: address.recipient,
            line1: address.line1,
            line2: address.line2 ?? null,
            city: address.city,
            postcode: address.postcode,
            country: address.country,
            phone: address.phone ?? null,
            isDefault: address.isDefault,
            // An id reappearing after a soft delete is a revival, not a ghost.
            deletedAt: null,
          };
          return prisma.address.upsert({
            where: { id: address.id },
            create: { id: address.id, userId: id, ...fields },
            update: fields,
          });
        }),
      ]);
    }

    return findRow({ id });
  },

  async verifyCredentials(email, password) {
    const user = await findRow({ email: email.trim().toLowerCase() });

    // Same-cost rejection for unknown emails — no timing oracle.
    if (!user) {
      await verifyPassword(password, "scrypt$00$00");
      return null;
    }
    return (await verifyPassword(password, user.passwordHash)) ? user : null;
  },

  async setPassword(id, password) {
    const prisma = getPrisma();
    const row = await prisma.user
      .update({
        where: { id },
        data: {
          passwordHash: await hashPassword(password),
          // Retire every existing session.
          sessionVersion: { increment: 1 },
        },
      })
      .catch(() => undefined);
    return row ? findRow({ id }) : undefined;
  },

  async issueToken(userId, kind, ttlSeconds) {
    const prisma = getPrisma();
    const token = randomUUID().replaceAll("-", "");
    await prisma.authToken.create({
      data: {
        token,
        userId,
        kind,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
    return token;
  },

  async consumeToken(token, kind) {
    const prisma = getPrisma();

    // Delete-then-check makes consumption atomic: two racing requests cannot
    // both redeem the same token.
    const row = await prisma.authToken
      .delete({ where: { token } })
      .catch(() => null);
    if (!row || row.kind !== kind || row.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const consumed: AuthToken = {
      token: row.token,
      userId: row.userId,
      kind: row.kind as AuthToken["kind"],
      expiresAt: row.expiresAt.getTime(),
    };
    return consumed;
  },
};
