import type { Category } from "@/types";

/**
 * The fifteen top-level departments. Everything else in the app — navigation,
 * the mega menu, category pages, filters, the catalogue generator — reads from
 * this list. Gradients are tuned for the dark theme: deep, saturated, and
 * legible under a white overlay.
 */
export const categories: Category[] = [
  {
    slug: "electronics",
    name: "Electronics",
    tagline: "Audio, displays and everyday carry tech",
    description:
      "Headphones, monitors, cameras and the accessories around them — chosen for build quality and driver-level support rather than spec-sheet theatre.",
    icon: "Cpu",
    gradient: "from-indigo-700 via-blue-700 to-sky-600",
    subcategories: ["Audio", "Displays", "Accessories", "Storage", "Cameras", "Networking"],
    // Paste a supplier feed URL here to source this department externally.
    sourceUrl: "",
  },
  {
    slug: "computers-accessories",
    name: "Computers & Accessories",
    tagline: "Machines, docks and the desk around them",
    description:
      "Laptops, desktops, docks and peripherals specified for people who work on them all day — repairability, port selection and thermals over thinness.",
    icon: "Laptop",
    gradient: "from-slate-700 via-indigo-800 to-violet-700",
    subcategories: ["Laptops", "Desktops", "Peripherals", "Docks", "Components", "Storage"],
    sourceUrl: "",
  },
  {
    slug: "mobile-phones",
    name: "Mobile Phones & Accessories",
    tagline: "Handsets, power and protection",
    description:
      "Phones, cases, chargers and mounts. Everything here is sold unlocked, with the battery replacement cost published up front.",
    icon: "Smartphone",
    gradient: "from-cyan-700 via-sky-700 to-blue-800",
    subcategories: ["Handsets", "Cases", "Charging", "Audio", "Mounts", "Screen Care"],
    sourceUrl: "",
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    tagline: "Equipment that earns its counter space",
    description:
      "Espresso, cookware, air quality and lighting. Serviceable parts, honest materials, and finishes that survive a decade of daily use.",
    icon: "ChefHat",
    gradient: "from-amber-600 via-orange-700 to-rose-700",
    subcategories: ["Coffee", "Cookware", "Air Quality", "Small Appliances", "Bedding", "Lighting"],
    sourceUrl: "",
  },
  {
    slug: "beauty-personal-care",
    name: "Beauty & Personal Care",
    tagline: "Formulas with the full ingredient list",
    description:
      "Skincare and grooming tools with published concentrations, dermatologist testing and no fragrance hidden behind a parfum line.",
    icon: "Sparkles",
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    subcategories: ["Skincare", "Hair Tools", "Sun Care", "Body", "Masks", "Lip Care"],
    sourceUrl: "",
  },
  {
    slug: "health-wellness",
    name: "Health & Wellness",
    tagline: "Third-party tested, plainly labelled",
    description:
      "Supplements, recovery devices and monitors. Every batch is tested by an outside lab and the certificate is linked on the product page.",
    icon: "HeartPulse",
    gradient: "from-emerald-700 via-teal-700 to-cyan-700",
    subcategories: ["Supplements", "Recovery", "Monitoring", "Sleep", "Nutrition", "Mobility"],
    sourceUrl: "",
  },
  {
    slug: "sports-outdoors",
    name: "Sports & Outdoors",
    tagline: "Field-tested before it ships",
    description:
      "Packs, insulation, training gear and shelter — tested by people who use it in weather, not in a photo studio.",
    icon: "Mountain",
    gradient: "from-lime-700 via-emerald-800 to-teal-800",
    subcategories: ["Packs", "Apparel", "Training", "Hydration", "Camping", "Running"],
    sourceUrl: "",
  },
  {
    slug: "pet-supplies",
    name: "Pet Supplies",
    tagline: "Built for animals, cleaned by humans",
    description:
      "Beds, feeders, harnesses and travel gear designed around the two things that matter: the animal's comfort and how easily it washes.",
    icon: "PawPrint",
    gradient: "from-orange-600 via-amber-700 to-yellow-700",
    subcategories: ["Beds", "Feeding", "Walking", "Cats", "Travel", "Grooming"],
    sourceUrl: "",
  },
  {
    slug: "baby-products",
    name: "Baby Products",
    tagline: "Certified, and easy at 3am",
    description:
      "Sleep, travel and feeding essentials that meet current safety standards and can be operated one-handed in the dark.",
    icon: "Baby",
    gradient: "from-sky-600 via-cyan-700 to-blue-800",
    subcategories: ["Nursery", "Travel", "Car Safety", "Monitoring", "Feeding", "Textiles"],
    sourceUrl: "",
  },
  {
    slug: "office-products",
    name: "Office Products",
    tagline: "For desks that get used all day",
    description:
      "Seating, desks, lighting and paper goods rated for eight-hour days rather than occasional use.",
    icon: "Briefcase",
    gradient: "from-zinc-700 via-slate-700 to-neutral-800",
    subcategories: ["Desks", "Seating", "Monitor Setup", "Paper", "Printing", "Lighting"],
    sourceUrl: "",
  },
  {
    slug: "automotive",
    name: "Automotive",
    tagline: "Boot-ready, glovebox-sized",
    description:
      "Jump starters, dash cameras, detailing and diagnostics — the equipment that turns a roadside problem into a delay instead of a tow.",
    icon: "Car",
    gradient: "from-neutral-800 via-zinc-800 to-red-800",
    subcategories: ["Power", "Cameras", "Tyres", "Detailing", "Diagnostics", "Interior"],
    sourceUrl: "",
  },
  {
    slug: "tools-home-improvement",
    name: "Tools & Home Improvement",
    tagline: "Brushless, serviceable, guaranteed",
    description:
      "Drills, measurement and storage built on one battery platform, with spare parts kept in stock for a decade.",
    icon: "Wrench",
    gradient: "from-yellow-700 via-amber-700 to-orange-800",
    subcategories: ["Power Tools", "Measurement", "Hand Tools", "Storage", "Electrical", "Cleaning"],
    sourceUrl: "",
  },
  {
    slug: "fashion",
    name: "Fashion",
    tagline: "Cut properly, made to be re-worn",
    description:
      "Outerwear, knitwear, footwear and leather goods from mills and factories we name. Sized honestly, with the fabric composition on every page.",
    icon: "Shirt",
    gradient: "from-stone-700 via-neutral-800 to-amber-800",
    subcategories: ["Outerwear", "Knitwear", "Footwear", "Bags", "Accessories", "Eyewear"],
    sourceUrl: "",
  },
  {
    slug: "grocery-gourmet-food",
    name: "Grocery & Gourmet Food",
    tagline: "Single-origin, dated, traceable",
    description:
      "Coffee, oil, chocolate and pantry staples bought direct. Harvest dates and producer names on the label, not marketing adjectives.",
    icon: "ShoppingBasket",
    gradient: "from-amber-700 via-orange-800 to-red-800",
    subcategories: ["Coffee & Tea", "Pantry", "Chocolate", "Oils & Vinegar", "Snacks", "Preserves"],
    sourceUrl: "",
  },
  {
    slug: "toys-games",
    name: "Toys & Games",
    tagline: "Played with past the first week",
    description:
      "Building sets, board games and open-ended toys chosen for replay value — tested with children rather than focus groups.",
    icon: "Gamepad2",
    gradient: "from-violet-700 via-purple-700 to-fuchsia-700",
    subcategories: ["Building", "Board Games", "Outdoor", "Puzzles", "Pretend Play", "Collectibles"],
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

/** Grouping used by the mega menu so fifteen departments stay scannable. */
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
      "health-wellness",
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
