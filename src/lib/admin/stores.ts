import "server-only";

import { randomUUID } from "node:crypto";

import { categories as seedCategories } from "@/data/categories";
import { siteConfig } from "@/config/site";
import type { Category } from "@/types";
import { currencyConfig, storeAddressLine, storeConfig } from "@/config/store";

/**
 * Editable admin stores.
 *
 * Categories, brands, warehouses, purchase orders, stock movements, CMS content
 * and settings all follow the same shape: an in-memory map seeded from the
 * existing static data, exposed through a small CRUD object. Each one is a
 * table in waiting — the seam is the store object, not the pages.
 */

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

export interface AdminCategory extends Category {
  /** Slug of the parent department, when this is a child. */
  parentSlug?: string;
  featured: boolean;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  position: number;
}

/* -------------------------------------------------------------------------- */
/*  Brands                                                                     */
/* -------------------------------------------------------------------------- */

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  featured: boolean;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  active: boolean;
}

export interface StockMovement {
  id: string;
  slug: string;
  warehouseId: string;
  delta: number;
  reason: "adjustment" | "sale" | "return" | "purchase-order" | "damage" | "recount";
  note?: string;
  at: string;
  by?: string;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplier: string;
  warehouseId: string;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  expectedAt?: string;
  createdAt: string;
  lines: { slug: string; name: string; quantity: number; unitCost: number }[];
}

/* -------------------------------------------------------------------------- */
/*  CMS                                                                        */
/* -------------------------------------------------------------------------- */

export interface HomepageSection {
  id: string;
  label: string;
  /** Matches the component rendered on the homepage. */
  component: string;
  enabled: boolean;
  position: number;
}

export interface PromoBannerContent {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
}

export interface StaticPageContent {
  slug: string;
  title: string;
  updatedAt: string;
  published: boolean;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  position: number;
  published: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Settings                                                                   */
/* -------------------------------------------------------------------------- */

export interface StoreSettings {
  storeName: string;
  legalName: string;
  supportEmail: string;
  contactEmail: string;
  phone: string;
  addressLine: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  defaultTaxRate: number;
  pricesIncludeTax: boolean;
  weightUnit: "kg" | "lb";
  notifyOnNewOrder: boolean;
  notifyOnLowStock: boolean;
  lowStockThreshold: number;
  seoTitleTemplate: string;
  seoDescription: string;
  maintenanceMode: boolean;
  backupFrequency: "hourly" | "daily" | "weekly";
  lastBackupAt?: string;
}

/* -------------------------------------------------------------------------- */

interface State {
  categories: Map<string, AdminCategory>;
  brands: Map<string, AdminBrand>;
  warehouses: Map<string, Warehouse>;
  movements: StockMovement[];
  purchaseOrders: Map<string, PurchaseOrder>;
  homepageSections: HomepageSection[];
  banners: Map<string, PromoBannerContent>;
  staticPages: Map<string, StaticPageContent>;
  faqs: Map<string, FaqEntry>;
  settings: StoreSettings;
  /** Free-text notes staff leave on orders and customers. */
  notes: { id: string; scope: "order" | "customer"; refId: string; body: string; internal: boolean; by: string; at: string }[];
  seeded: boolean;
}

const globalForAdmin = globalThis as unknown as { __samruxAdminStores?: State };

function seedState(): State {
  const warehouses: Warehouse[] = [
    { id: "wh-main", name: "Rotterdam Main", code: "RTM", city: "Rotterdam", country: "NL", active: true },
    { id: "wh-us", name: "Newark East", code: "EWR", city: "Newark", country: "US", active: true },
    { id: "wh-uk", name: "Manchester Overflow", code: "MAN", city: "Manchester", country: "GB", active: false },
  ];

  return {
    categories: new Map(
      seedCategories.map((category, index) => [
        category.slug,
        { ...category, featured: index < 4, position: index },
      ]),
    ),
    brands: new Map(),
    warehouses: new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])),
    movements: [],
    purchaseOrders: new Map(),
    homepageSections: [
      { id: "hero", label: "Hero banner", component: "Hero", enabled: true, position: 0 },
      { id: "promo", label: "Promotional banner", component: "PromoBanner", enabled: true, position: 1 },
      { id: "marquee", label: "Department marquee", component: "Marquee", enabled: true, position: 2 },
      { id: "deals", label: "Today's deals", component: "ProductSection", enabled: true, position: 3 },
      { id: "trending", label: "Trending products", component: "ProductSection", enabled: true, position: 4 },
      { id: "best-sellers", label: "Best sellers", component: "ProductSection", enabled: true, position: 5 },
      { id: "flash", label: "Flash deals", component: "FlashDeals", enabled: true, position: 6 },
      { id: "recommended", label: "Recommended", component: "ProductSection", enabled: true, position: 7 },
      { id: "new", label: "New arrivals", component: "ProductSection", enabled: true, position: 8 },
      { id: "featured", label: "Featured products", component: "ProductSection", enabled: true, position: 9 },
      { id: "recent", label: "Recently viewed", component: "HomeRecentlyViewed", enabled: true, position: 10 },
      { id: "bundle", label: "Frequently bought together", component: "BundleTeaser", enabled: true, position: 11 },
      { id: "brands", label: "Shop by brand", component: "BrandShowcase", enabled: true, position: 12 },
      { id: "categories", label: "Featured categories", component: "CategoryShowcase", enabled: true, position: 13 },
      { id: "values", label: "Service promises", component: "ValueProps", enabled: true, position: 14 },
      { id: "testimonials", label: "Customer reviews", component: "Testimonials", enabled: true, position: 15 },
      { id: "newsletter", label: "Newsletter", component: "Newsletter", enabled: true, position: 16 },
    ],
    banners: new Map([
      [
        "members-week",
        {
          id: "members-week",
          eyebrow: "Members' week",
          headline: "Up to 40% off across every department",
          body: "Reductions measured against what we charged last month — never an invented list price.",
          ctaLabel: "Shop the deals",
          ctaHref: "/deals",
          active: true,
        },
      ],
    ]),
    staticPages: new Map(
      [
        { slug: "about", title: "About" },
        { slug: "contact", title: "Contact" },
        { slug: "help", title: "Help centre" },
        { slug: "returns", title: "Returns policy" },
        { slug: "warranty", title: "Warranty" },
        { slug: "privacy", title: "Privacy policy" },
        { slug: "terms", title: "Terms & conditions" },
      ].map((page) => [
        page.slug,
        { ...page, updatedAt: new Date().toISOString(), published: true },
      ]),
    ),
    faqs: new Map(
      [
        { question: "How fast do orders ship?", answer: "Within 48 hours, Monday to Friday." },
        { question: "What is the return policy?", answer: "Thirty days from delivery, unused and boxed." },
        { question: "How do warranty claims work?", answer: "We handle them ourselves, not the manufacturer." },
        { question: "Do you ship internationally?", answer: "Yes — Europe and rest of world, tracked." },
      ].map((entry, index) => [
        `faq-${index}`,
        { id: `faq-${index}`, ...entry, position: index, published: true },
      ]),
    ),
    settings: {
      storeName: storeConfig.tradingName,
      legalName: storeConfig.legalName,
      supportEmail: storeConfig.supportEmail,
      contactEmail: storeConfig.contactEmail,
      phone: storeConfig.phone,
      addressLine: storeAddressLine,
      currency: currencyConfig.code,
      currencySymbol: currencyConfig.symbol,
      freeShippingThreshold: siteConfig.freeShippingThreshold,
      defaultTaxRate: 0.08,
      pricesIncludeTax: false,
      weightUnit: "lb",
      notifyOnNewOrder: true,
      notifyOnLowStock: true,
      lowStockThreshold: 10,
      seoTitleTemplate: `%s — ${storeConfig.tradingName}`,
      seoDescription: siteConfig.description,
      maintenanceMode: false,
      backupFrequency: "daily",
    },
    notes: [],
    seeded: false,
  };
}

