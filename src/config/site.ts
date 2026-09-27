import { siteUrl } from "@/config/site-url";
import { storeConfig } from "@/config/store";
import type { NavItem } from "@/types";

export const siteConfig = {
  name: storeConfig.tradingName,
  legalName: storeConfig.legalName,
  title: "SAMRUX — Online retail store",
  description:
    "SAMRUX LLC is an online retail store offering a range of consumer products. Every product is sold and shipped directly by SAMRUX LLC, with prices in US dollars.",
  /** Resolved from the environment — see `@/config/site-url`. */
  url: siteUrl,
  freeShippingThreshold: 7500,
  /** Primary address — customer-facing, used everywhere by default. */
  supportEmail: storeConfig.supportEmail,
  /** Secondary address — company, press, wholesale and legal notices. */
  contactEmail: storeConfig.contactEmail,
  phone: storeConfig.phone,
  phoneHref: storeConfig.phoneHref,
  social: {
    instagram: "https://instagram.com",
    x: "https://x.com",
    linkedin: "https://linkedin.com",
  },
} as const;

/** Primary header navigation. `Categories` opens the department menu. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/", description: "Back to the start" },
  { label: "Shop", href: "/shop", description: "The full catalogue" },
  { label: "Categories", href: "/categories", description: "Browse by department" },
  { label: "About Us", href: "/about", description: "Who we are" },
  { label: "Contact", href: "/contact", description: "Talk to our team" },
];

/** Rendered in the policies strip at the very bottom of the footer. */
export const policyNav: NavItem[] = [
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Shop",
    items: [
      { label: "All products", href: "/shop" },
      { label: "Categories", href: "/categories" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Policies",
    items: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];
