import "server-only";

import sharp from "sharp";

import { cloudinaryDriver } from "@/lib/storage/cloudinary";
import { localDriver } from "@/lib/storage/local";
import { s3Driver } from "@/lib/storage/s3";
import type { StorageDriver, StoredObject } from "@/lib/storage/types";

export type { StorageDriver, StoredObject } from "@/lib/storage/types";

/**
 * Media pipeline.
 *
 * `STORAGE_PROVIDER` (s3 | r2 | cloudinary | local) picks the driver — R2 is
 * the s3 driver with `S3_ENDPOINT` set. `storeImage` is the one entry point:
 * it validates, optimises, generates the thumbnail and stores both renditions,
 * so every upload in the marketplace has the same shape as the catalogue's
 * own imagery (1600px main, 400px thumbnail).
 */

export class StorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

function selectDriver(): StorageDriver {
  switch (process.env.STORAGE_PROVIDER) {
    case "s3":
    case "r2":
      return s3Driver;
    case "cloudinary":
      return cloudinaryDriver;
    default:
      return localDriver;
  }
}

/**
 * The configured driver, or a descriptive error.
 *
 * Every driver is credential-checked, not just the local one. Naming
 * `STORAGE_PROVIDER=s3` while forgetting `S3_BUCKET` used to sail through here
 * and fail deep inside a signed request, which the uploads route reported as
 * 422 "that image could not be processed" — sending the seller off to
 * re-export a photo that was never the problem. Now it is a 503 naming the
 * variables that are missing.
 */
export function storageDriver(): StorageDriver {
  const driver = selectDriver();
  if (driver.isConfigured()) return driver;

  const missing = driver.missingConfig();
  if (driver.id === "local") {
    throw new StorageNotConfiguredError(
      "No durable STORAGE_PROVIDER is set. Production uploads need s3, r2 or cloudinary — " +
        "the local driver writes to a filesystem that is read-only on serverless hosts.",
    );
  }

  throw new StorageNotConfiguredError(
    `STORAGE_PROVIDER=${driver.id} is selected but ${missing.join(", ")} ${
      missing.length === 1 ? "is" : "are"
    } not set.`,
  );
}

export interface StoredImage {
  main: StoredObject;
  thumbnail: StoredObject;
  width: number;
  height: number;
}

const MAIN_SIZE = 1600;
const THUMB_SIZE = 400;

/**
 * Optimise and store one image.
 *
 * Originals are re-encoded to WebP q82 (visually lossless for product
 * photography, roughly a third of JPEG weight), capped at 1600px on the long
 * edge — the largest slot any layout uses. Cloudinary re-negotiates format at
 * its CDN anyway; for S3/R2/local the stored rendition is the served one.
 */
export async function storeImage(
  keyPrefix: string,
  input: Buffer,
): Promise<StoredImage> {
  const driver = storageDriver();

  const base = sharp(input, { failOn: "error" }).rotate();
  const meta = await base.metadata();
  if (!meta.width || !meta.height) throw new Error("not a decodable image");

  const main = await base
    .clone()
    .resize({ width: MAIN_SIZE, height: MAIN_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbnail = await base
    .clone()
    .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  const [storedMain, storedThumb] = await Promise.all([
    driver.put(`${keyPrefix}.webp`, main, "image/webp"),
    driver.put(`${keyPrefix}.thumb.webp`, thumbnail, "image/webp"),
  ]);

  return {
    main: storedMain,
    thumbnail: storedThumb,
    width: Math.min(meta.width, MAIN_SIZE),
    height: Math.min(meta.height, MAIN_SIZE),
  };
}
