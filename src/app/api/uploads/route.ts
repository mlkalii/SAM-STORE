import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/auth";
import { getSellerContext } from "@/lib/marketplace/auth";
import { logger } from "@/lib/observability/logger";
import { StorageNotConfiguredError, storeImage } from "@/lib/storage";

/**
 * Media upload endpoint.
 *
 * Accepts one image from an approved seller or a signed-in staff member —
 * nobody else. The file is validated by magic bytes (not by its filename),
 * capped at 4 MB, optimised to WebP, thumbnailed, and stored through whichever
 * driver `STORAGE_PROVIDER` selects.
 */

// 4 MB, not 8: Vercel rejects request bodies over ~4.5 MB at the platform
// layer, so a larger cap here would promise something the host refuses — the
// client would get an opaque platform error page instead of this route's JSON.
const MAX_BYTES = 4 * 1024 * 1024;

const MAGIC: [number[], string][] = [
  [[0xff, 0xd8, 0xff], "jpeg"],
  [[0x89, 0x50, 0x4e, 0x47], "png"],
  [[0x52, 0x49, 0x46, 0x46], "webp"], // RIFF….WEBP
  [[0x47, 0x49, 0x46, 0x38], "gif"],
];

function sniff(buffer: Buffer): string | null {
  for (const [magic, kind] of MAGIC) {
    if (magic.every((byte, index) => buffer[index] === byte)) return kind;
  }
  return null;
}

export async function POST(request: Request) {
  // Seller or staff — checked server-side, never from the form.
  const [{ seller }, staff] = await Promise.all([getSellerContext(), getAdminUser()]);
  const actor = seller?.status === "approved" ? `seller:${seller.id}` : staff ? `staff:${staff.id}` : null;
  if (!actor) {
    return NextResponse.json({ error: "Sign in as a seller or staff member." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a file field named 'file'." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Images are capped at 4 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniff(buffer)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP or GIF images are accepted." },
      { status: 415 },
    );
  }

  try {
    const scope = seller ? `sellers/${seller.id}` : "admin";
    const stored = await storeImage(`${scope}/${randomUUID().slice(0, 12)}`, buffer);

    logger.info("upload.stored", { actor, key: stored.main.key, bytes: file.size });
    return NextResponse.json({
      url: stored.main.url,
      thumbnail: stored.thumbnail.url,
      width: stored.width,
      height: stored.height,
    });
  } catch (error) {
    // A missing STORAGE_PROVIDER is a deployment problem, not a bad file —
    // 422 would send the seller off re-exporting a perfectly good photo.
    if (error instanceof StorageNotConfiguredError) {
      logger.error("upload.storage_unconfigured", { actor });
      return NextResponse.json(
        { error: "Uploads are not available yet. Media storage is not configured." },
        { status: 503 },
      );
    }
    logger.error("upload.failed", { actor, error: String(error) });
    return NextResponse.json({ error: "That image could not be processed." }, { status: 422 });
  }
}
