"use client";

import { Heart, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/hooks/use-product-lists";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation.
 *
 * Thumb-reachable, five slots, and it mirrors the header rather than inventing
 * a second information architecture. Hidden from `md` up, where the full header
 * is already visible. Sits above the iOS home indicator via safe-area padding.
 */
const items = [
  { href: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/categories",
    label: "Browse",
    icon: LayoutGrid,
    match: (path: string) => path.startsWith("/categories"),
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    match: (path: string) => path.startsWith("/search"),
  },
  {
    href: "/wishlist",
    label: "Saved",
    icon: Heart,
    match: (path: string) => path.startsWith("/wishlist"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const { count: savedCount } = useWishlist();

  return (
    <nav
      aria-label="Primary"
      className="dark glass-strong fixed inset-x-0 bottom-0 z-50 border-t text-foreground md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul
        className="grid w-full items-stretch"
        // Inline template: five equal, shrinkable tracks. `minmax(0, 1fr)` is
        // what stops a long label from widening its own tab and pushing the
        // last one off the edge of a narrow screen.
        style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
      >
        {items.map((item) => {
          const active = item.match(pathname);
          const badge = item.href === "/wishlist" ? savedCount : 0;

          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] tracking-wide transition-colors",
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <item.icon className="size-5" aria-hidden />
                  {badge > 0 ? (
                    <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-gold font-mono text-[9px] text-gold-foreground tabular-nums">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}

        <li className="min-w-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Open cart, ${count} items`}
            className="relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="relative">
              <ShoppingBag className="size-5" aria-hidden />
              {count > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-gold font-mono text-[9px] text-gold-foreground tabular-nums">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </span>
            Cart
          </button>
        </li>
      </ul>
    </nav>
  );
}
