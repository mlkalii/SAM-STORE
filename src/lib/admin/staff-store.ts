import "server-only";

import { randomUUID } from "node:crypto";

import type { AdminRole } from "@/config/admin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * Staff accounts.
 *
 * Separate from customer accounts on purpose: a shopper record and a staff
 * record have different lifecycles, different auth and different blast radius.
 * Same in-memory-behind-an-interface pattern as everything else — swap
 * `memoryStaffStore` for a table and nothing above it changes.
 */

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  lastSeenAt?: string;
  avatarColor: string;
  /** Bumped on password change so existing admin sessions stop validating. */
  sessionVersion: number;
}

export interface StaffToken {
  token: string;
  staffId: string;
  kind: "reset-password";
  expiresAt: number;
}

export interface StaffStore {
  list(): Promise<StaffUser[]>;
  findByEmail(email: string): Promise<StaffUser | undefined>;
  findById(id: string): Promise<StaffUser | undefined>;
  create(input: { email: string; name: string; role: AdminRole; password: string }): Promise<StaffUser>;
  update(id: string, patch: Partial<Omit<StaffUser, "id">>): Promise<StaffUser | undefined>;
  verify(email: string, password: string): Promise<StaffUser | null>;
  setPassword(id: string, password: string): Promise<StaffUser | undefined>;
  issueToken(staffId: string, ttlSeconds: number): Promise<string>;
  consumeToken(token: string): Promise<StaffToken | null>;
}

interface State {
  staff: Map<string, StaffUser>;
  byEmail: Map<string, string>;
  tokens: Map<string, StaffToken>;
  seeded: boolean;
}

const COLOURS = [
  "from-indigo-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

const globalForStaff = globalThis as unknown as { __samruxStaff?: State };

function state(): State {
  if (!globalForStaff.__samruxStaff) {
    globalForStaff.__samruxStaff = {
      staff: new Map(),
      byEmail: new Map(),
      tokens: new Map(),
      seeded: false,
    };
  }
  return globalForStaff.__samruxStaff;
}

function normalise(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Demo staff, one per role, created on first access.
 *
 * The password comes from `ADMIN_SEED_PASSWORD` when set; otherwise a fixed
 * development default so the panel is reachable out of the box. Production
 * must set the variable — and should delete this function once real staff
 * provisioning exists.
 */
const SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "Samrux-Admin!2026";

const SEED: { email: string; name: string; role: AdminRole }[] = [
  { email: "owner@samrux.com", name: "Nadia Owner", role: "super-admin" },
  { email: "admin@samrux.com", name: "Felix Admin", role: "admin" },
  { email: "manager@samrux.com", name: "Priya Manager", role: "manager" },
  { email: "staff@samrux.com", name: "Tomas Staff", role: "staff" },
  { email: "support@samrux.com", name: "Ines Support", role: "support" },
];

async function ensureSeeded() {
  const store = state();
  if (store.seeded) return;
  store.seeded = true;

  for (const [index, entry] of SEED.entries()) {
    const id = randomUUID();
    const user: StaffUser = {
      id,
      email: entry.email,
      name: entry.name,
      role: entry.role,
      passwordHash: await hashPassword(SEED_PASSWORD),
      active: true,
      createdAt: new Date().toISOString(),
      avatarColor: COLOURS[index % COLOURS.length],
      sessionVersion: 1,
    };
    store.staff.set(id, user);
    store.byEmail.set(user.email, id);
  }
}

export const memoryStaffStore: StaffStore = {
  async list() {
    await ensureSeeded();
    return [...state().staff.values()].sort((a, b) => a.name.localeCompare(b.name));
  },

  async findByEmail(email) {
    await ensureSeeded();
    const id = state().byEmail.get(normalise(email));
    return id ? state().staff.get(id) : undefined;
  },

  async findById(id) {
    await ensureSeeded();
    return state().staff.get(id);
  },

  async create({ email, name, role, password }) {
    await ensureSeeded();
    const id = randomUUID();
    const user: StaffUser = {
      id,
      email: normalise(email),
      name: name.trim(),
      role,
      passwordHash: await hashPassword(password),
      active: true,
      createdAt: new Date().toISOString(),
      avatarColor: COLOURS[state().staff.size % COLOURS.length],
      sessionVersion: 1,
    };
    state().staff.set(id, user);
    state().byEmail.set(user.email, id);
    return user;
  },

  async update(id, patch) {
    await ensureSeeded();
    const existing = state().staff.get(id);
    if (!existing) return undefined;

    const next: StaffUser = { ...existing, ...patch, id: existing.id };
    if (patch.email && normalise(patch.email) !== existing.email) {
      next.email = normalise(patch.email);
      state().byEmail.delete(existing.email);
      state().byEmail.set(next.email, id);
    }
    state().staff.set(id, next);
    return next;
  },

  async verify(email, password) {
    const user = await memoryStaffStore.findByEmail(email);
    if (!user) {
      // Constant-ish work on a miss, so timing does not reveal valid emails.
      await verifyPassword(password, "scrypt$00$00");
      return null;
    }
    if (!user.active) return null;
    return (await verifyPassword(password, user.passwordHash)) ? user : null;
  },

  async setPassword(id, password) {
    const existing = await memoryStaffStore.findById(id);
    if (!existing) return undefined;
    return memoryStaffStore.update(id, {
      passwordHash: await hashPassword(password),
      sessionVersion: existing.sessionVersion + 1,
    });
  },

  async issueToken(staffId, ttlSeconds) {
    const token = randomUUID().replace(/-/g, "");
    state().tokens.set(token, {
      token,
      staffId,
      kind: "reset-password",
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return token;
  },

  async consumeToken(token) {
    const record = state().tokens.get(token);
    if (!record) return null;
    state().tokens.delete(token);
    return record.expiresAt < Date.now() ? null : record;
  },
};

export const staffStore = memoryStaffStore;
export const SEED_STAFF_PASSWORD = SEED_PASSWORD;
