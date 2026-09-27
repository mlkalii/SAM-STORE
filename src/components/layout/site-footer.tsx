import { AtSign, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/common/container";
import { Separator } from "@/components/ui/separator";
import { footerNav, policyNav, siteConfig } from "@/config/site";
import { currencyConfig, shippingRegion, storeConfig } from "@/config/store";

export function SiteFooter() {
  return (
    <footer className="dark mt-24 border-t bg-background text-foreground">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
            {/* Official contact block — one source of truth in `config/store`. */}
            <address className="mt-6 space-y-2 text-sm not-italic text-muted-foreground">
              <a
                href={`mailto:${storeConfig.supportEmail}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <AtSign className="size-4 shrink-0" aria-hidden />
                {storeConfig.supportEmail}
              </a>
              <a
                href={`mailto:${storeConfig.contactEmail}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <AtSign className="size-4 shrink-0" aria-hidden />
                {storeConfig.contactEmail}
              </a>
              <a
                href={`tel:${storeConfig.phoneHref}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                {storeConfig.phone}
              </a>
              <p className="flex items-start gap-2 leading-relaxed">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {storeConfig.legalName}
                  <br />
                  {storeConfig.address.line1}, {storeConfig.address.line2}
                  <br />
                  {storeConfig.address.city}, {storeConfig.address.state}{" "}
                  {storeConfig.address.postcode}
                  <br />
                  {storeConfig.address.country}
                </span>
              </p>
            </address>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        {/* Policies strip */}
        <div className="flex flex-col gap-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {storeConfig.legalName}. All rights reserved.{" "}
            {storeConfig.tradingName} is an online retail store operated by {storeConfig.legalName}. All prices
            are in US dollars ({currencyConfig.code}).
          </p>

          <nav aria-label="Policies">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {policyNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${storeConfig.supportEmail}`}
                  className="transition-colors hover:text-foreground"
                >
                  {storeConfig.supportEmail}
                </a>
              </li>
              <li className="text-muted-foreground/70">
                {shippingRegion.label} · Prices in {currencyConfig.code} ·{" "}
                {storeConfig.language}
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
