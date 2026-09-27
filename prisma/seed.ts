/**
 * Database seed.
 *
 * Loads the same data the in-memory stores boot with, so switching
 * `DATA_BACKEND` to "prisma" lands on an identical storefront: the full
 * catalogue, the staff accounts and gift cards.
 *
 * Run with:  npm run db:seed          (after `npm run db:migrate`)
 * Idempotent: everything is upserted by its natural key, so re-running
 * refreshes rather than duplicates.
 */
import { readFileSync } from "node:fs";
import { scrypt as scryptCallback, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — see .env.example");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/** Same format as src/lib/auth/password.ts — the app can verify these. */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

interface CatalogImage {
  id: string;
  view: string;
  alt: string;
  src: string;
  thumbnail: string;
  credit: string;
  width: number;
  height: number;
}

interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  specifications: { label: string; value: string }[];
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stockCount: number;
  category: string;
  subcategory: string;
  images: CatalogImage[];
  variants: { id: string; label: string; hex?: string }[];
  tags: string[];
  releasedAt: string;
  gradient: string;
  dispatchHours: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
}

async function seedStaff() {
  const password = await hashPassword(process.env.ADMIN_SEED_PASSWORD ?? "Samrux-Admin!2026");
  const staff = [
    { email: "owner@samrux.com", name: "Nadia Owner", role: "super-admin" },
    { email: "admin@samrux.com", name: "Elias Ward", role: "admin" },
    { email: "manager@samrux.com", name: "June Park", role: "manager" },
    { email: "staff@samrux.com", name: "Theo Sanders", role: "staff" },
    { email: "support@samrux.com", name: "Priya Anand", role: "support" },
  ];

  for (const member of staff) {
    await prisma.staffUser.upsert({
      where: { email: member.email },
      create: { ...member, passwordHash: password },
      update: { name: member.name, role: member.role },
    });
  }
  console.log(`staff: ${staff.length}`);
}

async function seedCatalog() {
  const file = path.join(process.cwd(), "src/data/catalog.json");
  const catalog = JSON.parse(readFileSync(file, "utf8")) as { products: CatalogProduct[] };

  let count = 0;
  for (const product of catalog.products) {
    const { images, variants, specifications, ...rest } = product;

    await prisma.$transaction(async (tx) => {
      const row = await tx.product.upsert({
        where: { slug: rest.slug },
        create: {
          slug: rest.slug,
          name: rest.name,
          brand: rest.brand,
          sku: rest.sku,
          shortDescription: rest.shortDescription,
          longDescription: rest.longDescription,
          features: rest.features,
          specifications: specifications as object[],
          price: rest.price,
          compareAtPrice: rest.compareAtPrice ?? null,
          rating: rest.rating,
          reviewCount: rest.reviewCount,
          stockCount: rest.stockCount,
          category: rest.category,
          subcategory: rest.subcategory,
          tags: rest.tags,
          releasedAt: new Date(rest.releasedAt),
          gradient: rest.gradient,
          dispatchHours: rest.dispatchHours,
          featured: rest.featured,
          bestSeller: rest.bestSeller,
          newArrival: rest.newArrival,
          trending: rest.trending,
        },
        update: {
          price: rest.price,
          compareAtPrice: rest.compareAtPrice ?? null,
          stockCount: rest.stockCount,
        },
      });

      // Images and variants are replace-all on reseed.
      await tx.productImage.deleteMany({ where: { productId: row.id } });
      await tx.productImage.createMany({
        data: images.map((image, index) => ({
          productId: row.id,
          view: image.view,
          alt: image.alt,
          src: image.src,
          thumbnail: image.thumbnail,
          credit: image.credit,
          width: image.width,
          height: image.height,
          position: index,
        })),
      });

      await tx.productVariant.deleteMany({ where: { productId: row.id } });
      await tx.productVariant.createMany({
        data: variants.map((variant, index) => ({
          productId: row.id,
          key: variant.id,
          label: variant.label,
          hex: variant.hex ?? null,
          position: index,
        })),
      });
    });

    count += 1;
    if (count % 100 === 0) console.log(`catalog: ${count}…`);
  }
  console.log(`catalog: ${count} products`);
}

async function seedGiftCards() {
  const cards = [
    { code: "SAMRUX-GIFT-50", initialBalance: 5000, balance: 5000 },
    { code: "SAMRUX-GIFT-100", initialBalance: 10000, balance: 10000 },
    { code: "SAMRUX-GIFT-250", initialBalance: 25000, balance: 25000 },
  ];
  for (const card of cards) {
    await prisma.giftCard.upsert({ where: { code: card.code }, create: card, update: {} });
  }
  console.log(`gift cards: ${cards.length}`);
}

async function main() {
  await seedStaff();
  await seedCatalog();
  await seedGiftCards();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
