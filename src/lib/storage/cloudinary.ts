import "server-only";

import { createHash } from "node:crypto";

import type { StorageDriver, StoredObject } from "@/lib/storage/types";

/**
 * Cloudinary driver — signed uploads via the REST API, no SDK.
 *
 * Environment:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Delivery URLs go through Cloudinary's CDN with `f_auto,q_auto`, so format
 * negotiation and compression are the CDN's job — the app stores originals.
 */

function env(key: string) {
  return process.env[key] ?? "";
}

/** Cloudinary signatures: sha1 of the sorted params + api secret. */
function sign(params: Record<string, string>) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(sorted + env("CLOUDINARY_API_SECRET")).digest("hex");
}

export const cloudinaryDriver: StorageDriver = {
  id: "cloudinary",

  isConfigured() {
    return ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every((key) =>
      Boolean(process.env[key]),
    );
  },

  missingConfig() {
    return ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter(
      (key) => !process.env[key],
    );
  },

  publicUrl(key) {
    // f_auto,q_auto: the CDN serves AVIF/WebP at tuned quality per request.
    return `https://res.cloudinary.com/${env("CLOUDINARY_CLOUD_NAME")}/image/upload/f_auto,q_auto/${key}`;
  },

  async put(key, body, contentType): Promise<StoredObject> {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { public_id: key, timestamp };

    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(body)], { type: contentType }));
    form.set("public_id", key);
    form.set("timestamp", timestamp);
    form.set("api_key", env("CLOUDINARY_API_KEY"));
    form.set("signature", sign(params));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env("CLOUDINARY_CLOUD_NAME")}/image/upload`,
      { method: "POST", body: form },
    );
    if (!response.ok) {
      throw new Error(`cloudinary upload responded ${response.status}: ${await response.text()}`);
    }

    return { key, url: this.publicUrl(key) };
  },

  async remove(key) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { public_id: key, timestamp };

    const form = new FormData();
    form.set("public_id", key);
    form.set("timestamp", timestamp);
    form.set("api_key", env("CLOUDINARY_API_KEY"));
    form.set("signature", sign(params));

    await fetch(
      `https://api.cloudinary.com/v1_1/${env("CLOUDINARY_CLOUD_NAME")}/image/destroy`,
      { method: "POST", body: form },
    );
  },
};
