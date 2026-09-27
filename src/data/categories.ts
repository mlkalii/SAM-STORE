import type { Category } from "@/types";

/**
 * The fourteen top-level departments. Everything else in the app — navigation,
 * the mega menu, category pages, filters, the catalogue generator — reads from
 * this list. Gradients are tuned for the dark theme: deep, saturated, and
 * legible under a white overlay.
 */
export const categories: Category[] = [
  {
    slug: "electronics",
    name: "Electronics",
    tagline: "Audio, displays and cameras",
    description:
      "Headphones, a projector, cameras and the accessories around them.",
    icon: "Cpu",
    gradient: "from-indigo-700 via-blue-700 to-sky-600",
    subcategories: ["Audio", "Displays", "Accessories", "Cameras"],
    // Paste a supplier feed URL here to source this department externally.
    sourceUrl: "",
  },
  {
    slug: "computers-accessories",
    name: "Computers & Accessories",
    tagline: "Machines and the desk around them",
    description:
      "A laptop and the peripherals that go with it: keyboard, webcam and microphone.",
    icon: "Laptop",
    gradient: "from-slate-700 via-indigo-800 to-violet-700",
    subcategories: ["Laptops", "Peripherals"],
    sourceUrl: "",
  },
  {
    slug: "mobile-phones",
    name: "Mobile Phones & Accessories",
    tagline: "Handsets, power and protection",
    description:
      "Phones, cases, power banks and earphones.",
    icon: "Smartphone",
    gradient: "from-cyan-700 via-sky-700 to-blue-800",
    subcategories: ["Handsets", "Cases", "Charging", "Audio"],
    sourceUrl: "",
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    tagline: "Equipment that earns its counter space",
    description:
      "Cookware, small appliances and bedding for everyday use.",
    icon: "ChefHat",
    gradient: "from-amber-600 via-orange-700 to-rose-700",
    subcategories: ["Small Appliances", "Cookware", "Bedding"],
    sourceUrl: "",
  },
  {
    slug: "beauty-personal-care",
    name: "Beauty & Personal Care",
    tagline: "Skincare and grooming",
    description:
      "Skincare, sun care and grooming tools.",
    icon: "Sparkles",
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    subcategories: ["Skincare", "Hair Tools", "Sun Care"],
    sourceUrl: "",
  },
  {
    slug: "sports-outdoors",
    name: "Sports & Outdoors",
    tagline: "Training, camping and outdoor wear",
    description:
      "Insulation, training gear and shelter.",
    icon: "Mountain",
    gradient: "from-lime-700 via-emerald-800 to-teal-800",
    subcategories: ["Apparel", "Training", "Camping"],
    sourceUrl: "",
  },
  {
    slug: "pet-supplies",
    name: "Pet Supplies",
    tagline: "Built for animals, cleaned by humans",
    description:
      "Beds, coats, litter trays and travel gear for dogs and cats.",
    icon: "PawPrint",
    gradient: "from-orange-600 via-amber-700 to-yellow-700",
    subcategories: ["Beds", "Walking", "Cats", "Litter", "Travel"],
    sourceUrl: "",
  },
  {
    slug: "baby-products",
    name: "Baby Products",
    tagline: "Everyday essentials for the early years",
    description:
      "Travel, monitoring, nursery and textile essentials.",
    icon: "Baby",
    gradient: "from-sky-600 via-cyan-700 to-blue-800",
    subcategories: ["Travel", "Car Safety", "Monitoring", "Textiles", "Out and about", "Nursery", "Storage"],
    sourceUrl: "",
  },
  {
    slug: "office-products",
    name: "Office Products",
    tagline: "For desks that get used all day",
    description:
      "Desk lighting, organisers, a shredder and a whiteboard.",
    icon: "Briefcase",
    gradient: "from-zinc-700 via-slate-700 to-neutral-800",
    subcategories: ["Paper", "Lighting", "Monitor Setup"],
    sourceUrl: "",
  },
  {
    slug: "automotive",
    name: "Automotive",
    tagline: "Boot-ready, glovebox-sized",
    description:
      "Jump starters, dash cameras, tyre care and garage equipment.",
    icon: "Car",
    gradient: "from-neutral-800 via-zinc-800 to-red-800",
    subcategories: ["Power", "Cameras", "Tyres", "Tyre care", "Garage", "Cleaning"],
    sourceUrl: "",
  },
  {
    slug: "tools-home-improvement",
    name: "Tools & Home Improvement",
    tagline: "Hand tools, storage and measuring",
    description:
      "Hand tools, tool storage and measuring instruments.",
    icon: "Wrench",
    gradient: "from-yellow-700 via-amber-700 to-orange-800",
    subcategories: ["Hand Tools", "Storage", "Measuring"],
    sourceUrl: "",
  },
  {
    slug: "fashion",
    name: "Fashion",
    tagline: "Outerwear, denim, footwear and accessories",
    description:
      "Outerwear, denim, footwear, eyewear and leather accessories.",
    icon: "Shirt",
    gradient: "from-stone-700 via-neutral-800 to-amber-800",
    subcategories: ["Outerwear", "Denim", "Footwear", "Eyewear", "Accessories"],
    sourceUrl: "",
  },
  {
    slug: "grocery-gourmet-food",
    name: "Grocery & Gourmet Food",
    tagline: "Coffee, oil, chocolate and pantry staples",
    description:
      "Coffee, olive oil, chocolate, preserves and pantry staples.",
    icon: "ShoppingBasket",
    gradient: "from-amber-700 via-orange-800 to-red-800",
    subcategories: ["Coffee & Tea", "Pantry", "Chocolate", "Oils & Vinegar", "Preserves"],
    sourceUrl: "",
  },
  {
    slug: "toys-games",
    name: "Toys & Games",
    tagline: "Played with past the first week",
    description:
      "Board games, wooden toys and outdoor play.",
    icon: "Gamepad2",
    gradient: "from-violet-700 via-purple-700 to-fuchsia-700",
    subcategories: ["Board Games", "Pretend Play", "Outdoor"],
    sourceUrl: "",
  },
];

/** Departments that currently point at an external feed. */
export function getCategoriesWithFeeds() {
  return categories.filter((category) => category.sourceUrl.trim() !== "");
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

/** Grouping used by the mega menu so fourteen departments stay scannable. */
export const categoryGroups: { title: string; slugs: string[] }[] = [
  {
    title: "Tech",
    slugs: ["electronics", "computers-accessories", "mobile-phones", "office-products"],
  },
  {
    title: "Home & Living",
    slugs: ["home-kitchen", "grocery-gourmet-food", "tools-home-improvement", "automotive"],
  },
  {
    title: "You & Family",
    slugs: [
      "beauty-personal-care",
      "fashion",
      "baby-products",
      "toys-games",
    ],
  },
  {
    title: "Active & Pets",
    slugs: ["sports-outdoors", "pet-supplies"],
  },
];
