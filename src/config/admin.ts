/**
 * Admin panel configuration.
 *
 * Roles and permissions are declared here so a page never hardcodes "is this
 * person allowed" — it asks `can(role, permission)`. Adding a role means adding
 * one entry; adding a capability means adding one permission string.
 */

export const ADMIN_SESSION_COOKIE = "samrux_admin_session";

/** Shorter than the storefront session — admin access should lapse sooner. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const ADMIN_REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 7;

export const ADMIN_ROOT = "/admin";
export const ADMIN_LOGIN = "/admin/login";

export type AdminRole = "super-admin" | "admin" | "manager" | "staff" | "support";

export const ADMIN_ROLES: { id: AdminRole; label: string; description: string }[] = [
  {
    id: "super-admin",
    label: "Super admin",
    description: "Everything, including staff accounts and destructive settings.",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full operational control, but cannot manage staff or billing.",
  },
  {
    id: "manager",
    label: "Manager",
    description: "Catalogue, inventory, orders and marketing. No settings.",
  },
  {
    id: "staff",
    label: "Staff",
    description: "Day-to-day order and inventory work. Read-only elsewhere.",
  },
  {
    id: "support",
    label: "Support agent",
    description: "Customers and orders, read-mostly, plus notes and refunds.",
  },
];

/**
 * Permissions are `<resource>.<action>`. `*` is a wildcard for super admins.
 */
export type Permission =
  | "dashboard.view"
  | "products.view" | "products.edit" | "products.delete"
  | "categories.view" | "categories.edit"
  | "brands.view" | "brands.edit"
  | "orders.view" | "orders.edit" | "orders.refund"
  | "customers.view" | "customers.edit"
  | "inventory.view" | "inventory.edit"
  | "marketing.view" | "marketing.edit"
  | "content.view" | "content.edit"
  | "reports.view"
  | "settings.view" | "settings.edit"
  | "staff.view" | "staff.edit"
  | "sellers.view" | "sellers.edit" | "sellers.approve"
  | "commissions.view" | "commissions.edit"
  | "payouts.view" | "payouts.edit"
  | "reviews.view" | "reviews.moderate";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[] | ["*"]> = {
  "super-admin": ["*"],

  admin: [
    "dashboard.view",
    "products.view", "products.edit", "products.delete",
    "categories.view", "categories.edit",
    "brands.view", "brands.edit",
    "orders.view", "orders.edit", "orders.refund",
    "customers.view", "customers.edit",
    "inventory.view", "inventory.edit",
    "marketing.view", "marketing.edit",
    "content.view", "content.edit",
    "reports.view",
    "settings.view",
    "sellers.view", "sellers.edit", "sellers.approve",
    "commissions.view", "commissions.edit",
    "payouts.view", "payouts.edit",
    "reviews.view", "reviews.moderate",
  ],

  manager: [
    "dashboard.view",
    "products.view", "products.edit",
    "categories.view", "categories.edit",
    "brands.view", "brands.edit",
    "orders.view", "orders.edit",
    "customers.view",
    "inventory.view", "inventory.edit",
    "marketing.view", "marketing.edit",
    "content.view",
    "reports.view",
    "sellers.view", "sellers.edit",
    "commissions.view",
    "payouts.view",
    "reviews.view", "reviews.moderate",
  ],

  staff: [
    "dashboard.view",
    "products.view",
    "categories.view",
    "brands.view",
    "orders.view", "orders.edit",
    "customers.view",
    "inventory.view", "inventory.edit",
    "reports.view",
    "sellers.view",
    "reviews.view",
  ],

  support: [
    "dashboard.view",
    "products.view",
    "orders.view", "orders.edit", "orders.refund",
    "customers.view", "customers.edit",
    "reports.view",
    "sellers.view",
    "reviews.view", "reviews.moderate",
  ],
};

export function permissionsFor(role: AdminRole): Permission[] | ["*"] {
  return ROLE_PERMISSIONS[role];
}

export function can(role: AdminRole, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed[0] === "*" || (allowed as Permission[]).includes(permission);
}

