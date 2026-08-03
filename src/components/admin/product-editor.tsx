"use client";

import { saveProductAction } from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  FormSection,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";

export interface ProductEditorValues {
  slug: string;
  name: string;
  brand: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  barcode?: string;
  stockCount: number;
  category: string;
  subcategory: string;
  tags: string[];
  status: string;
  visible: boolean;
  seoTitle?: string;
  seoDescription?: string;
  videoUrl?: string;
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  bestSeller: boolean;
}

/** Money is stored in cents; the form works in dollars. */
const toDollars = (cents?: number) => (typeof cents === "number" ? (cents / 100).toFixed(2) : "");

export function ProductEditor({
  csrfToken,
  product,
  categories,
}: {
  csrfToken: string;
  product: ProductEditorValues;
  categories: { value: string; label: string }[];
}) {
  return (
    <AdminForm
      action={saveProductAction}
      csrfToken={csrfToken}
      hidden={{ slug: product.slug }}
      submitLabel="Save product"
    >
      <FormSection title="Basics">
        <FormGrid>
          <TextInput name="name" label="Product name" defaultValue={product.name} required />
          <TextInput name="brand" label="Brand" defaultValue={product.brand} />
          <TextInput name="sku" label="SKU" defaultValue={product.sku} />
          <TextInput name="barcode" label="Barcode (GTIN/EAN)" defaultValue={product.barcode} />
        </FormGrid>

        <TextArea
          name="shortDescription"
          label="Short description"
          rows={2}
          defaultValue={product.shortDescription}
          hint="One line, shown on cards and in search results"
        />
        <TextArea
          name="longDescription"
          label="Full description"
          rows={6}
          defaultValue={product.longDescription}
        />
      </FormSection>

      <FormSection title="Pricing" description="Entered in dollars, stored as integer cents.">
        <FormGrid>
          <TextInput
            name="price"
            label="Selling price"
            type="text"
            inputMode="decimal"
            defaultValue={toDollars(product.price)}
            required
          />
          <TextInput
            name="compareAtPrice"
            label="Compare-at price"
            type="text"
            inputMode="decimal"
            defaultValue={toDollars(product.compareAtPrice)}
            hint="Leave blank for no discount"
          />
          <TextInput
            name="costPrice"
            label="Cost price"
            type="text"
            inputMode="decimal"
            defaultValue={toDollars(product.costPrice)}
            hint="Used for margin reporting only — never shown publicly"
          />
          <TextInput
            name="stockCount"
            label="Stock on hand"
            type="number"
            defaultValue={String(product.stockCount)}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Organisation">
        <FormGrid>
          <SelectInput
            name="category"
            label="Department"
            options={categories}
            defaultValue={product.category}
          />
          <TextInput name="subcategory" label="Type" defaultValue={product.subcategory} />
        </FormGrid>

        <TextInput
          name="tags"
          label="Tags"
          defaultValue={product.tags.join(", ")}
          hint="Comma separated — used by search"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxInput name="featured" label="Featured" defaultChecked={product.featured} />
          <CheckboxInput name="trending" label="Trending" defaultChecked={product.trending} />
          <CheckboxInput name="newArrival" label="New arrival" defaultChecked={product.newArrival} />
          <CheckboxInput name="bestSeller" label="Best seller" defaultChecked={product.bestSeller} />
        </div>
      </FormSection>

      <FormSection title="Visibility">
        <FormGrid>
          <SelectInput
            name="status"
            label="Status"
            defaultValue={product.status}
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <div className="flex items-end pb-2">
            <CheckboxInput
              name="visible"
              label="Visible on the storefront"
              hint="Uncheck to hide without unpublishing"
              defaultChecked={product.visible}
            />
          </div>
        </FormGrid>
      </FormSection>

      <FormSection title="Media and SEO">
        <TextInput
          name="videoUrl"
          label="Product video URL"
          defaultValue={product.videoUrl}
          placeholder="https://…"
          hint="Renders in the gallery's video slot"
        />
        <TextInput name="seoTitle" label="SEO title" defaultValue={product.seoTitle} />
        <TextArea
          name="seoDescription"
          label="SEO description"
          rows={2}
          defaultValue={product.seoDescription}
        />
      </FormSection>
    </AdminForm>
  );
}
