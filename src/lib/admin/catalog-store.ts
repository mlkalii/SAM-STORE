import "server-only";

import { randomUUID } from "node:crypto";

import type { Product } from "@/types";

/**
 * Editable catalogue layer.
 *
 * The bundled catalogue is a read-only JSON file. Rather than rewrite a large
 * JSON file on every keystroke, admin edits are stored as *overlays*: a patch
 * per slug, plus a list of admin-created products and a set of deleted slugs.
 * `lib/product-source` applies them, so an edit made here shows on the
 * storefront immediately and the original data stays pristine.
 *
 * This is also the shape a database migration wants: overlays become rows, the
 * merge becomes a join, and the merge function is the only thing that changes.
 */

export type ProductStatus = "published" | "draft" | "archived";

/** Admin-only fields the customer catalogue has no concept of. */
export interface ProductAdminMeta {
  status: ProductStatus;
  costPrice?: number;
  barcode?: string;
  seoTitle?: string;
  seoDescription?: string;
  visible: boolean;
  videoUrl?: string;
  updatedAt: string;
  updatedBy?: string;
}

export type ProductPatch = Partial<Product> & Partial<ProductAdminMeta>;

interface State {
  patches: Map<string, ProductPatch>;
  created: Map<string, Product & ProductAdminMeta>;
  deleted: Set<string>;
}

const globalForCatalog = globalThis as unknown as { __samruxCatalogEdits?: State };

function state(): State {
  if (!globalForCatalog.__samruxCatalogEdits) {
    globalForCatalog.__samruxCatalogEdits = {
      patches: new Map(),
      created: new Map(),
      deleted: new Set(),
    };
  }
  return globalForCatalog.__samruxCatalogEdits;
}

export const DEFAULT_ADMIN_META: ProductAdminMeta = {
  status: "published",
  visible: true,
  updatedAt: "",
};

/** Admin metadata for a product, whether or not it has ever been edited. */
export function adminMetaFor(slug: string): ProductAdminMeta {
  const created = state().created.get(slug);
  if (created) {
    return {
      status: created.status,
      costPrice: created.costPrice,
      barcode: created.barcode,
      seoTitle: created.seoTitle,
      seoDescription: created.seoDescription,
      visible: created.visible,
      videoUrl: created.videoUrl,
      updatedAt: created.updatedAt,
      updatedBy: created.updatedBy,
    };
  }

  const patch = state().patches.get(slug);
  return {
    status: patch?.status ?? DEFAULT_ADMIN_META.status,
    costPrice: patch?.costPrice,
    barcode: patch?.barcode,
    seoTitle: patch?.seoTitle,
    seoDescription: patch?.seoDescription,
    visible: patch?.visible ?? DEFAULT_ADMIN_META.visible,
    videoUrl: patch?.videoUrl,
    updatedAt: patch?.updatedAt ?? "",
    updatedBy: patch?.updatedBy,
  };
}

/**
 * Applies every overlay to the bundled list.
 *
 * `audience: "storefront"` additionally hides drafts, archived and
 * visibility-off products — the admin needs to see them, shoppers must not.
 */
export function applyCatalogOverlays(
  base: Product[],
  audience: "admin" | "storefront" = "storefront",
): Product[] {
  const { patches, created, deleted } = state();

  if (patches.size === 0 && created.size === 0 && deleted.size === 0) {
    return base;
  }

  const merged: Product[] = [];

  for (const product of base) {
    if (deleted.has(product.slug)) continue;

    const patch = patches.get(product.slug);
    const next = patch ? ({ ...product, ...patch } as Product) : product;

    if (audience === "storefront") {
      const meta = adminMetaFor(product.slug);
      if (meta.status !== "published" || !meta.visible) continue;
    }
    merged.push(next);
  }

  for (const product of created.values()) {
    if (deleted.has(product.slug)) continue;
    if (audience === "storefront" && (product.status !== "published" || !product.visible)) continue;
    merged.push(product);
  }

  return merged;
}

export const catalogStore = {
  patch(slug: string, patch: ProductPatch, editor?: string) {
    const created = state().created.get(slug);
    if (created) {
      state().created.set(slug, {
        ...created,
        ...patch,
        updatedAt: new Date().toISOString(),
        updatedBy: editor,
      } as Product & ProductAdminMeta);
      return;
    }

    const existing = state().patches.get(slug) ?? {};
    state().patches.set(slug, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: editor,
    });
  },

  create(product: Product, meta: Partial<ProductAdminMeta>, editor?: string) {
    const record = {
      ...product,
      ...DEFAULT_ADMIN_META,
      ...meta,
      updatedAt: new Date().toISOString(),
      updatedBy: editor,
    } as Product & ProductAdminMeta;
    state().created.set(product.slug, record);
    state().deleted.delete(product.slug);
    return record;
  },

  /** Soft delete: the slug is filtered out, the source file is untouched. */
  remove(slug: string) {
    state().deleted.add(slug);
    state().created.delete(slug);
  },

  restore(slug: string) {
    state().deleted.delete(slug);
  },

  isDeleted(slug: string) {
    return state().deleted.has(slug);
  },

  /** Duplicating produces a draft, so a copy is never accidentally published. */
  duplicate(source: Product, editor?: string) {
    const slug = `${source.slug}-copy-${randomUUID().slice(0, 6)}`;
    const copy: Product = {
      ...source,
      id: `admin-${randomUUID().slice(0, 8)}`,
      slug,
      name: `${source.name} (copy)`,
      sku: `${source.sku}-C`,
      reviews: [],
      reviewCount: 0,
      featured: false,
      bestSeller: false,
      newArrival: false,
      trending: false,
    };
    return catalogStore.create(copy, { status: "draft", visible: false }, editor);
  },

  stats() {
    return {
      edited: state().patches.size,
      created: state().created.size,
      deleted: state().deleted.size,
    };
  },
};
