import Link from "next/link";
import { BadgeCheck, MessageSquare, Package, Star, Truck } from "lucide-react";

import { AskSellerForm } from "@/components/marketplace/ask-seller-form";
import { Button } from "@/components/ui/button";
import type { PublicSeller } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

/**
 * "Sold by" panel on a product page.
 *
 * Carries the seller's identity, their fulfilment promise, answered public
 * questions about this product, and a form to ask a new one.
 */
export function SellerBlock({
  seller,
  csrfToken,
  productSlug,
  signedIn,
  questions,
}: {
  seller: PublicSeller;
  csrfToken: string;
  productSlug: string;
  signedIn: boolean;
  questions: { id: string; subject: string; answer: string }[];
}) {
  const initials = seller.storeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-sm font-semibold text-white",
            seller.gradient,
          )}
        >
          {seller.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- seller-supplied logo
            <img src={seller.logoUrl} alt="" className="size-full rounded-lg object-cover" />
          ) : (
            initials
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <Link href={`/sellers/${seller.slug}`} className="truncate hover:underline">
              {seller.storeName}
            </Link>
            {seller.verified ? (
              <BadgeCheck
                className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-label="Verified seller"
              />
            ) : null}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {seller.rating > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="size-3 fill-gold text-gold" aria-hidden />
                {seller.rating.toFixed(1)} ({seller.reviewCount.toLocaleString("en-US")})
              </span>
            ) : (
              <span>New store</span>
            )}
            <span className="flex items-center gap-1">
              <Truck className="size-3" aria-hidden />
              Dispatched in {seller.dispatchHours}h
            </span>
            <span className="flex items-center gap-1">
              <Package className="size-3" aria-hidden />
              {seller.city}, {seller.state}
            </span>
          </p>
        </div>

        <Button size="sm" variant="outline" render={<Link href={`/sellers/${seller.slug}`} />}>
          Visit store
        </Button>
      </div>

      {questions.length > 0 ? (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="size-3.5" aria-hidden />
            Questions answered by this seller
          </h3>
          <ul className="mt-3 space-y-3">
            {questions.slice(0, 4).map((question) => (
              <li key={question.id} className="rounded-xl border p-3">
                <p className="text-sm font-medium text-foreground">{question.subject}</p>
                <p className="mt-1 text-sm">{question.answer}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-medium text-foreground">Ask {seller.storeName} a question</h3>
        <div className="mt-3">
          <AskSellerForm
            csrfToken={csrfToken}
            sellerId={seller.id}
            sellerName={seller.storeName}
            signedIn={signedIn}
            productSlug={productSlug}
            compact
          />
        </div>
      </div>
    </div>
  );
}
