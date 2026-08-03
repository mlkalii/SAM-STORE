import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Package,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Navigation icons resolved from a name, so `nav-config.ts` stays serialisable
 * data. A switch over literal JSX rather than a lookup table — a table that
 * returned components would create a component during render.
 */
export function AdminIcon({ name, className }: { name: string; className?: string }) {
  const props = { className, "aria-hidden": true } as const;

  switch (name) {
    case "LayoutDashboard":
      return <LayoutDashboard {...props} />;
    case "BarChart3":
      return <BarChart3 {...props} />;
    case "Package":
      return <Package {...props} />;
    case "FolderTree":
      return <FolderTree {...props} />;
    case "Tags":
      return <Tags {...props} />;
    case "Boxes":
      return <Boxes {...props} />;
    case "ShoppingCart":
      return <ShoppingCart {...props} />;
    case "Users":
      return <Users {...props} />;
    case "Megaphone":
      return <Megaphone {...props} />;
    case "LayoutTemplate":
      return <LayoutTemplate {...props} />;
    case "ShieldCheck":
      return <ShieldCheck {...props} />;
    case "Settings":
      return <Settings {...props} />;
    case "Store":
      return <Store {...props} />;
    case "Percent":
      return <Percent {...props} />;
    case "Wallet":
      return <Wallet {...props} />;
    case "Star":
      return <Star {...props} />;
    default:
      return <Package {...props} />;
  }
}
