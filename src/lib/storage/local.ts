import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StorageDriver, StoredObject } from "@/lib/storage/types";

/**
 * Local filesystem driver — the development default.
 *
 * Files land under `public/uploads/…` so Next serves them without any extra
 * configuration. Development only: `isConfigured()` reports false in
 * production, because a serverless filesystem is read-only outside `/tmp` and
 * ephemeral even there. `storageDriver()` turns that into a configuration
 * error naming the variable to set, rather than an `EROFS` from deep inside an
 * upload.
 */

const ROOT = path.join(process.cwd(), "public", "uploads");

function safeJoin(key: string) {
  const resolved = path.normalize(path.join(ROOT, key));
  // A key like ../../etc must never escape the uploads root.
  if (!resolved.startsWith(ROOT)) throw new Error(`unsafe storage key: ${key}`);
  return resolved;
}

export const localDriver: StorageDriver = {
  id: "local",

  isConfigured() {
    return process.env.NODE_ENV !== "production";
  },

  missingConfig() {
    return this.isConfigured() ? [] : ["STORAGE_PROVIDER"];
  },

  publicUrl(key) {
    return `/uploads/${key}`;
  },

  async put(key, body): Promise<StoredObject> {
    const file = safeJoin(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return { key, url: this.publicUrl(key) };
  },

  async remove(key) {
    await unlink(safeJoin(key)).catch(() => undefined);
  },
};
