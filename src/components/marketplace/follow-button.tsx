"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { toggleFollowAction } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";

/**
 * Follow a store.
 *
 * Optimistic: the count and label flip immediately and revert if the server
 * disagrees, because a follow is cheap and a spinner here would feel worse than
 * the rare correction.
 */
export function FollowButton({
  csrfToken,
  sellerId,
  following,
  followerCount,
  signedIn,
}: {
  csrfToken: string;
  sellerId: string;
  following: boolean;
  followerCount: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = React.useState({ following, count: followerCount });
  const [pending, startTransition] = React.useTransition();

  // Server state wins whenever it changes — a revalidation after another tab
  // followed the same store must not be overwritten by stale local state.
  const [seen, setSeen] = React.useState({ following, followerCount });
  if (seen.following !== following || seen.followerCount !== followerCount) {
    setSeen({ following, followerCount });
    setOptimistic({ following, count: followerCount });
  }

  function toggle() {
    if (!signedIn) {
      toast.error("Sign in to follow a store.");
      router.push("/login?next=/sellers");
      return;
    }

    const previous = optimistic;
    setOptimistic({
      following: !previous.following,
      count: previous.count + (previous.following ? -1 : 1),
    });

    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("sellerId", sellerId);

      const result = await toggleFollowAction(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Done");
      else {
        setOptimistic(previous);
        toast.error(result.message ?? "That did not work");
      }
    });
  }

  return (
    <Button
      variant={optimistic.following ? "default" : "outline"}
      disabled={pending}
      onClick={toggle}
      aria-pressed={optimistic.following}
    >
      <Heart className={optimistic.following ? "size-4 fill-current" : "size-4"} aria-hidden />
      {optimistic.following ? "Following" : "Follow"}
      <span className="text-xs opacity-70">{optimistic.count.toLocaleString("en-US")}</span>
    </Button>
  );
}
