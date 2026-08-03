import type { Metadata } from "next";

import { ContentManager } from "@/components/admin/content-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { contentStore, settingsStore } from "@/lib/admin/stores";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentPage() {
  await requirePermission("content.view", "/admin/content");
  const csrfToken = await getCsrfToken();

  return (
    <>
      <PageHeader
        title="Content"
        description="Homepage sections, promotional banners, static pages, FAQs and contact details."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Content" }]}
      />
      <ContentManager
        csrfToken={csrfToken}
        sections={contentStore.sections()}
        banners={contentStore.banners()}
        staticPages={contentStore.staticPages()}
        faqs={contentStore.faqs()}
        settings={settingsStore.get()}
      />
    </>
  );
}
