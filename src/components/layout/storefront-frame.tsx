import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartSheet } from "@/components/layout/cart-sheet";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartProvider } from "@/components/providers/cart-provider";

/**
 * The customer-facing chrome.
 *
 * Lives in a component rather than the root layout because the admin panel is a
 * separate surface and must not inherit the shop's header, footer, cart or
 * bottom navigation. Used by the `(storefront)` group layout and by the global
 * `not-found`, which has to render outside that group.
 */
export function StorefrontFrame({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <AnnouncementBar />
        <SiteHeader />
        <main id="main" className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <SiteFooter />
      </div>
      <CartSheet />
      <BottomNav />
    </CartProvider>
  );
}
