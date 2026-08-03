import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Icon lookup for the seller navigation.
 *
 * A switch over literal JSX rather than a name→component map: the map form
 * creates a new component identity on every render, which React's lint rules
 * correctly flag.
 */
export function SellerIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "LayoutDashboard":
      return <LayoutDashboard className={className} aria-hidden />;
    case "BarChart3":
      return <BarChart3 className={className} aria-hidden />;
    case "Package":
      return <Package className={className} aria-hidden />;
    case "Boxes":
      return <Boxes className={className} aria-hidden />;
    case "ShoppingCart":
      return <ShoppingCart className={className} aria-hidden />;
    case "Users":
      return <Users className={className} aria-hidden />;
    case "Tag":
      return <Tag className={className} aria-hidden />;
    case "Star":
      return <Star className={className} aria-hidden />;
    case "MessageSquare":
      return <MessageSquare className={className} aria-hidden />;
    case "Wallet":
      return <Wallet className={className} aria-hidden />;
    case "ShieldCheck":
      return <ShieldCheck className={className} aria-hidden />;
    case "Settings":
      return <Settings className={className} aria-hidden />;
    default:
      return <Package className={className} aria-hidden />;
  }
}
