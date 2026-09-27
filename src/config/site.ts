import { siteUrl } from "@/config/site-url";
import { storeConfig } from "@/config/store";
import type { NavItem } from "@/types";

export const siteConfig = {
  name: storeConfig.tradingName,
  legalName: storeConfig.legalName,
  title: "SAMRUX — Premium essentials across fourteen departments",
  description:
    "SAMRUX sells its own curated range across fourteen departments: electronics, computers, phones, home, beauty, sport, pets, baby, office, automotive, tools, fashion, gourmet food and toys. Fewer products, better chosen — sold and shipped directly by SAMRUX LLC.",
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
  { label: "Shop", href: "/shop", description: "The full catalogue" },
  { label: "Categories", href: "/categories", description: "Browse by department" },
  { label: "Deals", href: "/deals", description: "Everything currently reduced" },
  { label: "New Arrivals", href: "/new-arrivals", description: "Added in the last few weeks" },
  { label: "Best Sellers", href: "/best-sellers", description: "Popular across the range" },
  { label: "About", href: "/about", description: "How we choose what to stock" },
  { label: "Contact", href: "/contact", description: "Talk to a real person" },
];

/** Rendered in the dark policies strip at the very bottom of the footer. */
export const policyNav: NavItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Returns", href: "/returns" },
  { label: "Warranty", href: "/warranty" },
  { label: "Help centre", href: "/help" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Shop",
    items: [
      { label: "All products", href: "/shop" },
      { label: "Categories", href: "/categories" },
      { label: "Deals", href: "/deals" },
      { label: "New arrivals", href: "/new-arrivals" },
      { label: "Best sellers", href: "/best-sellers" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Compare", href: "/compare" },
      { label: "Recently viewed", href: "/recently-viewed" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About SAMRUX", href: "/about" },
      { label: "How we select", href: "/about#selection" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help centre", href: "/help" },
      { label: "Shipping", href: "/help#shipping" },
      { label: "Returns policy", href: "/returns" },
      { label: "Warranty", href: "/warranty" },
      { label: "Track an order", href: "/account/orders" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/register" },
      { label: "My orders", href: "/account/orders" },
      { label: "Messages", href: "/account/messages" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
];
