import { NextResponse } from "next/server";

import { getCurrentUser, toPublicUser } from "@/lib/auth";

/**
 * Who is signed in.
 *
 * The header reads this after mount rather than the root layout reading
 * `cookies()`. That matters: touching cookies in the root layout would make
 * every route dynamic and give up prerendering for all 780 product pages.
 * Never returns the password hash — `toPublicUser` is the only projection.
 */
export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json(
    { user: user ? toPublicUser(user) : null },
    { headers: { "cache-control": "no-store, private" } },
  );
}
