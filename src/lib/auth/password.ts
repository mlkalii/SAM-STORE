import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/**
 * Password hashing (server only — `node:crypto`).
 *
 * The strength meter lives in `password-strength.ts` so the client can import
 * it without pulling Node's crypto module into the browser bundle.
 *
 * Password hashing.
 *
 * scrypt from Node's standard library — memory-hard, no native dependency, and
 * the parameters are recorded in the stored string so they can be raised later
 * without invalidating existing hashes.
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  const expected = Buffer.from(hashHex, "hex");

  // Length check first: timingSafeEqual throws on a mismatch.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
