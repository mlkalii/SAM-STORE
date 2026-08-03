import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { sellerStore } from "@/lib/marketplace/seller-store";
import type { Seller } from "@/lib/marketplace/types";

/**
 * Seller access control.
 *
 * A seller is not a third identity: it is a customer account that owns an
 * approved store. That keeps one session, one password reset, one verification
 * email — and means a shopper can start selling without a second sign-up.
 *
 * `requireSeller` is the only way a `/seller` page learns who it is serving, so
 * a new page cannot accidentally be public or accidentally serve a suspended
 * store.
 */

export const getSellerContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { user: null, seller: null };

  return { user, seller: sellerStore.findByOwner(user.id) ?? null };
});

/** Redirects to sign-in, then to the application, then to the holding page. */
export async function requireSeller(next = "/seller"): Promise<{
  seller: Seller;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
}> {
  const { user, seller } = await getSellerContext();

  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!seller) redirect("/sell/register");

  // A pending, suspended or rejected store gets the status page rather than a
  // dashboard full of controls it cannot use.
  if (seller.status !== "approved") redirect("/seller/status");

  return { seller, user };
}

/** For pages that must render for any application state, e.g. `/seller/status`. */
export async function requireSellerAccount(next = "/seller"): Promise<{
  seller: Seller;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
}> {
  const { user, seller } = await getSellerContext();

  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!seller) redirect("/sell/register");

  return { seller, user };
}

export function canSell(seller: Seller | null): seller is Seller {
  return seller?.status === "approved";
}