function state(): State {
  if (!globalForAdmin.__samruxAdminStores) {
    globalForAdmin.__samruxAdminStores = seedState();
  }
  return globalForAdmin.__samruxAdminStores;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* -------------------------------------------------------------------------- */

export const categoryStore = {
  list(): AdminCategory[] {
    return [...state().categories.values()].sort((a, b) => a.position - b.position);
  },
  find(slug: string) {
    return state().categories.get(slug);
  },
  upsert(input: Partial<AdminCategory> & { slug?: string; name: string }) {
    const slug = input.slug || slugify(input.name);
    const existing = state().categories.get(slug);

    const record: AdminCategory = {
      slug,
      name: input.name,
      tagline: input.tagline ?? existing?.tagline ?? "",
      description: input.description ?? existing?.description ?? "",
      icon: input.icon ?? existing?.icon ?? "Package",
      gradient: input.gradient ?? existing?.gradient ?? "from-slate-600 to-slate-800",
      subcategories: input.subcategories ?? existing?.subcategories ?? [],
      sourceUrl: input.sourceUrl ?? existing?.sourceUrl ?? "",
      parentSlug: input.parentSlug ?? existing?.parentSlug,
      featured: input.featured ?? existing?.featured ?? false,
      imageUrl: input.imageUrl ?? existing?.imageUrl,
      seoTitle: input.seoTitle ?? existing?.seoTitle,
      seoDescription: input.seoDescription ?? existing?.seoDescription,
      position: input.position ?? existing?.position ?? state().categories.size,
    };

    state().categories.set(slug, record);
    return record;
  },
  remove(slug: string) {
    // Children are promoted to top level rather than orphaned.
    for (const category of state().categories.values()) {
      if (category.parentSlug === slug) {
        state().categories.set(category.slug, { ...category, parentSlug: undefined });
      }
    }
    state().categories.delete(slug);
  },
};

export const brandStore = {
  list(): AdminBrand[] {
    return [...state().brands.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
  find(id: string) {
    return state().brands.get(id);
  },
  findBySlug(slug: string) {
    return [...state().brands.values()].find((brand) => brand.slug === slug);
  },
  upsert(input: Partial<AdminBrand> & { name: string }) {
    const id = input.id ?? randomUUID();
    const existing = state().brands.get(id);
    const record: AdminBrand = {
      id,
      name: input.name,
      slug: input.slug ?? existing?.slug ?? slugify(input.name),
      description: input.description ?? existing?.description ?? "",
      logoUrl: input.logoUrl ?? existing?.logoUrl,
      bannerUrl: input.bannerUrl ?? existing?.bannerUrl,
      featured: input.featured ?? existing?.featured ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    state().brands.set(id, record);
    return record;
  },
  remove(id: string) {
    state().brands.delete(id);
  },
};

export const warehouseStore = {
  list() {
    return [...state().warehouses.values()];
  },
  find(id: string) {
    return state().warehouses.get(id);
  },
  upsert(input: Partial<Warehouse> & { name: string; code: string }) {
    const id = input.id ?? randomUUID();
    const existing = state().warehouses.get(id);
    const record: Warehouse = {
      id,
      name: input.name,
      code: input.code.toUpperCase(),
      city: input.city ?? existing?.city ?? "",
      country: input.country ?? existing?.country ?? "",
      active: input.active ?? existing?.active ?? true,
    };
    state().warehouses.set(id, record);
    return record;
  },
};

export const stockStore = {
  movements(slug?: string) {
    const all = [...state().movements].sort((a, b) => b.at.localeCompare(a.at));
    return slug ? all.filter((movement) => movement.slug === slug) : all;
  },
  adjust(input: Omit<StockMovement, "id" | "at">) {
    const record: StockMovement = { ...input, id: randomUUID(), at: new Date().toISOString() };
    state().movements.unshift(record);
    return record;
  },
  /** Net adjustment applied to a product across every warehouse. */
  netFor(slug: string) {
    return state()
      .movements.filter((movement) => movement.slug === slug)
      .reduce((total, movement) => total + movement.delta, 0);
  },
};

export const purchaseOrderStore = {
  list() {
    return [...state().purchaseOrders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  find(id: string) {
    return state().purchaseOrders.get(id);
  },
  create(input: Omit<PurchaseOrder, "id" | "reference" | "createdAt">) {
    const id = randomUUID();
    const record: PurchaseOrder = {
      ...input,
      id,
      reference: `PO-${new Date().getFullYear()}-${String(state().purchaseOrders.size + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
    };
    state().purchaseOrders.set(id, record);
    return record;
  },
  setStatus(id: string, status: PurchaseOrder["status"]) {
    const existing = state().purchaseOrders.get(id);
    if (!existing) return undefined;
    const next = { ...existing, status };
    state().purchaseOrders.set(id, next);
    return next;
  },
};

export const contentStore = {
  sections() {
    return [...state().homepageSections].sort((a, b) => a.position - b.position);
  },
  toggleSection(id: string, enabled: boolean) {
    const index = state().homepageSections.findIndex((section) => section.id === id);
    if (index >= 0) state().homepageSections[index] = { ...state().homepageSections[index], enabled };
  },
  banners() {
    return [...state().banners.values()];
  },
  saveBanner(input: PromoBannerContent) {
    state().banners.set(input.id, input);
    return input;
  },
  staticPages() {
    return [...state().staticPages.values()];
  },
  faqs() {
    return [...state().faqs.values()].sort((a, b) => a.position - b.position);
  },
  saveFaq(input: Partial<FaqEntry> & { question: string; answer: string }) {
    const id = input.id ?? randomUUID();
    const record: FaqEntry = {
      id,
      question: input.question,
      answer: input.answer,
      position: input.position ?? state().faqs.size,
      published: input.published ?? true,
    };
    state().faqs.set(id, record);
    return record;
  },
  removeFaq(id: string) {
    state().faqs.delete(id);
  },
};

export const settingsStore = {
  get(): StoreSettings {
    return state().settings;
  },
  update(patch: Partial<StoreSettings>) {
    state().settings = { ...state().settings, ...patch };
    return state().settings;
  },
};

export const noteStore = {
  for(scope: "order" | "customer", refId: string) {
    return state()
      .notes.filter((note) => note.scope === scope && note.refId === refId)
      .sort((a, b) => b.at.localeCompare(a.at));
  },
  add(input: { scope: "order" | "customer"; refId: string; body: string; internal: boolean; by: string }) {
    const record = { ...input, id: randomUUID(), at: new Date().toISOString() };
    state().notes.unshift(record);
    return record;
  },
};
