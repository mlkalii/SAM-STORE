import "server-only";

import { logger } from "@/lib/observability/logger";

import { getProducts } from "@/data/products";
import { orderStore } from "@/lib/commerce/orders";
import { withEmailSuppressed } from "@/lib/email/send";
import { userStore } from "@/lib/auth/user-store";
import { followStore } from "@/lib/marketplace/follows";
import { messaging } from "@/lib/marketplace/messaging";
import { payoutStore } from "@/lib/marketplace/payouts";
import { reviewStore, recomputeSellerRating } from "@/lib/marketplace/reviews";
import { HOUSE_SELLER_ID, sellerStore } from "@/lib/marketplace/seller-store";
import { departmentsForSeller } from "@/lib/marketplace/assign";

/**
 * Marketplace demo activity.
 *
 * The seeded sellers exist from the first request, but a marketplace with no
 * reviews, no questions and no withdrawals is impossible to evaluate. This adds
 * a realistic sample of each through the same stores the application uses — the
 * rows are indistinguishable in shape from ones a customer produced.
 *
 * Runs once per process, guarded on `globalThis`, and never touches data
 * created by a real user. Delete this file once the marketplace has genuine
 * activity; nothing outside `lib/marketplace` imports it.
 */

const globalForDemo = globalThis as unknown as { __samruxMarketplaceDemo?: Promise<void> };

const REVIEWS: {
  seller: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  reply?: string;
}[] = [
  {
    seller: "seller-vantage",
    author: "Priya Deshmukh",
    rating: 5,
    title: "Bench-tested exactly as promised",
    body: "The unit arrived with a printed test sheet in the box. Two years of buying audio online and this is the first seller who has shown their working.",
    reply: "Thanks Priya — every unit gets bench-checked before it ships. Enjoy it.",
  },
  {
    seller: "seller-vantage",
    author: "Daniel Okafor",
    rating: 4,
    title: "Fast, though packaging was tight",
    body: "Shipped the same day and arrived a day early. The box was a snug fit and one corner was dented, though the product itself was perfect.",
  },
  {
    seller: "seller-halcyon",
    author: "Marta Kowalczyk",
    rating: 5,
    title: "They actually stock the spare parts",
    body: "Bought a pan two years ago from elsewhere; ordered the replacement handle here and it fitted. That is the entire reason I will keep buying from them.",
    reply: "That is exactly what we set the store up to do. Glad it fitted.",
  },
  {
    seller: "seller-halcyon",
    author: "Tom Reilly",
    rating: 5,
    title: "Honest descriptions",
    body: "The listing said the finish would patina and it has. No surprises, which is rarer than it should be.",
  },
  {
    seller: "seller-northline",
    author: "Ana Villalobos",
    rating: 4,
    title: "Trade quality, sensible prices",
    body: "Ordered a torque wrench and a set of sockets. Both are what a working mechanic would buy rather than what a catalogue photographs well.",
  },
  {
    seller: "seller-northline",
    author: "Kwame Boateng",
    rating: 5,
    title: "Answered a fitting question in an hour",
    body: "Asked whether a part suited my model before ordering and got a straight answer, including the one caveat. Ordered on the strength of it.",
    reply: "Any time — always better to check first than to process a return.",
  },
  {
    seller: "seller-meridian",
    author: "Sofia Lindgren",
    rating: 5,
    title: "Certificates on file, as advertised",
    body: "Asked for the certificate of analysis on a serum and had it the same day. Full ingredient disclosure is not marketing here, it is just how they operate.",
  },
  {
    seller: "seller-fieldcrest",
    author: "Ben Whitcombe",
    rating: 4,
    title: "Field-tested claims hold up",
    body: "Took the shell up above the treeline in weather it was rated for and it did the job. They publish what failed in testing, which builds a lot of trust.",
  },
  {
    seller: "seller-lumen",
    author: "Grace Adeyemi",
    rating: 5,
    title: "Age guidance written by someone who knows",
    body: "The safety notes are specific rather than boilerplate. As a first-time parent that made choosing far less stressful.",
    reply: "Our guidance is written by a paediatric nurse — thank you for noticing.",
  },
];

