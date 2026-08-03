"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/layout/account-menu";
import { HeaderActions } from "@/components/layout/header-actions";
import { MegaMenu } from "@/components/layout/mega-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchBar } from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/site";
import { useScrolledPast } from "@/hooks/use-scroll-position";
import { cn } from "@/lib/utils";

/**
 * Sticky header.
 *
 * Two rows on desktop — brand + search + actions, then the department rail with
 * the mega menu. The rail collapses away once the page scrolls, leaving a
 * compact frosted bar. Mobile keeps the drawer and a togglable search field.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  return (
    <header
      className={cn(
        // `dark` keeps the whole header stack — utility bar, brand row, search
        // field, department rail and mega menu — on the chrome palette while
        // the page below stays light.
        "dark sticky top-0 z-50 w-full bg-background text-foreground transition-shadow duration-500",
        scrolled ? "shadow-premium" : "",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 sm:gap-6 sm:px-8">
        <MobileNav />

        <Link
          href="/"
          aria-label="SAMRUX home"
          className="shrink-0 transition-opacity hover:opacity-90"
        >
          <Logo />
        </Link>

        <SearchBar className="hidden max-w-xl flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen((value) => !value)}
          >
            {mobileSearchOpen ? (
              <X className="size-4.5" aria-hidden />
            ) : (
              <Search className="size-4.5" aria-hidden />
            )}
          </Button>

          <AccountMenu />
          <HeaderActions />
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t px-5 py-3 md:hidden">
          <SearchBar autoFocus onNavigate={() => setMobileSearchOpen(false)} />
        </div>
      ) : null}

      {/* Department rail — collapses on scroll to reclaim vertical space. */}
      <nav
        aria-label="Departments"
        className={cn(
          "hidden overflow-hidden border-t transition-[height,opacity] duration-500 md:block",
          scrolled ? "h-0 border-transparent opacity-0" : "h-11 opacity-100",
        )}
      >
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-1.5 px-5 sm:px-8">
          <MegaMenu />

          {mainNav
            .filter((item) => item.href !== "/categories")
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "group/nav relative font-normal tracking-wide",
                    active && "text-foreground",
                  )}
                  render={<Link href={item.href} />}
                >
                  {item.label}
                  {/* Gold hairline: full on the active route, grows in on hover. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-2.5 -bottom-px h-px origin-center bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-300 ease-out",
                      active ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
                    )}
                  />
                </Button>
              );
            })}
        </div>
      </nav>
    </header>
  );
}
