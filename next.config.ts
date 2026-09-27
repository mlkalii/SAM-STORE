import type { NextConfig } from "next";

/**
 * The host uploaded media is served from, derived from whatever storage is
 * configured. Both the image optimiser's allowlist and the CSP need it: an
 * S3/R2/CloudFront bucket that is missing from either one shows up as a broken
 * seller logo in production and nowhere in development, where uploads are
 * local-filesystem and same-origin.
 */
function storageHost(): string | null {
  const candidate =
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.S3_ENDPOINT ||
    (process.env.CLOUDINARY_CLOUD_NAME ? "https://res.cloudinary.com" : "");
  if (!candidate) return null;

  try {
    return new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`).hostname;
  } catch {
    return null;
  }
}

const MEDIA_HOST = storageHost();

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Standalone output for the Docker image: `node .next/standalone/server.js`
  // with only production dependencies traced in.
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,

  images: {
    // Product photography is self-hosted under /public/products. Add your own
    // CDN here when you swap `PRODUCT_DATA_SOURCE` for a real feed.
    //
    // Unsplash stays allowed for carts saved before the catalogue moved to
    // self-hosted photos: each cart line keeps its own image URL in
    // `localStorage`, and an unlisted host there is a runtime error.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      ...(MEDIA_HOST ? [{ protocol: "https" as const, hostname: MEDIA_HOST }] : []),
    ],
    formats: ["image/avif", "image/webp"],
    // Product cards are square and never render above ~800px, so the largest
    // device sizes only exist for the PDP hero.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [48, 72, 96, 128, 192, 256, 384],
    // Optimised derivatives are immutable; cache them hard.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  experimental: {
    // Ship only the icons and helpers that are actually imported.
    optimizePackageImports: ["lucide-react", "motion", "@base-ui/react"],
  },

  async redirects() {
    // `/collections` became `/categories` when the store went multi-category.
    // SAMRUX is a single store: the retired seller routes go home, and the
    // retired listing pages go to the shop.
    return [
      { source: "/sellers", destination: "/", permanent: true },
      { source: "/sellers/:path*", destination: "/", permanent: true },
      { source: "/sell", destination: "/", permanent: true },
      { source: "/sell/:path*", destination: "/", permanent: true },
      { source: "/seller", destination: "/", permanent: true },
      { source: "/seller/:path*", destination: "/", permanent: true },
      { source: "/best-sellers", destination: "/shop", permanent: true },
      // Products renamed to match their photographs keep their old links.
      { source: "/shop/aeterna-flux-power-bank-20k", destination: "/shop/aeterna-flux-power-bank", permanent: true },
      { source: "/shop/ridgeline-competition-kettlebell", destination: "/shop/ridgeline-vinyl-kettlebell-8-kg", permanent: true },
      { source: "/shop/fetchwell-orthopedic-dog-bed", destination: "/shop/fetchwell-bolster-dog-bed", permanent: true },
      { source: "/shop/trailpaw-travel-pet-carrier", destination: "/shop/trailpaw-hard-sided-pet-carrier", permanent: true },
      { source: "/shop/lullaby-co-lumen-nursery-nightlight", destination: "/shop/lullaby-co-star-projector-nightlight", permanent: true },
      { source: "/shop/axlewerks-cordless-tyre-inflator", destination: "/shop/axlewerks-12v-tyre-inflator", permanent: true },
      { source: "/shop/torqline-wash-sponge-set", destination: "/shop/torqline-car-wash-sponge", permanent: true },
      { source: "/shop/brenna-vulcanised-court-sneaker", destination: "/shop/brenna-white-court-sneaker", permanent: true },
      { source: "/shop/hearthline-slow-cooked-fig-preserve", destination: "/shop/hearthline-plum-preserve", permanent: true },
      { source: "/shop/nestly-wooden-train-set", destination: "/shop/nestly-wooden-toy-train", permanent: true },
      { source: "/shop/loomcraft-kite-delta-wing", destination: "/shop/loomcraft-diamond-kite", permanent: true },
      { source: "/collections", destination: "/categories", permanent: true },
      { source: "/collections/:slug", destination: "/categories/:slug", permanent: true },
    ];
  },

  async headers() {
    // Security headers on every response. CSP is enforced, not report-only:
    // the app inlines two JSON-LD scripts and its own styles, both allowed
    // explicitly.
    //
    // HSTS is deliberately NOT here — this block is evaluated at build time and
    // baked into the routes manifest, so it cannot depend on how the app is
    // actually served. `proxy.ts` sets it per request instead, keyed on the
    // request's own protocol. There is no `upgrade-insecure-requests` either:
    // every source this policy allows is already `self`, `data:`/`blob:` or an
    // https host, so there is nothing left to upgrade.
    const csp = [
      "default-src 'self'",
      // Next injects inline bootstrap scripts; hashes churn per build, so
      // 'unsafe-inline' stays until nonce plumbing is added at the framework
      // level. No remote script hosts are allowed at all.
      "script-src 'self' 'unsafe-inline'" +
        (process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      // Kept in step with images.remotePatterns above — a host allowed by one
      // and blocked by the other is a silently broken image in production.
      [
        "img-src 'self' data: blob:",
        "https://images.unsplash.com",
        "https://res.cloudinary.com",
        ...(MEDIA_HOST ? [`https://${MEDIA_HOST}`] : []),
      ].join(" "),
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
        ],
      },
    ];
  },

  // Note: Next already serves fingerprinted assets under /_next/static with
  // immutable caching — overriding those headers here breaks dev, so we don't.
};

export default nextConfig;