const QUESTIONS: { seller: string; customer: string; subject: string; body: string; answer: string }[] = [
  {
    seller: "seller-vantage",
    customer: "Imogen Hart",
    subject: "Does this work with a USB-C dock?",
    body: "I run everything through a single dock. Will this negotiate the full bandwidth or drop to a lower mode?",
    answer:
      "It negotiates the full bandwidth over a certified USB-C cable. If your dock is USB 3.0 rather than 3.2 you will see the lower mode — check the dock's spec rather than the cable.",
  },
  {
    seller: "seller-halcyon",
    customer: "Theo Lindqvist",
    subject: "Is the handle replaceable?",
    body: "Before I buy — can the handle be replaced separately if it ever wears?",
    answer:
      "Yes. The handle is a separate part and we stock it. Send us the order reference any time and we will get one out.",
  },
  {
    seller: "seller-northline",
    customer: "Amara Osei",
    subject: "Shipping to Alaska?",
    body: "Do you ship to Alaska, and does it change the delivery estimate?",
    answer:
      "We ship to all fifty states. Alaska usually adds two working days to the standard estimate; express is unaffected.",
  },
];

async function build(): Promise<void> {
  // Never seed over a marketplace that already has activity.
  if (reviewStore.all().length > 0) return;

  const products = await getProducts();

  // Refresh each seller's departments from what they actually list, so the
  // storefront collections and the directory chips are accurate.
  for (const seller of sellerStore.approved()) {
    if (seller.id === HOUSE_SELLER_ID) continue;
    const departments = departmentsForSeller(products, seller.id);
    if (departments.length > 0) sellerStore.setDepartments(seller.id, departments);
  }

  const users = await Promise.all(
    [...new Set([...REVIEWS.map((r) => r.author), ...QUESTIONS.map((q) => q.customer)])].map(
      async (name) => {
        const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
        const existing = await userStore.findByEmail(email);
        if (existing) return existing;
        return userStore.create({
          email,
          name,
          // Demo accounts are not sign-in-able; the password is never printed.
          password: `Demo-${crypto.randomUUID()}`,
        });
      },
    ),
  );

  const byName = new Map(users.map((user) => [user.name, user]));

  // Store reviews, published so they are visible on the storefront.
  for (const entry of REVIEWS) {
    const user = byName.get(entry.author);
    if (!user) continue;

    const review = reviewStore.submit({
      target: "seller",
      targetId: entry.seller,
      sellerId: entry.seller,
      authorId: user.id,
      authorName: user.name,
      rating: entry.rating,
      title: entry.title,
      body: entry.body,
    });

    reviewStore.moderate(review.id, "published", { by: "Nadia Owner" });
    if (entry.reply) reviewStore.reply(review.id, entry.reply);
  }

  for (const seller of sellerStore.approved()) recomputeSellerRating(seller.id);

  // Public questions with answers, so a product page has something to show.
  for (const entry of QUESTIONS) {
    const user = byName.get(entry.customer);
    if (!user) continue;

    const theirs = products.filter((product) => product.sellerId === entry.seller);
    const product = theirs[0];

    const thread = messaging.start({
      kind: "question",
      subject: entry.subject,
      customerId: user.id,
      customerName: user.name,
      sellerId: entry.seller,
      productSlug: product?.slug,
      visibility: "public",
      body: entry.body,
    });

    const seller = sellerStore.find(entry.seller);
    messaging.reply({
      threadId: thread.id,
      authorRole: "seller",
      authorId: entry.seller,
      authorName: seller?.storeName ?? "Seller",
      body: entry.answer,
    });
  }

  // A few follows, so the counts are not all historical.
  for (const user of users.slice(0, 5)) {
    followStore.toggle("seller-vantage", user.id);
    followStore.toggle("seller-halcyon", user.id);
  }

  // One settled withdrawal and one waiting, so both admin states are reachable.
  const withOrders = new Set(
    orderStore.all().flatMap((order) => order.lines.map((line) => line.sellerId ?? HOUSE_SELLER_ID)),
  );

  for (const sellerId of [...withOrders].filter((id) => id !== HOUSE_SELLER_ID).slice(0, 2)) {
    const result = payoutStore.request(sellerId, 5000);
    if (result.payout && sellerId === [...withOrders][1]) {
      payoutStore.setStatus(result.payout.id, "paid", {
        by: "Nadia Owner",
        transactionRef: `0x${result.payout.id.replace(/\D/g, "").padEnd(12, "0").slice(0, 12)}`,
      });
    }
  }
}

/** Idempotent, and safe to call from several marketplace helpers at once. */
export function ensureMarketplaceDemoData(): Promise<void> {
  if (!globalForDemo.__samruxMarketplaceDemo) {
    // Same rule as the admin seed: fabricated recipients are never mailed,
    // however the seeded records are produced.
    globalForDemo.__samruxMarketplaceDemo = withEmailSuppressed(build).catch((error) => {
      logger.warn("marketplace.demo_seed_failed", { error: (error as Error).message });
    });
  }
  return globalForDemo.__samruxMarketplaceDemo;
}
