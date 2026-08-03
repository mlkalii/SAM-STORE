import type { Metadata } from "next";

import { Avatar, Panel } from "@/components/account/account-ui";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser, toPublicUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = toPublicUser(user);
  const csrfToken = await getCsrfToken();

  return (
    <>
      <Panel title="Profile photo" description="Shown on reviews and in your account.">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            initials={profile.initials}
            gradient={user.avatarColor}
            className="size-20 text-2xl"
          />
          <p className="max-w-sm text-sm text-muted-foreground">
            Your avatar is generated from your initials with a colour assigned at sign-up. Photo
            upload arrives with the media service — the shape of this panel will not change.
          </p>
        </div>
      </Panel>

      <Panel title="Personal details" description="Used for delivery and order updates.">
        <ProfileForm
          csrfToken={csrfToken}
          defaults={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            marketingOptIn: user.marketingOptIn,
          }}
        />
      </Panel>
    </>
  );
}
