"use client";

import {
  Bell,
  Clock,
  Gift,
  CreditCard,
  Heart,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  Ticket,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package, exact: false },
  { href: "/account/messages", label: "Messages", icon: MessageSquare, exact: false },
  { href: "/account/profile", label: "Profile", icon: User, exact: false },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, exact: false },
  { href: "/account/coupons", label: "Coupons", icon: Ticket, exact: false },
  { href: "/account/gift-cards", label: "Gift cards", icon: Gift, exact: false },
  { href: "/account/recently-viewed", label: "Recently viewed", icon: Clock, exact: false },
  { href: "/account/notifications", label: "Notifications", icon: Bell, exact: false },
  { href: "/account/payment-methods", label: "Payment methods", icon: CreditCard, exact: false },
  { href: "/account/security", label: "Security", icon: ShieldCheck, exact: false },
];

/** Dashboard navigation: a rail on desktop, a scrolling strip on mobile. */
export function AccountNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-32">
      <ul className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <link.icon className="size-4 shrink-0" aria-hidden />
                {link.label}
                {link.href === "/account/notifications" && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-gold px-1.5 py-0.5 font-mono text-[10px] text-gold-foreground tabular-nums">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}

        <li className="shrink-0 lg:mt-4 lg:border-t lg:pt-4">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2.5 px-3 font-normal text-muted-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
