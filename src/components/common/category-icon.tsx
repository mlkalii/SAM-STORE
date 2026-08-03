import {
  Baby,
  Briefcase,
  Car,
  ChefHat,
  Cpu,
  Gamepad2,
  HeartPulse,
  Laptop,
  Mountain,
  Package,
  PawPrint,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

interface CategoryIconProps {
  /** The `icon` string on a `Category`. */
  name: string;
  className?: string;
  strokeWidth?: number;
}

/**
 * Category data stays serialisable by naming its icon rather than importing it.
 * This resolves the name with a switch over literal JSX — a lookup table that
 * returned components would create a component during render.
 */
export function CategoryIcon({ name, className, strokeWidth }: CategoryIconProps) {
  const props = { className, strokeWidth, "aria-hidden": true } as const;

  switch (name) {
    case "Cpu":
      return <Cpu {...props} />;
    case "ChefHat":
      return <ChefHat {...props} />;
    case "Sparkles":
      return <Sparkles {...props} />;
    case "HeartPulse":
      return <HeartPulse {...props} />;
    case "Mountain":
      return <Mountain {...props} />;
    case "PawPrint":
      return <PawPrint {...props} />;
    case "Baby":
      return <Baby {...props} />;
    case "Briefcase":
      return <Briefcase {...props} />;
    case "Car":
      return <Car {...props} />;
    case "Wrench":
      return <Wrench {...props} />;
    case "Laptop":
      return <Laptop {...props} />;
    case "Smartphone":
      return <Smartphone {...props} />;
    case "Shirt":
      return <Shirt {...props} />;
    case "ShoppingBasket":
      return <ShoppingBasket {...props} />;
    case "Gamepad2":
      return <Gamepad2 {...props} />;
    default:
      return <Package {...props} />;
  }
}
