import type { Permission } from "@/config/admin";

/**
 * Admin navigation.
 *
 * One declaration drives the sidebar, the mobile drawer and the command
 * palette, and each entry names the permission it needs — so a staff member
 * never sees a link they cannot open.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
  /** Match nested routes (e.g. /admin/products/[slug]). */
  prefix?: boolean;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNav: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", permission: "dashboard.view" },
      { href: "/admin/reports", label: "Reports", icon: "BarChart3", permission: "reports.view", prefix: true },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: "Package", permission: "products.view", prefix: true },
      { href: "/admin/categories", label: "Categories", icon: "FolderTree", permission: "categories.view", prefix: true },
      { href: "/admin/brands", label: "Brands", icon: "Tags", permission: "brands.view", prefix: true },
      { href: "/admin/inventory", label: "Inventory", icon: "Boxes", permission: "inventory.view", prefix: true },
    ],
  },
  {
    title: "Selling",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "ShoppingCart", permission: "orders.view", prefix: true },
      { href: "/admin/customers", label: "Customers", icon: "Users", permission: "customers.view", prefix: true },
      { href: "/admin/marketing", label: "Marketing", icon: "Megaphone", permission: "marketing.view", prefix: true },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/content", label: "Content", icon: "LayoutTemplate", permission: "content.view", prefix: true },
      { href: "/admin/staff", label: "Staff", icon: "ShieldCheck", permission: "staff.view", prefix: true },
      { href: "/admin/settings", label: "Settings", icon: "Settings", permission: "settings.view", prefix: true },
    ],
  },
];
