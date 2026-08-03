import type { Metadata } from "next";
import { Tag } from "lucide-react";

import { EmptyState, Panel } from "@/components/account/account-ui";
import { CopyCode } from "@/components/account/copy-code";
import { requireUser } from "@/lib/auth";
import { promotionStore } from "@/lib/commerce/promotions";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Coupons", robots: { index: false } };

export default async function CouponsPage() {
  await requireUser();

  const coupons = promotionStore
    .all()
    .filter((promotion) => promotion.code && promotion.active);
  const automatic = promotionStore.automatic();

  function describe(value: number, kind: string) {
    if (kind === "percentage") return `${value}% off`;
    if (kind === "fixed") return `${formatPrice(value)} off`;
    if (kind === "free-shipping") return "Free shipping";
    if (kind === "bogo") return "Buy one get one";
    return `${value}% off`;
  }

  return (
    <>
      <Panel
        title="Your coupons"
        description="Enter any of these at checkout. Codes are validated against your basket before they apply."
      >
        {coupons.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No coupons available"
            description="Offers appear here as they are released. Subscribers hear first."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  {describe(coupon.value, coupon.kind)}
                </p>
                <p className="mt-2 font-display text-xl tracking-tight">{coupon.label}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{coupon.description}</p>

                {typeof coupon.minSubtotal === "number" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Minimum spend {formatPrice(coupon.minSubtotal)}
                  </p>
                ) : null}

                <CopyCode code={coupon.code!} className="mt-4" />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Applied automatically"
        description="These need no code — they apply at checkout when the basket qualifies."
      >
        <ul className="space-y-3">
          {automatic.map((promotion) => (
            <li key={promotion.id} className="flex items-start gap-3 rounded-xl border p-4">
              <Tag className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <div>
                <p className="text-sm font-medium">{promotion.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{promotion.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
