import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Coins,
  Globe2,
  LayoutDashboard,
  MessageSquare,
  Percent,
  Truck,
} from "lucide-react";

import { Container } from "@/components/common/container";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { currencyConfig, shippingRegion, storeConfig } from "@/config/store";
import { returnPolicy } from "@/config/returns";
import { siteConfig } from "@/config/site";
import { getSellerContext } from "@/lib/marketplace/auth";
import { DEFAULT_COMMISSION_RATE } from "@/lib/marketplace/commission";
import { MINIMUM_PAYOUT } from "@/lib/marketplace/payouts";
import { sellerStore } from "@/lib/marketplace/seller-store";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sell on SAMRUX",
  description:
    "Join the SAMRUX marketplace: your own storefront, all fifty states, USDT payouts and no listing fee.",
  alternates: { canonical: "/sell" },
};

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: "Your own storefront",
    body: "A branded store page with your logo, banner, collections, reviews and followers — not a listing buried in someone else's catalogue.",
  },
  {
    icon: Globe2,
    title: shippingRegion.label,
    body: "Shipping rates, zones and delivery estimates are set marketplace-wide, so you quote one price and we handle the rest.",
  },
  {
    icon: Coins,
    title: `Paid in ${currencyConfig.code}`,
    body: `Earnings settle to your marketplace balance as they are made. Withdraw to a bank account or a ${currencyConfig.code} wallet from ${formatPrice(MINIMUM_PAYOUT)}.`,
  },
  {
    icon: Percent,
    title: "Commission you can see",
    body: `A ${DEFAULT_COMMISSION_RATE}% standard rate, lower in electronics and grocery. Every order shows exactly which rule was applied.`,
  },
  {
    icon: BarChart3,
    title: "Real analytics",
    body: "Sales, orders, best sellers, customers and stock, updated as they happen — not a monthly export.",
  },
  {
    icon: MessageSquare,
    title: "Talk to your buyers",
    body: "Questions come straight to you. Answer publicly and the reply helps the next shopper decide.",
  },
];

const STEPS = [
  {
    title: "Apply",
    body: "Tell us about your business: legal name, tax ID, address and how to reach you. Five minutes.",
  },
  {
    title: "Verify",
    body: "Identity, business and tax verification. Banking verification when you add a payout destination.",
  },
  {
    title: "List",
    body: "Add products with pricing, stock, media and SEO. Save drafts until you are ready.",
  },
  {
    title: "Sell",
    body: "Orders arrive in your dashboard. Accept, ship with tracking, and get paid.",
  },
];

export default async function SellPage() {
  const [{ seller }, sellers] = await Promise.all([
    getSellerContext(),
    Promise.resolve(sellerStore.approved()),
  ]);

  return (
    <div>
      <section className="border-b bg-surface">
        <Container className="py-16 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Sell on {siteConfig.name}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl tracking-tight text-balance sm:text-6xl">
            Bring your store to a marketplace that puts your name on it
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            {sellers.length} independent sellers already trade on {siteConfig.name}. No listing
            fee, no monthly charge — commission only when you sell.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {seller ? (
              <Button size="lg" render={<Link href="/seller" />}>
                Go to your dashboard
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button size="lg" render={<Link href="/sell/register" />}>
                Apply to sell
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
            <Button size="lg" variant="outline" render={<Link href="/sellers" />}>
              See who sells here
            </Button>
          </div>

          <dl className="mt-14 grid max-w-3xl gap-6 border-t pt-8 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                Standard commission
              </dt>
              <dd className="mt-1 font-display text-3xl">{DEFAULT_COMMISSION_RATE}%</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                Listing fee
              </dt>
              <dd className="mt-1 font-display text-3xl">None</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                Settlement
              </dt>
              <dd className="mt-1 font-display text-3xl">{currencyConfig.code}</dd>
            </div>
          </dl>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="What you get"
            title="Everything a store needs, none of the overhead"
          />
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title}>
                <benefit.icon className="size-5 text-gold" aria-hidden />
                <h3 className="mt-4 text-lg font-medium">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{benefit.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t bg-surface py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="How it works" title="From application to first order" />
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-t py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="The rules" title="What we ask of every seller" />
          <ul className="mt-10 grid max-w-3xl gap-4">
            <li className="flex gap-3 rounded-xl border p-4">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Verification before trading.</span>{" "}
                Identity, business and tax verification are required. It protects buyers and it
                protects honest sellers from being undercut by people who will not stand behind
                what they ship.
              </p>
            </li>
            <li className="flex gap-3 rounded-xl border p-4">
              <Truck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Dispatch on time.</span> You set your
                own dispatch window and it is published on every product page. Miss it repeatedly
                and the store is suspended.
              </p>
            </li>
            <li className="flex gap-3 rounded-xl border p-4">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  The {returnPolicy.windowDays}-day return policy.
                </span>{" "}
                It is the marketplace&rsquo;s promise, made on your behalf. Incorrect or defective
                goods ship back free, and refunds reach the buyer within{" "}
                {returnPolicy.refundBusinessDaysMin}–{returnPolicy.refundBusinessDaysMax} business
                days.
              </p>
            </li>
          </ul>

          <div className="mt-12">
            <Button size="lg" render={<Link href={seller ? "/seller" : "/sell/register"} />}>
              {seller ? "Go to your dashboard" : "Apply to sell"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              Questions first? Email{" "}
              <a
                href={`mailto:${storeConfig.contactEmail}`}
                className="underline underline-offset-4"
              >
                {storeConfig.contactEmail}
              </a>{" "}
              or call {storeConfig.phone}.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
