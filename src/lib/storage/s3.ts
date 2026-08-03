import "server-only";

import { createHash, createHmac } from "node:crypto";

import type { StorageDriver, StoredObject } from "@/lib/storage/types";

/**
 * S3-compatible driver: AWS S3 and Cloudflare R2 through one implementation.
 *
 * AWS SigV4 is implemented directly with node:crypto — ~60 lines — so the
 * driver carries no SDK dependency. R2 is S3-compatible: point
 * `S3_ENDPOINT` at `https://<account>.r2.cloudflarestorage.com` and it works
 * unchanged.
 *
 * Environment:
 *   S3_BUCKET             bucket name
 *   S3_REGION             e.g. us-east-1 ("auto" for R2)
 *   S3_ACCESS_KEY_ID      credentials
 *   S3_SECRET_ACCESS_KEY
 *   S3_ENDPOINT           optional; default AWS. R2/MinIO set this.
 *   S3_PUBLIC_BASE_URL    optional CDN/custom domain for reads.
 */

function env(key: string) {
  return process.env[key] ?? "";
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

interface SignInput {
  method: string;
  host: string;
  path: string;
  headers: Record<string, string>;
  payloadHash: string;
  region: string;
}

/** AWS Signature Version 4 for a single S3 request. */
function signV4({ method, host, path, headers, payloadHash, region }: SignInput) {
  const accessKey = env("S3_ACCESS_KEY_ID");
  const secretKey = env("S3_SECRET_ACCESS_KEY");

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);

  const allHeaders: Record<string, string> = {
    ...headers,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const signedHeaderNames = Object.keys(allHeaders)
    .map((name) => name.toLowerCase())
    .sort();
  const canonicalHeaders = signedHeaderNames
    .map((name) => `${name}:${allHeaders[Object.keys(allHeaders).find((k) => k.toLowerCase() === name)!].trim()}\n`)
    .join("");
  const signedHeaders = signedHeaderNames.join(";");

  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  return {
    ...allHeaders,
    authorization:
      `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

function endpoint() {
  const bucket = env("S3_BUCKET");
  const custom = env("S3_ENDPOINT");
  if (custom) {
    const url = new URL(custom);
    // Path-style addressing for R2/MinIO custom endpoints.
    return { host: url.host, base: `${url.origin}/${bucket}`, pathPrefix: `/${bucket}` };
  }
  const region = env("S3_REGION") || "us-east-1";
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  return { host, base: `https://${host}`, pathPrefix: "" };
}

export const s3Driver: StorageDriver = {
  id: "s3",

  isConfigured() {
    // S3_REGION is deliberately not required: `endpoint()` already defaults to
    // us-east-1, so demanding it here would reject a working bucket.
    return ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].every((key) =>
      Boolean(process.env[key]),
    );
  },

  missingConfig() {
    return ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter(
      (key) => !process.env[key],
    );
  },

  publicUrl(key) {
    const cdn = env("S3_PUBLIC_BASE_URL");
    if (cdn) return `${cdn.replace(/\/$/, "")}/${key}`;
    return `${endpoint().base}/${key}`;
  },

  async put(key, body, contentType): Promise<StoredObject> {
    const { host, base, pathPrefix } = endpoint();
    const path = `${pathPrefix}/${key}`;
    const payloadHash = sha256Hex(body);

    const headers = signV4({
      method: "PUT",
      host,
      path,
      headers: { "content-type": contentType },
      payloadHash,
      region: env("S3_REGION") || "us-east-1",
    });

    const response = await fetch(`${base}/${key}`, {
      method: "PUT",
      headers,
      body: new Uint8Array(body),
    });
    if (!response.ok) {
      throw new Error(`s3 put ${key} responded ${response.status}: ${await response.text()}`);
    }

    return { key, url: this.publicUrl(key) };
  },

  async remove(key) {
    const { host, base, pathPrefix } = endpoint();
    const headers = signV4({
      method: "DELETE",
      host,
      path: `${pathPrefix}/${key}`,
      headers: {},
      payloadHash: sha256Hex(""),
      region: env("S3_REGION") || "us-east-1",
    });

    const response = await fetch(`${base}/${key}`, { method: "DELETE", headers });
    if (!response.ok && response.status !== 404) {
      throw new Error(`s3 delete ${key} responded ${response.status}`);
    }
  },
};
