import "server-only";

import { DATA_BACKEND } from "@/config/backend";
import { getProducts } from "@/data/products";
import { advanceOrder, placeOrder } from "@/lib/commerce/orders";
import { priceCart } from "@/lib/commerce/pricing";
import { withEmailSuppressed } from "@/lib/email/send";
import type { User } from "@/lib/auth/user-store";

/**
 * Demo order history.
 *
 * A brand-new account has nothing to look at, which makes the dashboard
 * impossible to evaluate. This places two real orders through the same pipeline
 * a checkout uses — priced by `priceCart`, recorded by `placeOrder`, then walked
 * along the fulfilment path — so the seeded data is indistinguishable in shape
 * from a genuine order.
 *
 * Two rules keep that from reaching a real customer:
 *
 *   - It only runs on the in-memory demo backend. Once `DATA_BACKEND=prisma`
 *     is set the deployment is a real shop, and inventing delivered orders
 *     against a real person's account is not a demo any more.
 *   - Delivery is suppressed. Walking an order to `delivered` fires the
 *     confirmation, dispatch and delivery emails; sending those to someone who
 *     has just signed up would tell them goods they never bought are on the
 *     way, which reads as a compromised account and earns spam reports.
 *
 * Delete this module once real checkouts exist; nothing else imports it.
 */
export async function seedDemoOrders(user: User) {
  if (DATA_BACKEND === "prisma") return;

  const products = await getProducts();
  if (products.length === 0) return;

  const pick = (offset: number) => products[(offset * 137) % products.length];

  const address = {
    recipient: user.name,
    line1: "14 Harbour Point",
    city: "Rotterdam",
    postcode: "3011 AA",
    country: "US",
  };

  const build = async (offsets: number[], methodId: string) => {
    const items = offsets.map((offset) => ({
      slug: pick(offset).slug,
      variantId: pick(offset).variants[0].id,
      quantity: 1,
    }));

    const quote = await priceCart({ items, shippingMethodId: methodId, country: "US" });
    if (quote.lines.length === 0 || !quote.deliveryEstimate) return undefined;

    return placeOrder({
      userId: user.id,
      email: user.email,
      customerName: user.name,
      lines: quote.lines,
      totals: quote.totals,
      shippingAddress: address,
      billingAddress: address,
      shippingMethodId: quote.shippingMethodId!,
      shippingMethodLabel: quote.shippingMethodLabel!,
      deliveryEstimate: quote.deliveryEstimate,
      payment: {
        providerId: "stripe",
        providerLabel: "Card",
        reference: `pi_seed_${user.id.slice(0, 8)}`,
        status: "captured",
        amount: quote.totals.grandTotal,
      },
      couponCodes: [],
      giftCardCodes: [],
    });
  };

  // One in transit, one completed — so both dashboard sections have content.
  await withEmailSuppressed(async () => {
    const shipped = await build([3, 47], "standard-domestic");
    if (shipped) {
      await advanceOrder(shipped.id, "packed");
      await advanceOrder(shipped.id, "shipped");
    }

    const delivered = await build([12, 88, 210], "express-domestic");
    if (delivered) {
      await advanceOrder(delivered.id, "packed");
      await advanceOrder(delivered.id, "shipped");
      await advanceOrder(delivered.id, "out-for-delivery");
      await advanceOrder(delivered.id, "delivered");
    }
  });
}
