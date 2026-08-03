import { NextResponse } from "next/server";

import { priceCart } from "@/lib/commerce/pricing";
import { methodsForCountry } from "@/lib/commerce/shipping";
import { availablePaymentMethods } from "@/lib/payments/registry";
import type { CartInput } from "@/lib/commerce/types";

/**
 * Live checkout quote.
 *
 * The browser posts what is in the cart and where it is going; the server
 * returns the authoritative totals, the methods valid for that destination and
 * any codes that did not apply. Prices are always recomputed from the catalogue,
 * so this endpoint is safe to call with whatever the client happens to hold.
 */
export const dynamic = "force-dynamic";

interface QuoteBody {
  items?: CartInput[];
  couponCodes?: string[];
  giftCardCodes?: string[];
  shippingMethodId?: string;
  country?: string;
}

function sanitiseItems(input: unknown): CartInput[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const item = entry as Partial<CartInput>;
    if (typeof item.slug !== "string" || typeof item.variantId !== "string") return [];
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return [];
    // Hard ceilings so a crafted payload cannot ask us to price 10,000 lines.
    return [{ slug: item.slug, variantId: item.variantId, quantity: Math.min(99, Math.floor(quantity)) }];
  }).slice(0, 60);
}

function sanitiseCodes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((code): code is string => typeof code === "string")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10);
}

export async function POST(request: Request) {
  let body: QuoteBody;
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const country = (typeof body.country === "string" ? body.country : "US").toUpperCase().slice(0, 2);
  const methods = methodsForCountry(country);

  // Fall back to the cheapest valid method when the chosen one is not offered
  // for this destination — changing country must never leave checkout stuck.
  const requested = body.shippingMethodId;
  const shippingMethodId = methods.some((method) => method.id === requested)
    ? requested
    : methods[0]?.id;

  const quote = await priceCart({
    items: sanitiseItems(body.items),
    couponCodes: sanitiseCodes(body.couponCodes),
    giftCardCodes: sanitiseCodes(body.giftCardCodes),
    shippingMethodId,
    country,
  });

  return NextResponse.json(
    {
      quote,
      shippingMethods: methods,
      paymentMethods: availablePaymentMethods(country),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
