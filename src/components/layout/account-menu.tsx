"use client";

import {
  Clock,
  GitCompare,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Settings,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompare, useRecentlyViewed, useWishlist } from "@/hooks/use-product-lists";

interface PublicUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarColor: string;
  initials: string;
}

/**
 * Account menu.
 *
 * The session is fetched after mount from `/api/auth/me` rather than read in a
 * server layout, so the storefront stays statically prerendered. Until the
 * request resolves the menu shows the signed-out state, which is also what a
 * crawler sees — correct, since crawlers have no session.
 */
export function AccountMenu() {
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const { count: savedCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { items: recent } = useRecentlyViewed();
  const [signingOut, startSignOut] = React.useTransition();

  React.useEffect(() => {
    const controller = new AbortController();

    fetch("/api/auth/me", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((payload: { user: PublicUser | null }) => setUser(payload.user))
      .catch(() => {
        // Signed-out is the safe default; the menu still works.
      });

    return () => controller.abort();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="hidden sm:inline-flex" />}
        aria-label={user ? `Account menu for ${user.name}` : "Account menu"}
      >
        {user ? (
          <span
            aria-hidden
            className={`flex size-6 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-medium text-white ${user.avatarColor}`}
          >
            {user.initials}
          </span>
        ) : (
          <User className="size-4.5" aria-hidden />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuHeader className="font-normal">
          <span className="block text-sm font-medium">{user ? user.name : "Guest"}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {user ? user.email : "Lists are saved in this browser"}
          </span>
        </DropdownMenuHeader>

        <DropdownMenuSeparator />

        {user ? (
          <>
            <DropdownMenuItem render={<Link href="/account" />}>
              <LayoutDashboard className="size-4" aria-hidden />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/account/orders" />}>
              <Package className="size-4" aria-hidden />
              Orders
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem render={<Link href="/login" />}>
              <LogIn className="size-4" aria-hidden />
              Sign in
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/register" />}>
              <UserPlus className="size-4" aria-hidden />
              Create an account
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/wishlist" />}>
          <Heart className="size-4" aria-hidden />
          Wishlist
          <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
            {savedCount}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link href="/compare" />}>
          <GitCompare className="size-4" aria-hidden />
          Compare
          <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
            {compareCount}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link href="/recently-viewed" />}>
          <Clock className="size-4" aria-hidden />
          Recently viewed
          <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
            {recent.length}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/help" />}>
          <Settings className="size-4" aria-hidden />
          Help &amp; support
        </DropdownMenuItem>

        {user ? (
          /*
            Called directly rather than through a nested <form>: the menu
            unmounts its content on click, which can tear the form out of the
            DOM before the submit is dispatched.
          */
          <DropdownMenuItem
            className="text-muted-foreground"
            onClick={() => startSignOut(() => logoutAction())}
            disabled={signingOut}
          >
            <LogOut className="size-4" aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
