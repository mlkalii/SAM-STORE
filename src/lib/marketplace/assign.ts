import "server-only";

import { HOUSE_SELLER_ID, isFullyVerified, sellerStore } from "@/lib/marketplace/seller-store";
import type { Seller } from "@/lib/marketplace/types";
import type { Product } from "@/types";

/**
 * Which seller a catalogue product belongs to.
 *
 * The bundled catalogue predates the marketplace, so its 780 products carry no
 * seller. Rather than rewriting a 6.8 MB JSON file — and rather than pretending
 * every product is the house store's — the department a product sits in decides
 * which vendor lists it, and a stable hash of the slug picks between the
 * vendors that cover that department.
 *
 * The mapping is deterministic: the same product always resolves to the same
 * seller, across restarts and across server instances. Products created through
 * the seller dashboard carry a real `sellerId` and are never touched here.
 */

/** Stable 32-bit hash. Same input, same output, forever. */
function hash(value: string) {
  let h = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    h ^= value.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Assignment {
  byDepartment: Map<string, Seller[]>;
  house: Seller | undefined;
  signature: string;
}

let cached: Assignment | null = null;

function assignment(): Assignment {
  const sellers = sellerStore.approved();

  // Rebuild when the approved set changes — a newly approved vendor should pick
  // up its share of the catalogue without a restart.
  const signature = sellers
    .map((seller) => `${seller.id}:${seller.departments.join("|")}`)
    .sort()
    .join(",");

  if (cached && cached.signature === signature) return cached;

  const byDepartment = new Map<string, Seller[]>();
  for (const seller of sellers) {
    if (seller.id === HOUSE_SELLER_ID) continue;
    for (const department of seller.departments) {
      const list = byDepartment.get(department) ?? [];
      list.push(seller);
      byDepartment.set(department, list);
    }
  }

  // Sorting keeps the order independent of insertion order, so the hash lands
  // on the same vendor every time.
  for (const list of byDepartment.values()) list.sort((a, b) => a.id.localeCompare(b.id));

  cached = {
    byDepartment,
    house: sellers.find((seller) => seller.id === HOUSE_SELLER_ID),
    signature,
  };
  return cached;
}

/**
 * Roughly a third of each department stays with the house store, so SAMRUX
 * Official always has stock and a brand-new marketplace never looks empty.
 */
const HOUSE_SHARE = 3;

export function sellerIdForProduct(product: Pick<Product, "slug" | "category">): string {
  const { byDepartment, house } = assignment();

  const vendors = byDepartment.get(product.category);
  if (!vendors || vendors.length === 0) return house?.id ?? HOUSE_SELLER_ID;

  const seed = hash(product.slug);
  if (seed % HOUSE_SHARE === 0) return house?.id ?? HOUSE_SELLER_ID;

  return vendors[seed % vendors.length].id;
}

/**
 * Stamps `sellerId` onto every product that lacks one.
 *
 * Called once per request inside the catalogue loader, so the rest of the app
 * can treat `product.sellerId` as always present.
 */
export function withSellers(products: Product[]): Product[] {
  // Resolved once per request and reused, rather than looked up per product.
  const byId = new Map(sellerStore.all().map((seller) => [seller.id, seller]));

  return products.map((product) => {
    const sellerId = product.sellerId ?? sellerIdForProduct(product);
    const seller = byId.get(sellerId);

    return {
      ...product,
      sellerId,
      // Denormalised so a product card can credit the vendor without a lookup.
      sellerName: seller?.storeName,
      sellerSlug: seller?.slug,
      sellerVerified: seller ? isFullyVerified(seller) : false,
    };
  });
}

/** Departments a seller actually has stock in — used to refresh the profile. */
export function departmentsForSeller(products: Product[], sellerId: string) {
  return [
    ...new Set(
      products.filter((product) => product.sellerId === sellerId).map((product) => product.category),
    ),
  ];
}
