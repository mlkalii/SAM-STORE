import type { Metadata } from "next";
import { Gift } from "lucide-react";

import { Panel } from "@/components/account/account-ui";
import { CopyCode } from "@/components/account/copy-code";
import { requireUser } from "@/lib/auth";
import { giftCardStore } from "@/lib/commerce/gift-cards";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Gift cards", robots: { index: false } };

export default async function GiftCardsPage() {
  await requireUser();
  const cards = giftCardStore.all();

  return (
    <Panel
      title="Gift cards"
      description="Apply a card at checkout. Balances are drawn down after discounts and tax, and anything left over stays on the card."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const used = card.initialBalance - card.balance;
          const percent = Math.round((card.balance / card.initialBalance) * 100);

          return (
            <li
              key={card.code}
              className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-premium"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-gold/12 blur-2xl"
              />

              <div className="relative">
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  <Gift className="size-3.5" aria-hidden />
                  Gift card
                </p>

                <p className="mt-3 font-mono text-3xl tabular-nums">
                  {formatPrice(card.balance)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  of {formatPrice(card.initialBalance)}
                  {used > 0 ? ` · ${formatPrice(used)} used` : ""}
                </p>

                <div
                  className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${percent}% of the balance remaining`}
                >
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <CopyCode code={card.code} className="mt-4" />

                {!card.active ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Fully redeemed — kept for your records.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
