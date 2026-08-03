"use client";

import {
  Bell,
  ExternalLink,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { adminLogoutAction } from "@/app/actions/admin-auth";
import { AdminIcon } from "@/components/admin/admin-icon";
import { adminNav, type AdminNavGroup } from "@/components/admin/nav-config";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { PublicStaff } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

/**
 * Admin shell.
 *
 * A fixed sidebar on desktop, a drawer on mobile, and a top bar carrying
 * search, notifications and the account menu. Navigation is filtered on the
 * server before it reaches here, so this renders exactly what the signed-in
 * role may open.
 *
 * Dark mode is admin-only and persisted in `localStorage`: operators often work
 * at night, and the storefront's own light/dark split is a separate decision.
 */
const THEME_KEY = "samrux.admin.theme";

export function AdminShell({
  staff,
  nav,
  notifications,
  children,
}: {
  staff: PublicStaff;
  nav: AdminNavGroup[];
  notifications: { id: string; title: string; body: string; href?: string; tone: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [signingOut, startSignOut] = React.useTransition();
  const [dark, setDark] = React.useState<boolean | null>(null);

  // Read the stored preference after mount — the server cannot know it, and
  // guessing would flash the wrong theme.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDark(window.localStorage.getItem(THEME_KEY) === "dark");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (dark === null) return;
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  // Close the drawer whenever the route changes. React's documented way to
  // react to a changed prop during render — no effect, no extra paint.
  const [drawerPath, setDrawerPath] = React.useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  const groups = nav.length > 0 ? nav : adminNav;

  return (
    <div className={cn(dark ? "dark" : "", "min-h-dvh bg-surface text-foreground")}>
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="SAMRUX admin home">
            <LogoMark className="size-7" />
            <span className="text-sm font-semibold tracking-[0.18em]">ADMIN</span>
          </Link>
        </div>

        <SidebarNav groups={groups} pathname={pathname} />

        <div className="border-t p-3">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View storefront
          </Link>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-card">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Logo />
              <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <SidebarNav groups={groups} pathname={pathname} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-4" aria-hidden />
          </Button>

          <AdminSearch groups={groups} />

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setDark((current) => !current)}
            >
              {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            </Button>

            <NotificationsMenu notifications={notifications} />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" className="ml-1" />}
                aria-label={`Account menu for ${staff.name}`}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-medium text-white",
                    staff.avatarColor,
                  )}
                >
                  {staff.initials}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuHeader className="font-normal">
                  <span className="block text-sm font-medium">{staff.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{staff.email}</span>
                  <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium capitalize text-gold">
                    {staff.role.replaceAll("-", " ")}
                  </span>
                </DropdownMenuHeader>

                <DropdownMenuSeparator />

                <DropdownMenuItem render={<Link href="/admin/settings/security" />}>
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/" target="_blank" rel="noreferrer" />}>
                  <ExternalLink className="size-4" aria-hidden />
                  View storefront
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/*
                  Called directly rather than through a nested <form>: the menu
                  unmounts its content on click, which can tear the form out of
                  the DOM before the submit is dispatched.
                */}
                <DropdownMenuItem
                  className="text-muted-foreground"
                  onClick={() => startSignOut(() => adminLogoutAction())}
                  disabled={signingOut}
                >
                  <LogOut className="size-4" aria-hidden />
                  {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({ groups, pathname }: { groups: AdminNavGroup[]; pathname: string }) {
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.title} className="mb-5 last:mb-0">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.prefix
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <AdminIcon name={item.icon} className="size-4 shrink-0" />
                    {item.label}
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

/** Jump-to navigation. Filters the same permission-checked nav the sidebar uses. */
function AdminSearch({ groups }: { groups: AdminNavGroup[] }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? groups
        .flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })))
        .filter((item) => item.label.toLowerCase().includes(needle))
    : [];

  return (
    <div ref={containerRef} className="relative max-w-sm flex-1">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Jump to…"
        aria-label="Search admin sections"
        className="h-9 pl-8 text-sm"
      />

      {open && matches.length > 0 ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <ul className="p-1.5">
            {matches.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
                >
                  <AdminIcon name={item.icon} className="size-3.5 text-muted-foreground" />
                  {item.label}
                  <span className="ml-auto text-[10px] text-muted-foreground">{item.group}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NotificationsMenu({
  notifications,
}: {
  notifications: { id: string; title: string; body: string; href?: string; tone: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" className="relative" />}
        aria-label={`Notifications, ${notifications.length} needing attention`}
      >
        <Bell className="size-4" aria-hidden />
        {notifications.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] font-medium text-gold-foreground tabular-nums">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* The label names the group beneath it, so both live in one group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Nothing needs you right now.
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                render={notification.href ? <Link href={notification.href} /> : <div />}
                className="items-start gap-2.5 py-2.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 size-1.5 shrink-0 rounded-full",
                    notification.tone === "danger"
                      ? "bg-destructive"
                      : notification.tone === "warning"
                        ? "bg-amber-500"
                        : "bg-gold",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{notification.title}</span>
                  <span className="block text-xs text-muted-foreground">{notification.body}</span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
