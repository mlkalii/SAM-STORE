import "server-only";

import { logger } from "@/lib/observability/logger";

import { getProducts } from "@/data/products";
import { withEmailSuppressed } from "@/lib/email/send";
import { advanceOrder, cancelOrder, placeOrder, requestRefund } from "@/lib/commerce/orders";
import { orderStore } from "@/lib/commerce/orders";
import { priceCart } from "@/lib/commerce/pricing";
import { userStore } from "@/lib/auth/user-store";

/**
 * Demo trading history for the admin panel.
 *
 * Without it a fresh boot shows an admin with no orders, no customers and empty
 * reports, which makes none of it reviewable. Every order here goes through the
 * same `priceCart` → `placeOrder` → `advanceOrder` pipeline a real checkout
 * uses, so the seeded rows are identical in shape to genuine ones — totals are
 * computed by the pricing engine, stock is committed, timelines are real.
 *
 * It runs once per process, guarded on `globalThis`, and never touches orders
 * placed by an actual customer. Point the stores at a database and delete this
 * file; nothing outside `lib/admin` imports it.
 */

const globalForDemo = globalThis as unknown as { __samruxAdminDemo?: Promise<void> };

interface DemoCustomer {
  name: string;
  email: string;
  city: string;
  postcode: string;
  country: string;
  line1: string;
}

const CUSTOMERS: DemoCustomer[] = [
  { name: "Imogen Hart", email: "imogen.hart@example.com", line1: "22 Wren Street", city: "Boston", postcode: "02116", country: "US" },
  { name: "Theo Lindqvist", email: "theo.lindqvist@example.com", line1: "8 Kungsgatan", city: "Stockholm", postcode: "111 43", country: "SE" },
  { name: "Amara Osei", email: "amara.osei@example.com", line1: "140 Rivington Road", city: "Manchester", postcode: "M1 4BT", country: "GB" },
  { name: "Rafael Duarte", email: "rafael.duarte@example.com", line1: "51 Rua das Flores", city: "Lisbon", postcode: "1100-062", country: "PT" },
  { name: "Sylvie Marchand", email: "sylvie.marchand@example.com", line1: "9 Rue Bellechasse", city: "Paris", postcode: "75007", country: "FR" },
  { name: "Noah Beckett", email: "noah.beckett@example.com", line1: "300 Alder Avenue", city: "Portland", postcode: "97205", country: "US" },
];

/**
 * How far each order sits along the fulfilment path, and what happened to it.
 * Spread deliberately so the dashboard pipeline, refunds panel and cancelled
 * count all have something in them.
 */
const SCRIPT: {
  customer: number;
  offsets: number[];
  method: string;
  daysAgo: number;
  advanceTo: "processing" | "packed" | "shipped" | "out-for-delivery" | "delivered";
  then?: "cancelled" | "refund";
}[] = [
  { customer: 0, offsets: [3, 47], method: "standard-domestic", daysAgo: 26, advanceTo: "delivered" },
  { customer: 0, offsets: [118], method: "express-domestic", daysAgo: 11, advanceTo: "delivered", then: "refund" },
  { customer: 1, offsets: [12, 88, 210], method: "standard-europe", daysAgo: 22, advanceTo: "delivered" },
  { customer: 1, offsets: [305], method: "standard-europe", daysAgo: 4, advanceTo: "shipped" },
  { customer: 2, offsets: [66, 401], method: "standard-europe", daysAgo: 18, advanceTo: "delivered" },
  { customer: 2, offsets: [512], method: "express-domestic", daysAgo: 2, advanceTo: "packed" },
  { customer: 3, offsets: [77, 155], method: "standard-international", daysAgo: 15, advanceTo: "out-for-delivery" },
  { customer: 3, offsets: [640], method: "standard-international", daysAgo: 9, advanceTo: "processing", then: "cancelled" },
  { customer: 4, offsets: [201, 333, 455], method: "standard-europe", daysAgo: 7, advanceTo: "shipped" },
  { customer: 5, offsets: [24], method: "express-domestic", daysAgo: 1, advanceTo: "processing" },
  { customer: 5, offsets: [96, 288], method: "standard-domestic", daysAgo: 13, advanceTo: "delivered" },
  { customer: 5, offsets: [700, 712], method: "standard-domestic", daysAgo: 29, advanceTo: "delivered" },
];

