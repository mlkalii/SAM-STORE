"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { saveSellerProductAction } from "@/app/actions/seller";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  FormSection,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";
import { Button } from "@/components/ui/button";
import { toDecimal } from "@/lib/format";

export interface SellerProductDraft {
  slug?: string;
  name: string;
  brand: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockCount: number;
  category: string;
  subcategory: string;
  tags: string[];
  status: "published" | "draft" | "archived";
  visible: boolean;
  barcode?: string;
  videoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

const TABS = ["details", "pricing", "inventory", "media", "shipping", "seo"] as const;

export function SellerProductEditor({
  csrfToken,
  product,
  categories,
  warrantyLabel,
  returnWindowDays,
}: {
  csrfToken: string;
  product: SellerProductDraft;
  categories: { slug: string; name: string; subcategories: string[] }[];
  warrantyLabel: string;
  returnWindowDays: number;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("details");
  const [category, setCategory] = React.useState(product.category || categories[0]?.slug || "");

  const subcategories =
    categories.find((entry) => entry.slug === category)?.subcategories ?? [];

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

      {/*
        One form across every tab. Tabs hide with the `hidden` attribute rather
        than unmounting, so a field edited on one tab is still submitted from
        another — the mistake that silently drops data.
      */}
      <AdminForm
        action={saveSellerProductAction}
        csrfToken={csrfToken}
        hidden={product.slug ? { slug: product.slug } : {}}
        submitLabel={product.slug ? "Save product" : "Create product"}
        onSuccess={(state) => {
          const slug = state.data?.slug;
          if (slug) router.push(`/seller/products/${slug}`);
        }}
      >
        <div hidden={tab !== "details"}>
          <FormSection title="Product details">
            <TextInput name="name" label="Product name" defaultValue={product.name} required />
            <FormGrid>
              <TextInput name="brand" label="Brand" defaultValue={product.brand} />
              <TextInput
                name="sku"
                label="SKU"
                defaultValue={product.sku}
                hint="Left blank we generate one"
              />
            </FormGrid>
            <TextArea
              name="shortDescription"
              label="Short description"
              rows={2}
              defaultValue={product.shortDescription}
              hint="One line, shown on cards and in search"
            />
            <TextArea
              name="longDescription"
              label="Full description"
              rows={6}
              defaultValue={product.longDescription}
            />
            <TextArea
              name="features"
              label="Key features"
              rows={5}
              defaultValue={product.features.join("\n")}
              hint="One per line"
            />
            <FormGrid>
              <SelectInput
                name="category"
                label="Department"
                value={category}
                onValueChange={setCategory}
                options={categories.map((entry) => ({ value: entry.slug, label: entry.name }))}
              />
              <SelectInput
                name="subcategory"
                label="Subcategory"
                defaultValue={product.subcategory}
                options={subcategories.map((sub) => ({ value: sub, label: sub }))}
              />
            </FormGrid>
            <TextInput
              name="tags"
              label="Tags"
              defaultValue={product.tags.join(", ")}
              hint="Comma separated. Used by search and by the return policy rules."
            />
          </FormSection>
        </div>

        <div hidden={tab !== "pricing"}>
          <FormSection title="Pricing">
            <FormGrid>
              <TextInput
                name="price"
                label="Price (USDT)"
                inputMode="decimal"
                defaultValue={toDecimal(product.price)}
                required
              />
              <TextInput
                name="compareAtPrice"
                label="Compare-at price"
                inputMode="decimal"
                hint="Shows as a strike-through"
                defaultValue={product.compareAtPrice ? toDecimal(product.compareAtPrice) : ""}
              />
            </FormGrid>
            <TextInput
              name="costPrice"
              label="Cost price"
              inputMode="decimal"
              hint="Private. Used for your margin reporting only."
              defaultValue={product.costPrice ? toDecimal(product.costPrice) : ""}
            />
            <p className="text-xs text-muted-foreground">
              Marketplace commission is deducted at settlement, not from the price you enter.
              See <span className="font-medium">Payouts</span> for your current rate.
            </p>
          </FormSection>
        </div>

        <div hidden={tab !== "inventory"}>
          <FormSection title="Inventory">
            <FormGrid>
              <TextInput
                name="stockCount"
                label="Units in stock"
                type="number"
                defaultValue={String(product.stockCount)}
              />
              <TextInput name="barcode" label="Barcode" defaultValue={product.barcode} />
            </FormGrid>
            <SelectInput
              name="status"
              label="Status"
              defaultValue={product.status}
              options={[
                { value: "published", label: "Published — live on the storefront" },
                { value: "draft", label: "Draft — only you can see it" },
                { value: "archived", label: "Archived — delisted, history kept" },
              ]}
            />
            <CheckboxInput
              name="visible"
              label="Visible in search and category pages"
              defaultChecked={product.visible}
            />
          </FormSection>
        </div>

        <div hidden={tab !== "media"}>
          <FormSection title="Media">
            <TextInput
              name="videoUrl"
              label="Video URL"
              defaultValue={product.videoUrl}
              hint="A hosted MP4 or an embed link"
            />
            <p className="text-sm text-muted-foreground">
              Image uploads are handled by the marketplace media pipeline. Until it is connected,
              products created here show their department gradient — which is also the placeholder
              a photo fades in over.
            </p>
          </FormSection>
        </div>

        <div hidden={tab !== "shipping"}>
          <FormSection title="Shipping, warranty and returns">
            <p className="text-sm text-muted-foreground">
              SAMRUX ships to all fifty US states. Shipping rates and delivery estimates are set
              marketplace-wide, so a customer sees one shipping price however many sellers are in
              their basket.
            </p>
            <dl className="space-y-2 rounded-xl border p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Warranty for this department</dt>
                <dd className="text-right font-medium">{warrantyLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Return window</dt>
                <dd className="text-right font-medium">{returnWindowDays} days from delivery</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Warranty is assigned automatically by department and cannot be shortened per
              product — it is the promise the marketplace makes on your behalf.
            </p>
          </FormSection>
        </div>

        <div hidden={tab !== "seo"}>
          <FormSection title="Search engine listing">
            <TextInput
              name="seoTitle"
              label="Meta title"
              defaultValue={product.seoTitle}
              hint="Defaults to the product name"
            />
            <TextArea
              name="seoDescription"
              label="Meta description"
              rows={3}
              defaultValue={product.seoDescription}
              hint="Defaults to the short description"
            />
          </FormSection>
        </div>
      </AdminForm>
    </div>
  );
}
