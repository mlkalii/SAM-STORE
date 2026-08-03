"use client";

import { ExternalLink, Menu, Store, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { LogoMark } from "@/components/brand/logo";
import { SellerIcon } from "@/components/seller/seller-icon";
import { sellerNav, type SellerNavGroup } from "@/components/seller/nav-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Seller dashboard shell.
 *
 * Deliberately distinct from both the storefront and the admin: a seller is
 * running their own shop inside someone else's marketplace, and the chrome
 * should say so. Light surface, store identity in the sidebar header, and a
 * permanent link back to the public storefront.
 */

export interface SellerShellProps {
  store: {
    id: string;
    slug: string;
    storeName: string;
    initials: string;
    gradient: string;
    logoUrl?: string;
    rating: number;
    verified: boolean;
  };
  badges: { orders: number; messages: number; reviews: number };
  nav?: SellerNavGroup[];
  children: React.ReactNode;
}

export function SellerShell({ store, badges, nav = sellerNav, children }: SellerShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Close the drawer whenever the route changes — React's documented way to
  // react to a changed value during render, no effect required.
  const [drawerPath, setDrawerPath] = React.useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  return (
    <div className="min-h-dvh bg-surface text-foreground">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/seller" className="flex items-center gap-2.5" aria-label="Seller dashboard">
            <LogoMark className="size-7" />
            <span className="text-sm font-semibold tracking-[0.18em]">SELLER</span>
          </Link>
        </div>

        <StoreCard store={store} />
        <SellerSidebarNav groups={nav} pathname={pathname} badges={badges} />

        <div className="border-t p-3">
          <Link
            href={`/sellers/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View my storefront
          </Link>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-card">
            <div className="flex h-14 items-center justify-between border-b px-5">
              <span className="text-sm font-semibold tracking-[0.18em]">SELLER</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <StoreCard store={store} />
            <SellerSidebarNav groups={nav} pathname={pathname} badges={badges} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-4" aria-hidden />
          </Button>

          <p className="truncate text-sm font-medium">{store.storeName}</p>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" render={<Link href="/account" />}>
              My account
            </Button>
            <Button size="sm" variant="ghost" render={<Link href="/" />}>
              Storefront
            </Button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function StoreCard({ store }: { store: SellerShellProps["store"] }) {
  return (
    <div className="border-b p-3">
      <div className="flex items-center gap-2.5 rounded-xl border bg-surface p-2.5">
        <span
          aria-hidden
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-xs font-semibold text-white",
            store.gradient,
          )}
        >
          {store.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{store.storeName}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {store.rating > 0 ? `${store.rating.toFixed(1)}★` : "New store"}
            {store.verified ? (
              <span className="text-emerald-600 dark:text-emerald-400">· verified</span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}

function SellerSidebarNav({
  groups,
  pathname,
  badges,
}: {
  groups: SellerNavGroup[];
  pathname: string;
  badges: SellerShellProps["badges"];
}) {
  return (
    <nav aria-label="Seller" className="flex-1 overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.title} className="mb-4 last:mb-0">
          <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.prefix
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : pathname === item.href;
              const count = item.badge ? badges[item.badge] : 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-foreground font-medium text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <SellerIcon name={item.icon} className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {count > 0 ? (
                      <span
                        className={cn(
                          "flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums",
                          active ? "bg-background text-foreground" : "bg-gold text-gold-foreground",
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Shown while a store is pending, suspended or rejected. */
export function SellerStatusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-14 items-center gap-3 border-b bg-card px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SAMRUX home">
          <LogoMark className="size-7" />
          <span className="text-sm font-semibold tracking-[0.18em]">SELLER</span>
        </Link>
        <Button size="sm" variant="ghost" className="ml-auto" render={<Link href="/account" />}>
          <Store className="size-3.5" aria-hidden />
          My account
        </Button>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-16">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
