/**
 * Seller dashboard navigation.
 *
 * One declaration drives the sidebar and the mobile drawer. Deliberately flat
 * compared with the admin's grouped nav — a seller has one store to run, not a
 * marketplace to administer.
 */
export interface SellerNavItem {
  href: string;
  label: string;
  icon: string;
  /** Match nested routes, e.g. /seller/products/[slug]. */
  prefix?: boolean;
  /** Rendered as a count bubble when non-zero. */
  badge?: "orders" | "messages" | "reviews";
}

export interface SellerNavGroup {
  title: string;
  items: SellerNavItem[];
}

export const sellerNav: SellerNavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/seller", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/seller/analytics", label: "Analytics", icon: "BarChart3", prefix: true },
    ],
  },
  {
    title: "Selling",
    items: [
      { href: "/seller/products", label: "Products", icon: "Package", prefix: true },
      { href: "/seller/inventory", label: "Inventory", icon: "Boxes", prefix: true },
      { href: "/seller/orders", label: "Orders", icon: "ShoppingCart", prefix: true, badge: "orders" },
      { href: "/seller/customers", label: "Customers", icon: "Users", prefix: true },
      { href: "/seller/coupons", label: "Coupons", icon: "Tag", prefix: true },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/seller/reviews", label: "Reviews", icon: "Star", prefix: true, badge: "reviews" },
      { href: "/seller/messages", label: "Messages", icon: "MessageSquare", prefix: true, badge: "messages" },
      { href: "/seller/payouts", label: "Payouts", icon: "Wallet", prefix: true },
      { href: "/seller/verification", label: "Verification", icon: "ShieldCheck", prefix: true },
      { href: "/seller/settings", label: "Store settings", icon: "Settings", prefix: true },
    ],
  },
];
