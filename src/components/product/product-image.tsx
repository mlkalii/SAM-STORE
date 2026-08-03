"use client";

import Image from "next/image";
import * as React from "react";

import { CategoryIcon } from "@/components/common/category-icon";
import { categoryBySlug } from "@/data/categories";
import { cn } from "@/lib/utils";

/**
 * Product photography with a graceful floor.
 *
 * The department gradient paints immediately and sits behind every photo, so
 * the card has its final shape before the image arrives and still looks
 * deliberate if the image never does (offline, blocked host, dead URL).
 *
 * `next/image` handles responsive sizing, AVIF/WebP negotiation and lazy
 * loading; only above-the-fold images pass `priority`.
 */
export function ProductImage({
  src,
  alt,
  gradient,
  category,
  brand,
  className,
  imageClassName,
  sizes = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  fill = true,
  width,
  height,
  tone = "gradient",
}: {
  src: string;
  alt: string;
  gradient: string;
  category?: string;
  brand?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  /**
   * "studio" for the white-square catalogue mains: paints a white backdrop so
   * the photo arrives onto the canvas it was framed for, with no gradient
   * flash. "gradient" stays for lifestyle gallery shots and the fallback.
   */
  tone?: "gradient" | "studio";
}) {
  const [failed, setFailed] = React.useState(false);
  const iconName = (category ? categoryBySlug.get(category)?.icon : undefined) ?? "Package";

  // The fallback art still uses the gradient — a white void with a white icon
  // would be invisible — so studio tone only switches the *loading* backdrop.
  const studio = tone === "studio" && !failed && Boolean(src);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        studio ? "bg-white" : "bg-muted",
        className,
      )}
    >
      {/* Painted backdrop: the loading state and the fallback in one layer. */}
      {studio ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_45%,rgba(0,0,0,0.03),transparent_70%)]"
        />
      ) : (
        <>
          <div
            aria-hidden
            className={cn("absolute inset-0 -z-10 bg-linear-to-br", gradient)}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_20%_10%,rgba(255,255,255,0.4),transparent_62%)]"
          />
        </>
      )}

      {failed || !src ? (
        <>
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 flex size-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white/50"
          >
            <CategoryIcon name={iconName} className="size-full" strokeWidth={1.25} />
          </span>
          {brand ? (
            <span className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 select-none">
              {brand}
            </span>
          ) : null}
          <span className="sr-only">{alt}</span>
        </>
      ) : (
        <Image
          src={src}
          alt={alt}
          {...(fill ? { fill: true } : { width: width ?? 800, height: height ?? 800 })}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          onError={() => setFailed(true)}
          className={cn("object-cover", fill ? "" : "h-auto w-full", imageClassName)}
        />
      )}
    </div>
  );
}
