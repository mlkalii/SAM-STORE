"use client";

import { FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";
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
import { cn } from "@/lib/utils";

export interface AdminCategoryRow {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
  subcategories: string[];
  parentSlug?: string;
  featured: boolean;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;
}

/**
 * Category manager.
 *
 * List plus an inline editor rather than a separate route — a category is four
 * fields and a checkbox, and a full page navigation for that is friction.
 */
export function CategoryManager({
  csrfToken,
  categories,
}: {
  csrfToken: string;
  categories: AdminCategoryRow[];
}) {
  const [editing, setEditing] = React.useState<AdminCategoryRow | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const open = adding || editing !== null;

  function remove(slug: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("slug", slug);
      const result = await deleteCategoryAction(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Removed");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const parents = categories.filter((category) => !category.parentSlug);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card
        title={`${categories.length} categories`}
        bodyClassName="p-0"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            New category
          </Button>
        }
      >
        {categories.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={FolderTree}
              title="No categories"
              description="Add a department to start organising the catalogue."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {categories.map((category) => (
              <li key={category.slug} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span
                  aria-hidden
                  className={cn("size-8 shrink-0 rounded-lg bg-linear-to-br", category.gradient)}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {category.parentSlug ? (
                      <span className="text-xs text-muted-foreground">
                        {category.parentSlug} /
                      </span>
                    ) : null}
                    {category.name}
                    {category.featured ? <Pill tone="gold">featured</Pill> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{category.tagline}</p>
                </div>

                <span className="text-xs text-muted-foreground tabular-nums">
                  {category.productCount} products
                </span>

                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => {
                      setAdding(false);
                      setEditing(category);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete ${category.name}`}
                    disabled={pending}
                    onClick={() => remove(category.slug)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        {open ? (
          <Card
            title={editing ? `Edit ${editing.name}` : "New category"}
            actions={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Close"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            }
          >
            <AdminForm
              key={editing?.slug ?? "new"}
              action={saveCategoryAction}
              csrfToken={csrfToken}
              hidden={editing ? { slug: editing.slug } : {}}
              submitLabel={editing ? "Save category" : "Create category"}
            >
              <TextInput name="name" label="Name" defaultValue={editing?.name} required />
              <TextInput name="tagline" label="Tagline" defaultValue={editing?.tagline} />
              <TextArea name="description" label="Description" rows={3} defaultValue={editing?.description} />

              <FormGrid>
                <TextInput
                  name="icon"
                  label="Icon"
                  defaultValue={editing?.icon}
                  hint="Lucide icon name"
                />
                <TextInput
                  name="parentSlug"
                  label="Parent category"
                  defaultValue={editing?.parentSlug}
                  hint={`Optional — e.g. ${parents[0]?.slug ?? "electronics"}`}
                />
              </FormGrid>

              <TextInput
                name="gradient"
                label="Gradient"
                defaultValue={editing?.gradient}
                hint="Tailwind classes used for the banner"
              />
              <TextInput
                name="subcategories"
                label="Types"
                defaultValue={editing?.subcategories.join(", ")}
                hint="Comma separated"
              />
              <TextInput name="imageUrl" label="Image URL" defaultValue={editing?.imageUrl} />

              <TextInput name="seoTitle" label="SEO title" defaultValue={editing?.seoTitle} />
              <TextArea
                name="seoDescription"
                label="SEO description"
                rows={2}
                defaultValue={editing?.seoDescription}
              />

              <CheckboxInput
                name="featured"
                label="Featured"
                hint="Shown in the homepage department grid"
                defaultChecked={editing?.featured}
              />
            </AdminForm>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Select a category to edit, or create a new one.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