const FLOW = ["processing", "packed", "shipped", "out-for-delivery", "delivered"] as const;

async function build(): Promise<void> {
  // Never seed over a store that already has orders in it.
  if (orderStore.all().length > 0) return;

  const products = await getProducts();
  if (products.length === 0) return;

  const pick = (offset: number) => products[(offset * 137) % products.length];

  const users = await Promise.all(
    CUSTOMERS.map(async (customer) => {
      const existing = await userStore.findByEmail(customer.email);
      if (existing) return existing;
      return userStore.create({
        email: customer.email,
        name: customer.name,
        // Demo accounts are not meant to be signed into; the password is a
        // random string that is never printed anywhere.
        password: `Demo-${crypto.randomUUID()}`,
      });
    }),
  );

  for (const entry of SCRIPT) {
    const customer = CUSTOMERS[entry.customer];
    const user = users[entry.customer];
    if (!user) continue;

    const address = {
      recipient: customer.name,
      line1: customer.line1,
      city: customer.city,
      postcode: customer.postcode,
      country: customer.country,
    };

    const items = entry.offsets.map((offset) => ({
      slug: pick(offset).slug,
      variantId: pick(offset).variants[0].id,
      quantity: offset % 3 === 0 ? 2 : 1,
    }));

    const quote = await priceCart({
      items,
      shippingMethodId: entry.method,
      country: customer.country,
    });
    if (quote.lines.length === 0 || !quote.deliveryEstimate || !quote.shippingMethodId) continue;

    const order = await placeOrder({
      userId: user.id,
      email: user.email,
      customerName: customer.name,
      lines: quote.lines,
      totals: quote.totals,
      shippingAddress: address,
      billingAddress: address,
      shippingMethodId: quote.shippingMethodId,
      shippingMethodLabel: quote.shippingMethodLabel ?? "Standard",
      deliveryEstimate: quote.deliveryEstimate,
      payment: {
        providerId: entry.customer % 2 === 0 ? "stripe" : "paypal",
        providerLabel: entry.customer % 2 === 0 ? "Card" : "PayPal",
        reference: `pi_demo_${user.id.slice(0, 8)}_${entry.daysAgo}`,
        status: "captured",
        amount: quote.totals.grandTotal,
      },
      couponCodes: [],
      giftCardCodes: [],
    });

    // Backdate so the 30-day charts and "active customer" windows have shape.
    // This has to be written to the store *before* advancing: the lifecycle
    // functions build a new order object from what is stored, so holding on to
    // the original and saving it afterwards would discard every transition.
    const placedAt = new Date(Date.now() - entry.daysAgo * 86400000);
    orderStore.save({ ...order, placedAt: placedAt.toISOString() });

    const target = FLOW.indexOf(entry.advanceTo);
    for (let step = 1; step <= target; step += 1) {
      await advanceOrder(order.id, FLOW[step]);
    }

    if (entry.then === "cancelled") await cancelOrder(order.id, "Changed mind before dispatch");
    if (entry.then === "refund") await requestRefund(order.id);

    // Spread the timeline across the days since the order was placed, so a
    // delivered order does not show every step at the same instant.
    const current = orderStore.find(order.id);
    if (current) {
      orderStore.save({
        ...current,
        placedAt: placedAt.toISOString(),
        timeline: current.timeline.map((moment, index) => ({
          ...moment,
          at: new Date(placedAt.getTime() + index * 18 * 3600000).toISOString(),
        })),
      });
    }
  }
}

/** Idempotent, and safe to call from several admin helpers at once. */
export function ensureAdminDemoData(): Promise<void> {
  if (!globalForDemo.__samruxAdminDemo) {
    // Seeding replays the real order pipeline, which sends the real emails.
    // Suppress them: these recipients do not exist, and on a serverless host
    // this runs once per cold start.
    globalForDemo.__samruxAdminDemo = withEmailSuppressed(build).catch((error) => {
      logger.warn("admin.demo_seed_failed", { error: (error as Error).message });
    });
  }
  return globalForDemo.__samruxAdminDemo;
}
