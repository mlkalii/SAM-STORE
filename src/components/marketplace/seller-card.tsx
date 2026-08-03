import Link from "next/link";
import { BadgeCheck, MapPin, Package, Star, Users } from "lucide-react";

import { categories } from "@/data/categories";
import type { PublicSeller } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

/**
 * Seller card for the directory and for cross-sell rails.
 *
 * A server component: it renders no interactivity, so it costs the client
 * bundle nothing.
 */
export function SellerCard({
  seller,
  className,
}: {
  seller: PublicSeller & { productCount?: number };
  className?: string;
}) {
  const departments = seller.departments
    .map((slug) => categories.find((category) => category.slug === slug)?.name)
    .filter(Boolean)
    .slice(0, 3);

  const initials = seller.storeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      href={`/sellers/${seller.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-luxe",
        className,
      )}
    >
      <div className={cn("relative h-24 bg-linear-to-br", seller.gradient)}>
        {seller.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-supplied banner, already sized
          <img
            src={seller.bannerUrl}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="-mt-10 mb-3 flex items-end gap-3">
          <span
            aria-hidden
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-xl border-4 border-card bg-linear-to-br text-sm font-semibold text-white",
              seller.gradient,
            )}
          >
            {seller.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- seller-supplied logo, already sized
              <img src={seller.logoUrl} alt="" className="size-full rounded-lg object-cover" loading="lazy" />
            ) : (
              initials
            )}
          </span>
        </div>

        <h3 className="flex items-center gap-1.5 text-base font-medium">
          <span className="min-w-0 truncate">{seller.storeName}</span>
          {seller.verified ? (
            <BadgeCheck
              className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-label="Verified seller"
            />
          ) : null}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground text-pretty">
          {seller.storeDescription}
        </p>

        {departments.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {departments.map((department) => (
              <li
                key={department}
                className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {department}
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-4 text-xs text-muted-foreground">
          {seller.rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-gold text-gold" aria-hidden />
              <dt className="sr-only">Rating</dt>
              <dd>
                {seller.rating.toFixed(1)}
                <span className="text-muted-foreground/70">
                  {" "}
                  ({seller.reviewCount.toLocaleString("en-US")})
                </span>
              </dd>
            </div>
          ) : (
            <span>New store</span>
          )}

          {seller.productCount !== undefined ? (
            <div className="flex items-center gap-1">
              <Package className="size-3" aria-hidden />
              <dt className="sr-only">Products</dt>
              <dd>{seller.productCount.toLocaleString("en-US")}</dd>
            </div>
          ) : null}

          <div className="flex items-center gap-1">
            <Users className="size-3" aria-hidden />
            <dt className="sr-only">Followers</dt>
            <dd>{seller.followerCount.toLocaleString("en-US")}</dd>
          </div>

          <div className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            <dt className="sr-only">Location</dt>
            <dd>
              {seller.city}, {seller.state}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
