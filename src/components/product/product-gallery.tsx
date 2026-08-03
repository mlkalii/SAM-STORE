"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Play,
  X,
  ZoomIn,
} from "lucide-react";
import * as React from "react";

import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Product gallery.
 *
 * - Large lead image with cursor-tracking zoom on pointer devices
 * - Thumbnail slider (horizontal on mobile, vertical from `lg`)
 * - Full-screen viewer with keyboard navigation
 * - Video slot, rendered when the product has one
 */
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = React.useState(0);
  const [zooming, setZooming] = React.useState(false);
  const [origin, setOrigin] = React.useState("50% 50%");
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const reduced = usePrefersReducedMotion();

  const images = product.images;
  const image = images[active];
  const count = images.length;

  const step = React.useCallback(
    (delta: number) => setActive((current) => (current + delta + count) % count),
    [count],
  );

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  // A listing whose media has not been uploaded yet still has to render. The
  // department gradient is the same placeholder a photograph fades in over,
  // so an image-less product looks deliberate rather than broken.
  if (!image) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-2xl bg-linear-to-br",
          product.gradient,
        )}
        role="img"
        aria-label={`${product.name} — no photography available yet`}
      >
        <span className="px-8 text-center font-display text-2xl text-white/90 text-balance">
          {product.name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {/* Thumbnails */}
      <div
        className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:max-h-[34rem] lg:flex-col lg:overflow-y-auto lg:px-0"
        role="tablist"
        aria-label={`${product.name} images`}
      >
        {images.map((thumb, index) => (
          <button
            key={thumb.id}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-label={thumb.alt}
            onClick={() => setActive(index)}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-xl ring-2 transition",
              "focus-visible:outline-none focus-visible:ring-ring",
              active === index
                ? "ring-foreground"
                : "opacity-65 ring-transparent hover:opacity-100",
            )}
          >
            <ProductImage
              src={thumb.thumbnail}
              alt={thumb.alt}
              gradient={thumb.gradient}
              category={product.category}
              sizes="88px"
              className="size-18 sm:size-20"
            />
          </button>
        ))}

        {product.hasVideo ? (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="relative flex size-18 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed text-muted-foreground transition-colors hover:bg-muted sm:size-20"
            aria-label={`${product.name} — product video`}
          >
            <Play className="size-4" aria-hidden />
            <span className="text-[10px] uppercase tracking-wider">Video</span>
          </button>
        ) : null}
      </div>

      {/* Main image */}
      <div className="relative flex-1">
        <div
          className="group relative overflow-hidden rounded-3xl bg-muted"
          // The zoom focal point follows the cursor, so it has to be inline.
          style={{ "--zoom-origin": origin } as React.CSSProperties}
          onPointerMove={onPointerMove}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse" && !reduced) setZooming(true);
          }}
          onPointerLeave={() => setZooming(false)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductImage
                src={image.src}
                alt={image.alt}
                gradient={image.gradient}
                category={product.category}
                brand={product.brand}
                tone={image.view === "main" ? "studio" : "gradient"}
                priority={active === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="aspect-square w-full"
                imageClassName={cn(
                  "transition-transform duration-300 ease-out [transform-origin:var(--zoom-origin)]",
                  zooming ? "scale-[2]" : "scale-100",
                )}
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute bottom-3 left-3 hidden items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur lg:flex">
            <ZoomIn className="size-3.5" aria-hidden />
            Hover to zoom
          </div>

          <Button
            variant="secondary"
            size="icon-sm"
            className="absolute right-3 top-3 rounded-full shadow-sm"
            aria-label="Open full-screen viewer"
            onClick={() => setViewerOpen(true)}
          >
            <Expand className="size-4" aria-hidden />
          </Button>

          {count > 1 ? (
            <>
              <Button
                variant="secondary"
                size="icon-sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Previous image"
                onClick={() => step(-1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Next image"
                onClick={() => step(1)}
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </>
          ) : null}
        </div>

        <p className="mt-2 text-right text-[11px] text-muted-foreground">
          {active + 1} / {count} · {image.credit}
        </p>
      </div>

      <FullscreenViewer
        product={product}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        active={active}
        onActiveChange={setActive}
      />
    </div>
  );
}

function FullscreenViewer({
  product,
  open,
  onOpenChange,
  active,
  onActiveChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: number;
  onActiveChange: (index: number) => void;
}) {
  const images = product.images;
  const count = images.length;
  const image = images[active];

  // Arrow keys page through the gallery while the viewer is open.
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") onActiveChange((active + 1) % count);
      if (event.key === "ArrowLeft") onActiveChange((active - 1 + count) % count);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, active, count, onActiveChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-background/98 p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">
          {product.name} — image {active + 1} of {count}
        </DialogTitle>

        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {active + 1} of {count} · {image.credit}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close viewer"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" aria-hidden />
            </Button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
            <ProductImage
              src={image.src}
              alt={image.alt}
              gradient={image.gradient}
              category={product.category}
              sizes="100vw"
              className="h-full w-full rounded-2xl"
              imageClassName="object-contain"
            />

            {count > 1 ? (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow"
                  aria-label="Previous image"
                  onClick={() => onActiveChange((active - 1 + count) % count)}
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow"
                  aria-label="Next image"
                  onClick={() => onActiveChange((active + 1) % count)}
                >
                  <ChevronRight className="size-5" aria-hidden />
                </Button>
              </>
            ) : null}
          </div>

          {product.hasVideo ? (
            <div className="border-t px-4 py-3">
              <div className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                <Play className="size-4 shrink-0" aria-hidden />
                <span>
                  Product video slot — drop an MP4 or an embed URL on the product record and it
                  renders here.
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 overflow-x-auto border-t p-3">
            {images.map((thumb, index) => (
              <button
                key={thumb.id}
                type="button"
                onClick={() => onActiveChange(index)}
                aria-label={thumb.alt}
                aria-current={index === active}
                className={cn(
                  "shrink-0 overflow-hidden rounded-lg ring-2 transition",
                  index === active ? "ring-foreground" : "opacity-60 ring-transparent hover:opacity-100",
                )}
              >
                <ProductImage
                  src={thumb.thumbnail}
                  alt={thumb.alt}
                  gradient={thumb.gradient}
                  category={product.category}
                  sizes="72px"
                  className="size-16"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
