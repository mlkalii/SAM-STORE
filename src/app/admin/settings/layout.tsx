import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import { requirePermission } from "@/lib/admin/auth";

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("settings.view", "/admin/settings");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store details, tax, shipping, notifications, payments, security and SEO."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
        actions={
          <Link
            href="/"
            target="_blank"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View storefront
          </Link>
        }
      />
      <SettingsTabs />
      <div className="mt-4">{children}</div>
    </>
  );
}
