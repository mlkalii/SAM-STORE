import { AlertCircle } from "lucide-react";

import { AccountNav } from "@/components/account/account-nav";
import { Avatar } from "@/components/account/account-ui";
import { Container } from "@/components/common/container";
import { requireUser, toPublicUser } from "@/lib/auth";
import { notifications } from "@/lib/commerce/notifications";
import { ResendVerification } from "@/components/account/resend-verification";

/**
 * Dashboard shell. `requireUser()` runs here, so every nested page is
 * guaranteed a signed-in user without repeating the check.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = toPublicUser(user);
  const unread =
    notifications.unreadCount(user.id) +
    user.notifications.filter((notification) => !notification.read).length;

  return (
    <div className="bg-surface">
      <Container className="py-10 sm:py-14">
        <header className="flex flex-wrap items-center gap-4">
          <Avatar
            initials={profile.initials}
            gradient={user.avatarColor}
            className="size-14 text-lg"
          />
          <div className="min-w-0">
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{profile.name}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </header>

        {!profile.emailVerified ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm">
            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <span className="flex-1 text-amber-800 dark:text-amber-300">
              Your email address is not verified yet. Order updates are paused until it is.
            </span>
            <ResendVerification />
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
          <AccountNav unreadCount={unread} />
          <div className="min-w-0 space-y-8">{children}</div>
        </div>
      </Container>
    </div>
  );
}
