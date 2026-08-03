import "server-only";

/**
 * Object storage contract.
 *
 * One interface for AWS S3, Cloudflare R2 (S3-compatible), Cloudinary and the
 * local filesystem. `STORAGE_PROVIDER` picks the driver; the upload route and
 * every feature above it only ever see this shape.
 */

export interface StoredObject {
  /** The key the object was stored under. */
  key: string;
  /** Publicly reachable URL (CDN URL when one is configured). */
  url: string;
}

export interface StorageDriver {
  id: string;
  /** Whether the environment supplies what this driver needs. */
  isConfigured(): boolean;
  /** Env vars this driver needs but does not have. Drives the 503 message. */
  missingConfig(): string[];
  put(key: string, body: Buffer, contentType: string): Promise<StoredObject>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}
