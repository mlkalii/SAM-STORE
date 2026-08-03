"use client";

import { ExternalLink, HelpCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  deleteFaqAction,
  saveBannerAction,
  saveFaqAction,
  saveSettingsAction,
  toggleSectionAction,
} from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";
import { Card, EmptyState, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import type {
  FaqEntry,
  HomepageSection,
  PromoBannerContent,
  StaticPageContent,
  StoreSettings,
} from "@/lib/admin/stores";

const TABS = ["homepage", "banners", "pages", "faqs", "contact"] as const;

export function ContentManager({
  csrfToken,
  sections,
  banners,
  staticPages,
  faqs,
  settings,
}: {
  csrfToken: string;
  sections: HomepageSection[];
  banners: PromoBannerContent[];
  staticPages: StaticPageContent[];
  faqs: FaqEntry[];
  settings: StoreSettings;
}) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("homepage");
  const [editingBanner, setEditingBanner] = React.useState<PromoBannerContent | null>(null);
  const [editingFaq, setEditingFaq] = React.useState<FaqEntry | null>(null);
  const [addingFaq, setAddingFaq] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function post(
    action: (prev: never, form: FormData) => Promise<{ ok: boolean; message?: string }>,
    entries: Record<string, string>,
  ) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      for (const [key, value] of Object.entries(entries)) form.set(key, value);
      const result = await action(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Saved");
      else toast.error(result.message ?? "That did not work");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {TABS.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={tab === entry ? "default" : "ghost"}
            className="h-8 px-3 text-xs capitalize"
            onClick={() => setTab(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>

      {tab === "homepage" ? (
        <Card
          title="Homepage sections"
          description="Turn a section off to hide it from the storefront. Order reflects the page top to bottom."
          bodyClassName="p-0"
        >
          <ul className="divide-y">
            {sections.map((section, index) => (
              <li key={section.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{section.label}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {section.component}
                  </p>
                </div>
                <Pill tone={section.enabled ? "positive" : "neutral"}>
                  {section.enabled ? "visible" : "hidden"}
                </Pill>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={() =>
                    post(toggleSectionAction, {
                      id: section.id,
                      enabled: section.enabled ? "" : "on",
                    })
                  }
                >
                  {section.enabled ? "Hide" : "Show"}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {tab === "banners" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card title="Promotional banners" bodyClassName="p-0">
            <ul className="divide-y">
              {banners.map((banner) => (
                <li key={banner.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {banner.eyebrow}
                      </p>
                      <p className="truncate text-sm font-medium">{banner.headline}</p>
                      <p className="truncate text-xs text-muted-foreground">{banner.body}</p>
                    </div>
                    <Pill tone={banner.active ? "positive" : "neutral"}>
                      {banner.active ? "live" : "off"}
                    </Pill>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${banner.headline}`}
                      onClick={() => setEditingBanner(banner)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title={editingBanner ? "Edit banner" : "Select a banner"}
            actions={
              editingBanner ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Close"
                  onClick={() => setEditingBanner(null)}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              ) : null
            }
          >
            {editingBanner ? (
              <AdminForm
                key={editingBanner.id}
                action={saveBannerAction}
                csrfToken={csrfToken}
                hidden={{ id: editingBanner.id }}
                submitLabel="Save banner"
              >
                <TextInput name="eyebrow" label="Eyebrow" defaultValue={editingBanner.eyebrow} />
                <TextInput
                  name="headline"
                  label="Headline"
                  defaultValue={editingBanner.headline}
                  required
                />
                <TextArea name="body" label="Body" rows={3} defaultValue={editingBanner.body} />
                <FormGrid>
                  <TextInput name="ctaLabel" label="Button" defaultValue={editingBanner.ctaLabel} />
                  <TextInput name="ctaHref" label="Links to" defaultValue={editingBanner.ctaHref} />
                </FormGrid>
                <CheckboxInput
                  name="active"
                  label="Live on the storefront"
                  defaultChecked={editingBanner.active}
                />
              </AdminForm>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a banner to change its copy, link and visibility.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "pages" ? (
        <Card
          title="Static pages"
          description="Content pages served from the storefront. Editing opens the live page."
          bodyClassName="p-0"
        >
          <ul className="divide-y">
            {staticPages.map((page) => (
              <li key={page.slug} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{page.title}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">/{page.slug}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  updated {page.updatedAt.slice(0, 10)}
                </span>
                <Pill tone={page.published ? "positive" : "neutral"}>
                  {page.published ? "published" : "draft"}
                </Pill>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  render={<Link href={`/${page.slug}`} target="_blank" />}
                >
                  View
                  <ExternalLink className="size-3" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {tab === "faqs" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card
            title={`${faqs.length} questions`}
            bodyClassName="p-0"
            actions={
              <Button
                size="sm"
                onClick={() => {
                  setEditingFaq(null);
                  setAddingFaq(true);
                }}
              >
                <Plus className="size-3.5" aria-hidden />
                New question
              </Button>
            }
          >
            {faqs.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={HelpCircle}
                  title="No questions yet"
                  description="Add the questions customers ask most."
                />
              </div>
            ) : (
              <ul className="divide-y">
                {faqs.map((faq) => (
                  <li key={faq.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{faq.question}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                      {faq.published ? null : <Pill tone="neutral">draft</Pill>}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${faq.question}`}
                        onClick={() => {
                          setAddingFaq(false);
                          setEditingFaq(faq);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${faq.question}`}
                        disabled={pending}
                        onClick={() => post(deleteFaqAction, { id: faq.id })}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={editingFaq ? "Edit question" : addingFaq ? "New question" : "FAQs"}>
            {editingFaq || addingFaq ? (
              <AdminForm
                key={editingFaq?.id ?? "new-faq"}
                action={saveFaqAction}
                csrfToken={csrfToken}
                hidden={editingFaq ? { id: editingFaq.id } : {}}
                submitLabel={editingFaq ? "Save question" : "Add question"}
              >
                <TextInput
                  name="question"
                  label="Question"
                  defaultValue={editingFaq?.question}
                  required
                />
                <TextArea
                  name="answer"
                  label="Answer"
                  rows={5}
                  defaultValue={editingFaq?.answer}
                  required
                />
                <TextInput
                  name="position"
                  label="Position"
                  type="number"
                  defaultValue={String(editingFaq?.position ?? faqs.length)}
                />
                <CheckboxInput
                  name="published"
                  label="Published"
                  defaultChecked={editingFaq ? editingFaq.published : true}
                />
              </AdminForm>
            ) : (
              <p className="text-sm text-muted-foreground">
                Questions appear on the help page in the order set here.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "contact" ? (
        <Card
          title="Contact details"
          description="Used in the footer, transactional emails and the contact page."
          className="max-w-2xl"
        >
          <AdminForm action={saveSettingsAction} csrfToken={csrfToken} submitLabel="Save details">
            <FormGrid>
              <TextInput
                name="supportEmail"
                label="Primary email"
                type="email"
                defaultValue={settings.supportEmail}
                required
              />
              <TextInput
                name="contactEmail"
                label="Secondary email"
                type="email"
                defaultValue={settings.contactEmail}
                required
              />
            </FormGrid>
            <FormGrid>
              <TextInput name="phone" label="Phone" defaultValue={settings.phone} />
              <TextInput name="legalName" label="Legal name" defaultValue={settings.legalName} />
            </FormGrid>
            <TextArea
              name="addressLine"
              label="Registered address"
              rows={2}
              defaultValue={settings.addressLine}
            />
          </AdminForm>
        </Card>
      ) : null}
    </div>
  );
}
