import "server-only";

import { randomUUID } from "node:crypto";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * User store.
 *
 * An in-memory implementation behind an interface, exactly like the product
 * source: swap `memoryStore` for a database-backed object and nothing above
 * this file changes. State lives on `globalThis` so it survives Fast Refresh in
 * development.
 *
 * IT IS NOT PERSISTENT. Accounts disappear when the server restarts. That is a
 * deliberate placeholder, not an oversight — wire `UserStore` to a real
 * database before taking payments.
 */

export interface Address {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface OrderLine {
  slug: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  image: string;
  gradient: string;
  category: string;
}

export interface Order {
  id: string;
  reference: string;
  placedAt: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  addressId?: string;
  trackingNumber?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: "order" | "price" | "account" | "stock";
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerified: boolean;
  /** Bumped on password change so existing sessions stop validating. */
  sessionVersion: number;
  createdAt: string;
  avatarColor: string;
  phone?: string;
  marketingOptIn: boolean;
  addresses: Address[];
  orders: Order[];
  notifications: Notification[];
  /** Provider ids this account can also sign in with. */
  linkedProviders: string[];
}

/** Single-use token for email verification / password reset. */
export interface AuthToken {
  token: string;
  userId: string;
  kind: "verify-email" | "reset-password";
  expiresAt: number;
}

export interface UserStore {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  create(input: { email: string; name: string; password: string }): Promise<User>;
  update(id: string, patch: Partial<Omit<User, "id">>): Promise<User | undefined>;
  verifyCredentials(email: string, password: string): Promise<User | null>;
  setPassword(id: string, password: string): Promise<User | undefined>;
  issueToken(userId: string, kind: AuthToken["kind"], ttlSeconds: number): Promise<string>;
  consumeToken(token: string, kind: AuthToken["kind"]): Promise<AuthToken | null>;
}

interface StoreState {
  users: Map<string, User>;
  emailIndex: Map<string, string>;
  tokens: Map<string, AuthToken>;
}

const AVATAR_COLOURS = [
  "from-amber-500 to-orange-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-fuchsia-600",
  "from-violet-500 to-purple-600",
];

const globalForStore = globalThis as unknown as { __samruxUsers?: StoreState };

function state(): StoreState {
  if (!globalForStore.__samruxUsers) {
    globalForStore.__samruxUsers = {
      users: new Map(),
      emailIndex: new Map(),
      tokens: new Map(),
    };
  }
  return globalForStore.__samruxUsers;
}

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export const memoryStore: UserStore = {
  async findByEmail(email) {
    const id = state().emailIndex.get(normaliseEmail(email));
    return id ? state().users.get(id) : undefined;
  },

  async findById(id) {
    return state().users.get(id);
  },

  async create({ email, name, password }) {
    const id = randomUUID();
    const user: User = {
      id,
      email: normaliseEmail(email),
      name: name.trim(),
      passwordHash: await hashPassword(password),
      emailVerified: false,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      avatarColor: AVATAR_COLOURS[state().users.size % AVATAR_COLOURS.length],
      marketingOptIn: false,
      addresses: [],
      orders: [],
      notifications: [
        {
          id: randomUUID(),
          title: "Welcome to SAMRUX",
          body: "Verify your email address to secure your account and enable order updates.",
          createdAt: new Date().toISOString(),
          read: false,
          kind: "account",
        },
      ],
      linkedProviders: [],
    };

    state().users.set(id, user);
    state().emailIndex.set(user.email, id);
    return user;
  },

  async update(id, patch) {
    const user = state().users.get(id);
    if (!user) return undefined;

    const next: User = { ...user, ...patch, id: user.id };

    if (patch.email && normaliseEmail(patch.email) !== user.email) {
      next.email = normaliseEmail(patch.email);
      state().emailIndex.delete(user.email);
      state().emailIndex.set(next.email, id);
    }

    state().users.set(id, next);
    return next;
  },

  async verifyCredentials(email, password) {
    const user = await memoryStore.findByEmail(email);
    // Hash anyway on a miss so a wrong email and a wrong password take a
    // similar amount of time.
    if (!user) {
      await verifyPassword(password, "scrypt$00$00");
      return null;
    }
    return (await verifyPassword(password, user.passwordHash)) ? user : null;
  },

  async setPassword(id, password) {
    const user = state().users.get(id);
    if (!user) return undefined;

    return memoryStore.update(id, {
      passwordHash: await hashPassword(password),
      // Invalidate every existing session for this account.
      sessionVersion: user.sessionVersion + 1,
    });
  },

  async issueToken(userId, kind, ttlSeconds) {
    const token = randomUUID().replace(/-/g, "");
    state().tokens.set(token, {
      token,
      userId,
      kind,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return token;
  },

  async consumeToken(token, kind) {
    const record = state().tokens.get(token);
    if (!record || record.kind !== kind) return null;

    state().tokens.delete(token);
    if (record.expiresAt < Date.now()) return null;
    return record;
  },
};

/**
 * The active backend. Memory is the default; set `DATA_BACKEND=prisma` (plus
 * DATABASE_URL, `npm run db:migrate`, `npm run db:seed`) to run against
 * PostgreSQL through the adapter in `src/lib/db/adapters/user-store.ts`.
 *
 * The import is deliberately synchronous-but-guarded rather than dynamic:
 * both implementations satisfy `UserStore`, and tree-shaking keeps the unused
 * one out of nothing — this is server code, size is not the concern; a wrong
 * import cycle is. The adapter only constructs a client on first query.
 */
import { DATA_BACKEND } from "@/config/backend";
import { prismaUserStore } from "@/lib/db/adapters/user-store";

export const userStore: UserStore = DATA_BACKEND === "prisma" ? prismaUserStore : memoryStore;
