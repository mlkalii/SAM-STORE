/**
 * Source material for the catalogue generator.
 *
 * Every product in the store is produced from one of these concepts crossed
 * with three tiers. Nothing here is scraped — the brands are invented and the
 * copy is written for this project. Replace `src/data/catalog.json` with a real
 * inventory feed and the rest of the app keeps working unchanged.
 */

export const TIERS = [
  { suffix: "", multiplier: 1, note: "the standard configuration" },
  { suffix: "Pro", multiplier: 1.45, note: "upgraded internals and a longer warranty" },
  { suffix: "Max", multiplier: 1.95, note: "the full-size flagship with every option fitted" },
];

const COLOURS = {
  tech: [
    { id: "graphite", label: "Graphite", hex: "#3a3f45" },
    { id: "silver", label: "Silver", hex: "#c9ccd1" },
    { id: "midnight", label: "Midnight", hex: "#1c2230" },
  ],
  warm: [
    { id: "sand", label: "Sand", hex: "#d8cbb8" },
    { id: "clay", label: "Clay", hex: "#b08968" },
    { id: "ink", label: "Ink", hex: "#1c1c1e" },
  ],
  soft: [
    { id: "chalk", label: "Chalk", hex: "#f2efe9" },
    { id: "sage", label: "Sage", hex: "#9aa88f" },
    { id: "dusk", label: "Dusk", hex: "#6b7280" },
  ],
  bold: [
    { id: "black", label: "Black", hex: "#17181a" },
    { id: "forest", label: "Forest", hex: "#2f4235" },
    { id: "rust", label: "Rust", hex: "#9c5f45" },
  ],
};

const SIZES = {
  apparel: [
    { id: "s", label: "Small" },
    { id: "m", label: "Medium" },
    { id: "l", label: "Large" },
    { id: "xl", label: "X-Large" },
  ],
  capacity: [
    { id: "30", label: "30-day" },
    { id: "60", label: "60-day" },
    { id: "90", label: "90-day" },
  ],
  volume: [
    { id: "500", label: "500 ml" },
    { id: "750", label: "750 ml" },
    { id: "1000", label: "1 L" },
  ],
};

export const VARIANT_SETS = { ...COLOURS, ...SIZES };

/** @type {Record<string, any>} */
export const CATEGORY_SOURCE = {
  electronics: {
    brands: ["Nordvane", "Kestrel Audio", "Volux", "Aeterna", "Lumenwave", "Cirroq", "Halden", "Novare"],
    gradients: [
      "from-slate-700 via-indigo-600 to-sky-500",
      "from-indigo-800 via-violet-600 to-blue-400",
      "from-sky-700 via-cyan-600 to-slate-400",
      "from-zinc-800 via-slate-600 to-indigo-400",
    ],
    commonFeatures: [
      "Firmware updates delivered over the air for a minimum of five years",
      "Repair schematics and spare parts published on the support portal",
    ],
    commonSpecs: [
      ["Warranty", "3 years, parts and labour"],
      ["In the box", "Device, braided USB-C cable, quick-start card"],
    ],
    concepts: [
      {
        name: "Aeris Wireless Headphones",
        sub: "Audio",
        price: 24900,
        variants: "tech",
        blurb: "Over-ear ANC headphones tuned flat, with a 60-hour battery.",
        features: [
          "Hybrid active noise cancellation with a dedicated transparency mode",
          "60 hours playback, 5 hours from a 10-minute charge",
          "Replaceable earpads and a user-serviceable battery",
        ],
        specs: [
          ["Drivers", "40 mm dynamic, beryllium-coated"],
          ["Codecs", "LDAC, aptX Adaptive, AAC, SBC"],
          ["Weight", "268 g"],
        ],
      },
      {
        name: "Pulse Earbuds",
        sub: "Audio",
        price: 12900,
        variants: "tech",
        blurb: "Pocketable ANC earbuds with four microphones and IP57 sealing.",
        features: [
          "Four-microphone array with wind-noise suppression",
          "Wireless charging case adds three full recharges",
          "Ear-tip fit test built into the companion app",
        ],
        specs: [
          ["Drivers", "11 mm dynamic"],
          ["Battery", "8 h buds, 32 h with case"],
          ["Rating", "IP57 dust and water resistant"],
        ],
      },
      {
        name: "Vantage 4K Monitor",
        sub: "Displays",
        price: 42900,
        variants: "none",
        blurb: "A 27-inch factory-calibrated 4K panel with 96 W of USB-C power.",
        features: [
          "Factory calibrated to Delta-E under 2 with a printed report",
          "Single-cable USB-C docking with 96 W passthrough",
          "Height, tilt, swivel and pivot on the included stand",
        ],
        specs: [
          ["Panel", '27" IPS Black, 3840 × 2160'],
          ["Colour", "99% sRGB, 95% DCI-P3"],
          ["Refresh", "120 Hz with adaptive sync"],
        ],
      },
      {
        name: "Lumina Portable Projector",
        sub: "Displays",
        price: 59900,
        variants: "none",
        blurb: "A 1080p laser projector that auto-squares itself in under a second.",
        features: [
          "Automatic keystone and obstacle avoidance on every power-up",
          "Sealed laser light source rated for 25,000 hours",
          "Integrated 2 × 8 W speakers with a proper low end",
        ],
        specs: [
          ["Resolution", "1920 × 1080 native, 4K input support"],
          ["Brightness", "900 ISO lumens"],
          ["Throw", "0.9:1 — 100 inches from 2.2 m"],
        ],
      },
      {
        name: "Corex Mechanical Keyboard",
        sub: "Accessories",
        price: 15900,
        variants: "tech",
        blurb: "A gasket-mounted 75% board with hot-swap sockets and real damping.",
        features: [
          "Hot-swap sockets accept three- and five-pin switches",
          "Gasket mount with two layers of poron for a softer bottom-out",
          "Wired, 2.4 GHz and Bluetooth for three paired devices",
        ],
        specs: [
          ["Layout", "75%, 82 keys"],
          ["Switches", "Pre-lubed linear, 45 g actuation"],
          ["Keycaps", "PBT double-shot, cherry profile"],
        ],
      },
      {
        name: "Orbit Wireless Mouse",
        sub: "Accessories",
        price: 6900,
        variants: "tech",
        blurb: "A 63-gram mouse with an eight-thousand-hertz polling receiver.",
        features: [
          "8,000 Hz polling over the bundled receiver",
          "Optical switches rated for 100 million clicks",
          "70-day battery life at 1,000 Hz",
        ],
        specs: [
          ["Sensor", "26,000 DPI optical"],
          ["Weight", "63 g without the receiver"],
          ["Connectivity", "2.4 GHz, Bluetooth 5.3, USB-C"],
        ],
      },
      {
        name: "Vault Portable SSD",
        sub: "Storage",
        price: 18900,
        variants: "tech",
        blurb: "A 2 TB pocket drive with hardware encryption and an aluminium shell.",
        features: [
          "Hardware AES-256 encryption with an on-device PIN option",
          "Machined aluminium shell doubles as the heatsink",
          "Rated for a 3 m drop onto a hard floor",
        ],
        specs: [
          ["Capacity", "2 TB"],
          ["Interface", "USB 3.2 Gen 2×2, 20 Gbps"],
          ["Speeds", "2,000 MB/s read, 1,800 MB/s write"],
        ],
      },
      {
        name: "Nimbus Smart Speaker",
        sub: "Audio",
        price: 13900,
        variants: "soft",
        blurb: "Room-correcting stereo in a speaker that runs without the cloud.",
        features: [
          "Automatic room correction using the onboard microphone array",
          "Local-only mode keeps voice processing off the network",
          "Stereo pairing and multi-room over standard AirPlay 2",
        ],
        specs: [
          ["Drivers", "1 × 4\" woofer, 2 × 20 mm tweeters"],
          ["Power", "60 W class-D amplification"],
          ["Inputs", "Wi-Fi 6, Bluetooth 5.3, 3.5 mm line in"],
        ],
      },
      {
        name: "Aperture Mirrorless Camera",
        sub: "Cameras",
        price: 129900,
        variants: "none",
        blurb: "A 33-megapixel full-frame body with in-body stabilisation.",
        features: [
          "8 stops of in-body image stabilisation",
          "Subject-detection autofocus for people, animals and vehicles",
          "Dual card slots — CFexpress B and UHS-II SD",
        ],
        specs: [
          ["Sensor", "33 MP full-frame BSI CMOS"],
          ["Video", "6K oversampled 4K/60, 10-bit 4:2:2"],
          ["Viewfinder", "3.69 M-dot OLED, 120 Hz"],
        ],
      },
      {
        name: "Signal Mesh Router",
        sub: "Networking",
        price: 21900,
        variants: "soft",
        blurb: "Wi-Fi 7 mesh with a 2.5-gigabit backhaul and no subscription.",
        features: [
          "Tri-band Wi-Fi 7 with a dedicated 6 GHz backhaul",
          "Every feature included — no subscription behind any setting",
          "Guest, IoT and primary networks isolated by default",
        ],
        specs: [
          ["Standard", "Wi-Fi 7 (802.11be), 2×2 MIMO"],
          ["Ports", "2 × 2.5 GbE, 2 × 1 GbE per node"],
          ["Coverage", "Up to 190 m² per node"],
        ],
      },
    ],
  },

  "home-kitchen": {
    brands: ["Casavera", "Terra Nine", "Hearthline", "Loomcraft", "Verdant", "Solvay Home", "Oakmoor", "Brenna"],
    gradients: [
      "from-amber-500 via-orange-500 to-rose-500",
      "from-orange-400 via-amber-500 to-yellow-600",
      "from-rose-400 via-orange-400 to-amber-300",
      "from-stone-500 via-amber-600 to-orange-700",
    ],
    commonFeatures: [
      "Every gasket, seal and filter is sold separately for at least ten years",
      "Packed without expanded polystyrene — moulded pulp and card only",
    ],
    commonSpecs: [
      ["Warranty", "5 years on the housing, 2 on wear parts"],
      ["Voltage", "110–240 V, 50/60 Hz"],
    ],
    concepts: [
      {
        name: "Meridian Espresso Machine",
        sub: "Coffee",
        price: 79900,
        variants: "tech",
        blurb: "A dual-boiler machine with PID control and a real 58 mm portafilter.",
        features: [
          "Dual boilers — brew and steam at the same time, no waiting",
          "PID temperature control accurate to ±0.5 °C",
          "Commercial 58 mm portafilter and a nine-bar rotary pump",
        ],
        specs: [
          ["Boilers", "Dual stainless, 0.4 L brew / 1.4 L steam"],
          ["Heat-up", "6 minutes to first shot"],
          ["Reservoir", "2.5 L, front-loading"],
        ],
      },
      {
        name: "Everdine Cookware Set",
        sub: "Cookware",
        price: 34900,
        variants: "none",
        blurb: "Five-ply stainless with a bonded aluminium core, oven safe to 260 °C.",
        features: [
          "Five-ply construction to the rim, not just the base",
          "Handles stay cool on the hob and are riveted, not spot-welded",
          "Induction, gas, electric and oven safe to 260 °C",
        ],
        specs: [
          ["Pieces", "10 — 3 pans, 3 pots, 4 lids"],
          ["Construction", "18/10 stainless, aluminium core"],
          ["Care", "Dishwasher safe"],
        ],
      },
      {
        name: "Aurora Air Purifier",
        sub: "Air Quality",
        price: 29900,
        variants: "soft",
        blurb: "True HEPA for rooms up to 90 m², quiet enough to sleep beside.",
        features: [
          "H13 true HEPA plus a 1.2 kg activated carbon bed",
          "24 dB on the night setting — quieter than a whisper",
          "Filter life reported in hours, not a guessed percentage",
        ],
        specs: [
          ["Coverage", "Up to 90 m²"],
          ["CADR", "400 m³/h"],
          ["Filter life", "12 months typical"],
        ],
      },
      {
        name: "Stillwell Stand Mixer",
        sub: "Small Appliances",
        price: 44900,
        variants: "warm",
        blurb: "A 700-watt direct-drive mixer in a die-cast body, not plastic.",
        features: [
          "Die-cast aluminium body with a direct-drive gearbox",
          "Planetary action reaches the full bowl in one rotation",
          "Standard power hub fits third-party attachments",
        ],
        specs: [
          ["Motor", "700 W direct drive"],
          ["Bowl", "5.5 L stainless, handled"],
          ["Speeds", "10 plus fold"],
        ],
      },
      {
        name: "Tidal Vacuum Blender",
        sub: "Small Appliances",
        price: 19900,
        variants: "tech",
        blurb: "Blends under vacuum so smoothies stay bright instead of browning.",
        features: [
          "Vacuum cycle removes air before the blades start",
          "Hardened stainless blades, replaceable as a cartridge",
          "Tritan jug is BPA-free and dishwasher safe",
        ],
        specs: [
          ["Motor", "1,400 W"],
          ["Jug", "1.8 L Tritan"],
          ["Programmes", "6 presets plus manual"],
        ],
      },
      {
        name: "Hearth Cast Iron Skillet",
        sub: "Cookware",
        price: 8900,
        variants: "none",
        blurb: "A machine-polished 30 cm skillet, pre-seasoned with flaxseed oil.",
        features: [
          "Cooking surface machined smooth, not left sand-cast",
          "Pre-seasoned with flaxseed oil over three firings",
          "Helper handle and two pour spouts",
        ],
        specs: [
          ["Diameter", "30 cm"],
          ["Weight", "2.8 kg"],
          ["Oven safe", "To 280 °C"],
        ],
      },
      {
        name: "Loom Linen Duvet Set",
        sub: "Bedding",
        price: 24900,
        variants: "soft",
        blurb: "Stone-washed European flax that arrives already broken in.",
        features: [
          "100% European flax, stone-washed for immediate softness",
          "Coconut-shell buttons rather than a hidden zip",
          "Oeko-Tex Standard 100 certified end to end",
        ],
        specs: [
          ["Includes", "Duvet cover and two pillowcases"],
          ["Weight", "165 gsm"],
          ["Care", "Machine wash cold, tumble low"],
        ],
      },
      {
        name: "Nordlight Floor Lamp",
        sub: "Lighting",
        price: 17900,
        variants: "warm",
        blurb: "A dimmable arc lamp with a CRI-97 source and no visible flicker.",
        features: [
          "CRI 97 source — colours read correctly after dark",
          "Flicker-free down to 1% on the stepless dimmer",
          "Weighted marble base, no wall anchoring needed",
        ],
        specs: [
          ["Output", "1,600 lm at 2,700–4,000 K"],
          ["Height", "180 cm"],
          ["Base", "Carrara marble, 6.4 kg"],
        ],
      },
      {
        name: "Purevessel Filter Pitcher",
        sub: "Air Quality",
        price: 5900,
        variants: "soft",
        blurb: "A borosilicate pitcher whose filter is certified for lead and PFAS.",
        features: [
          "NSF-certified for lead, chlorine and PFOA/PFOS reduction",
          "Borosilicate glass body — no plastic taste",
          "Filter counter tracks litres, not days",
        ],
        specs: [
          ["Capacity", "2.4 L"],
          ["Filter life", "550 litres"],
          ["Flow", "Full pitcher in 4 minutes"],
        ],
      },
      {
        name: "Kettle One Gooseneck",
        sub: "Coffee",
        price: 12900,
        variants: "tech",
        blurb: "Variable-temperature pour-over kettle with a 60-minute hold.",
        features: [
          "Set any temperature between 40 °C and 100 °C in 1° steps",
          "Holds temperature for 60 minutes without recycling",
          "Counterbalanced handle for a steady slow pour",
        ],
        specs: [
          ["Capacity", "1.0 L"],
          ["Power", "1,200 W"],
          ["Body", "304 stainless, uncoated interior"],
        ],
      },
    ],
  },

  "beauty-personal-care": {
    brands: ["Lumelle", "Osane", "Byrra", "Ceriva", "Fleur Neuf", "Hydrarite", "Noctura", "Velle"],
    gradients: [
      "from-rose-400 via-pink-400 to-fuchsia-500",
      "from-pink-300 via-rose-400 to-purple-500",
      "from-fuchsia-400 via-rose-300 to-amber-200",
      "from-purple-400 via-pink-500 to-rose-600",
    ],
    commonFeatures: [
      "Full ingredient list with concentrations printed on the carton",
      "Fragrance-free and dermatologist tested on sensitive skin panels",
    ],
    commonSpecs: [
      ["Cruelty free", "Leaping Bunny certified"],
      ["Shelf life", "24 months sealed, 12 after opening"],
    ],
    concepts: [
      {
        name: "Hydra Renewal Serum",
        sub: "Skincare",
        price: 6800,
        variants: "none",
        blurb: "Five molecular weights of hyaluronic acid in a weightless base.",
        features: [
          "Five hyaluronic acid weights hydrate at different depths",
          "2% panthenol to support the barrier while it plumps",
          "Airless pump — no dip-tube contamination",
        ],
        specs: [
          ["Size", "30 ml"],
          ["Key actives", "HA complex 2.5%, panthenol 2%"],
          ["pH", "5.5"],
        ],
      },
      {
        name: "Silk Veil Moisturiser",
        sub: "Skincare",
        price: 5400,
        variants: "none",
        blurb: "A ceramide cream that absorbs before it has a chance to sit.",
        features: [
          "Ceramide NP, AP and EOP in the skin's natural 3:1:1 ratio",
          "Squalane from sugarcane, never shark-derived",
          "Non-comedogenic and safe under sunscreen",
        ],
        specs: [
          ["Size", "50 ml"],
          ["Key actives", "Ceramide complex 1%, squalane 5%"],
          ["Finish", "Matte-satin"],
        ],
      },
      {
        name: "Clarity Cleansing Gel",
        sub: "Skincare",
        price: 3200,
        variants: "none",
        blurb: "A low-pH gel that removes the day without stripping the barrier.",
        features: [
          "Amino-acid surfactants instead of sulphates",
          "pH 5.0 leaves the acid mantle intact",
          "Rinses fully without a residual film",
        ],
        specs: [
          ["Size", "150 ml"],
          ["Surfactants", "Coco-glucoside, sodium cocoyl glycinate"],
          ["pH", "5.0"],
        ],
      },
      {
        name: "Radiance Vitamin C Drops",
        sub: "Skincare",
        price: 7200,
        variants: "none",
        blurb: "15% L-ascorbic acid stabilised with ferulic acid, in amber glass.",
        features: [
          "15% L-ascorbic acid with 0.5% ferulic acid for stability",
          "Amber glass and an airless pump slow oxidation",
          "Batch date printed on the bottle, not just the box",
        ],
        specs: [
          ["Size", "30 ml"],
          ["Key actives", "L-ascorbic 15%, ferulic 0.5%, vitamin E 1%"],
          ["pH", "3.2"],
        ],
      },
      {
        name: "Overnight Repair Mask",
        sub: "Masks",
        price: 5900,
        variants: "none",
        blurb: "A sleeping mask with encapsulated retinal at a beginner-safe dose.",
        features: [
          "0.05% encapsulated retinal releases slowly through the night",
          "Buffered with niacinamide and bisabolol to limit flushing",
          "Sits under a pillowcase without transferring",
        ],
        specs: [
          ["Size", "50 ml"],
          ["Key actives", "Retinal 0.05%, niacinamide 4%"],
          ["Use", "2–3 nights per week to start"],
        ],
      },
      {
        name: "Precision Hair Dryer",
        sub: "Hair Tools",
        price: 24900,
        variants: "tech",
        blurb: "A brushless dryer that measures air temperature 20 times a second.",
        features: [
          "Temperature sampled 20 times a second to protect the cuticle",
          "Brushless motor rated for 2,500 hours",
          "Magnetic concentrator and diffuser, both included",
        ],
        specs: [
          ["Motor", "1,600 W brushless"],
          ["Noise", "72 dB at full power"],
          ["Cable", "2.7 m, replaceable"],
        ],
      },
      {
        name: "Ceramic Styling Brush",
        sub: "Hair Tools",
        price: 8900,
        variants: "warm",
        blurb: "A vented ceramic round brush that heats evenly and stays balanced.",
        features: [
          "Ceramic barrel spreads heat instead of concentrating it",
          "Vented core cuts drying time by roughly a third",
          "Boar and nylon mix grips fine hair without snagging",
        ],
        specs: [
          ["Barrel", "43 mm"],
          ["Bristles", "Boar and heat-resistant nylon"],
          ["Handle", "Cork, water resistant"],
        ],
      },
      {
        name: "Mineral Sunscreen SPF 50",
        sub: "Sun Care",
        price: 3800,
        variants: "none",
        blurb: "Non-nano zinc at 20% with no white cast on medium skin tones.",
        features: [
          "20% non-nano zinc oxide, reef-safe formulation",
          "Tinted iron oxides prevent a white cast",
          "Broad spectrum with a measured UVA-PF of 18",
        ],
        specs: [
          ["Size", "60 ml"],
          ["Protection", "SPF 50, PA++++"],
          ["Water resistance", "80 minutes"],
        ],
      },
      {
        name: "Lip Restore Balm Trio",
        sub: "Lip Care",
        price: 2400,
        variants: "none",
        blurb: "Three balms — day, night and treatment — in recyclable aluminium.",
        features: [
          "Lanolin-free, so it works for wool-sensitive skin",
          "Aluminium tubes, recyclable without separation",
          "Unscented and safe to reapply through the day",
        ],
        specs: [
          ["Size", "3 × 10 ml"],
          ["Key actives", "Shea 12%, ceramides, vitamin E"],
          ["Finish", "Clear, non-sticky"],
        ],
      },
      {
        name: "Detox Clay Mask",
        sub: "Masks",
        price: 4200,
        variants: "none",
        blurb: "Kaolin and green clay that stay pliable rather than cracking dry.",
        features: [
          "Kaolin and French green clay draw without over-drying",
          "Glycerin keeps the mask pliable for the full ten minutes",
          "Rinses clean with water, no flannel needed",
        ],
        specs: [
          ["Size", "75 ml"],
          ["Key actives", "Kaolin 18%, green clay 9%, zinc PCA"],
          ["Use", "Once or twice weekly"],
        ],
      },
    ],
  },


  "sports-outdoors": {
    brands: ["Ridgeline", "Halcyon", "Trailmark", "Kinetix", "Summitry", "Everstride", "Nordpeak", "Verso"],
    gradients: [
      "from-lime-600 via-emerald-600 to-teal-700",
      "from-emerald-700 via-green-600 to-lime-500",
      "from-teal-700 via-emerald-600 to-cyan-500",
      "from-green-800 via-emerald-700 to-teal-500",
    ],
    commonFeatures: [
      "Field-tested for a full season before it reaches the catalogue",
      "Repairs handled in-house — send it back rather than replacing it",
    ],
    commonSpecs: [
      ["Warranty", "Lifetime on workmanship"],
      ["Care", "Cold wash, no fabric softener"],
    ],
    concepts: [
      {
        name: "Trailhead 45L Backpack",
        sub: "Packs",
        price: 21900,
        variants: "bold",
        blurb: "A load-bearing 45-litre pack that carries weight on the hips.",
        features: [
          "Adjustable torso length across a 10 cm range",
          "Hip belt transfers roughly 80% of the load off the shoulders",
          "Recycled 420D ripstop with a PFC-free finish",
        ],
        specs: [
          ["Volume", "45 L"],
          ["Weight", "1.42 kg"],
          ["Max load", "22 kg comfortable"],
        ],
      },
      {
        name: "Summit Down Jacket",
        sub: "Apparel",
        price: 34900,
        variants: "apparel",
        blurb: "850-fill responsible down under a genuinely windproof shell.",
        features: [
          "850-fill-power RDS-certified down",
          "10-denier ripstop shell with a PFC-free DWR",
          "Packs into its own chest pocket, roughly one litre",
        ],
        specs: [
          ["Fill", "850 FP, 140 g"],
          ["Weight", "365 g in medium"],
          ["Comfort", "To −12 °C when layered"],
        ],
      },
      {
        name: "Alpine Trekking Poles",
        sub: "Training",
        price: 9900,
        variants: "none",
        blurb: "Carbon poles with a lever lock that holds under real load.",
        features: [
          "External lever locks adjust with gloves on",
          "Carbon shafts tested to 140 kg static load",
          "Cork grips with an extended foam section for traverses",
        ],
        specs: [
          ["Length", "110–130 cm adjustable"],
          ["Weight", "218 g per pole"],
          ["Included", "Mud, snow and trekking baskets"],
        ],
      },
      {
        name: "Adjustable Dumbbell Set",
        sub: "Training",
        price: 39900,
        variants: "none",
        blurb: "2 to 32 kg per hand with a dial that will not slip mid-set.",
        features: [
          "Dial adjusts 2–32 kg in 2 kg steps",
          "Steel selector pins rather than moulded plastic",
          "Cradle doubles as the storage tray",
        ],
        specs: [
          ["Range", "2–32 kg per dumbbell"],
          ["Handle", "Knurled steel, 32 mm"],
          ["Footprint", "48 × 24 cm per cradle"],
        ],
      },
      {
        name: "Yoga Mat Pro",
        sub: "Training",
        price: 7900,
        variants: "soft",
        blurb: "6 mm natural rubber with a grip that improves as you sweat.",
        features: [
          "Natural tree rubber base, no PVC",
          "Polyurethane top grips harder when damp",
          "Alignment marks moulded rather than printed",
        ],
        specs: [
          ["Size", "183 × 66 cm"],
          ["Thickness", "6 mm"],
          ["Weight", "2.4 kg"],
        ],
      },
      {
        name: "Insulated Water Bottle",
        sub: "Hydration",
        price: 3900,
        variants: "volume",
        blurb: "Holds ice for 30 hours and fits a car cup holder.",
        features: [
          "Double-wall vacuum insulation, 30 hours cold",
          "Fits a standard 74 mm cup holder",
          "Lid disassembles fully for cleaning",
        ],
        specs: [
          ["Material", "18/8 stainless, powder coated"],
          ["Insulation", "30 h cold, 12 h hot"],
          ["Mouth", "Wide, fits standard ice"],
        ],
      },
      {
        name: "Camp Stove Compact",
        sub: "Camping",
        price: 8900,
        variants: "none",
        blurb: "A regulated canister stove that holds output as the gas runs low.",
        features: [
          "Pressure regulator keeps output steady to the last of the canister",
          "Boils a litre in 3 minutes 20 seconds at sea level",
          "Folds to the size of a deck of cards",
        ],
        specs: [
          ["Output", "3,000 W"],
          ["Weight", "116 g"],
          ["Fuel", "Standard EN417 canisters"],
        ],
      },
      {
        name: "Running Vest",
        sub: "Running",
        price: 12900,
        variants: "apparel",
        blurb: "A 10-litre vest that stays still without being strapped down hard.",
        features: [
          "Bounce-free fit without over-tightening the sternum straps",
          "Two 500 ml soft flasks included",
          "Fourteen pockets reachable while moving",
        ],
        specs: [
          ["Volume", "10 L"],
          ["Weight", "215 g empty"],
          ["Sizes", "XS–XL, unisex"],
        ],
      },
      {
        name: "Two-Person Tent",
        sub: "Camping",
        price: 44900,
        variants: "none",
        blurb: "A freestanding three-season tent that pitches fly-first in rain.",
        features: [
          "Fly-first pitch keeps the inner dry in weather",
          "Two doors and two vestibules — no climbing over anyone",
          "Silicone-coated nylon, 3,000 mm hydrostatic head",
        ],
        specs: [
          ["Capacity", "2 people"],
          ["Packed weight", "1.9 kg"],
          ["Floor area", "2.7 m² plus 1.4 m² vestibules"],
        ],
      },
      {
        name: "Resistance Band Kit",
        sub: "Training",
        price: 4900,
        variants: "none",
        blurb: "Layered latex bands from 5 to 60 kg with real door anchors.",
        features: [
          "Layered latex rather than moulded — no snapping",
          "Five resistances stack to 60 kg",
          "Steel-cored door anchor and cast handles",
        ],
        specs: [
          ["Resistances", "5, 10, 15, 20, 30 kg"],
          ["Included", "Handles, ankle straps, door anchor, bag"],
          ["Length", "120 cm"],
        ],
      },
    ],
  },

  "pet-supplies": {
    brands: ["Paloma Pet", "Fetchwell", "Barkline", "Nuzzle", "Trailpaw", "Whiskerly", "Denwood", "Cove Pet"],
    gradients: [
      "from-orange-400 via-amber-500 to-yellow-600",
      "from-amber-400 via-orange-500 to-rose-400",
      "from-yellow-500 via-amber-500 to-orange-600",
      "from-orange-500 via-red-400 to-amber-300",
    ],
    commonFeatures: [
      "Every fabric surface unzips and goes through a domestic washing machine",
      "No PVC, phthalates or added dyes anywhere in the product",
    ],
    commonSpecs: [
      ["Cleaning", "Machine washable cover, cold cycle"],
      ["Warranty", "2 years including chew damage on the frame"],
    ],
    concepts: [
      {
        name: "Orthopedic Dog Bed",
        sub: "Beds",
        price: 14900,
        variants: "apparel",
        blurb: "A single slab of CertiPUR foam under a waterproof, washable cover.",
        features: [
          "10 cm single-piece memory foam, not shredded offcuts",
          "Waterproof inner liner under a removable outer cover",
          "Bolster edge supports the head without collapsing",
        ],
        specs: [
          ["Foam", "10 cm CertiPUR-US memory foam"],
          ["Cover", "Removable, machine washable"],
          ["Base", "Non-slip, floor-safe"],
        ],
      },
      {
        name: "Smart Pet Feeder",
        sub: "Feeding",
        price: 19900,
        variants: "soft",
        blurb: "Portion-accurate scheduled feeding with a battery fallback.",
        features: [
          "Portions accurate to ±2 g, verified by a load cell",
          "Battery backup keeps the schedule through a power cut",
          "Records your voice for the meal call",
        ],
        specs: [
          ["Capacity", "6 L hopper"],
          ["Meals", "Up to 10 per day"],
          ["Power", "Mains with 3 × D battery backup"],
        ],
      },
      {
        name: "Ceramic Slow Feeder Bowl",
        sub: "Feeding",
        price: 3900,
        variants: "soft",
        blurb: "A glazed maze bowl that slows eating without frustrating the dog.",
        features: [
          "Maze depth tuned to slow eating roughly fourfold",
          "Lead-free glaze, dishwasher safe",
          "Weighted base stays put on tile",
        ],
        specs: [
          ["Capacity", "600 ml"],
          ["Material", "Stoneware, lead-free glaze"],
          ["Diameter", "22 cm"],
        ],
      },
      {
        name: "Reflective Dog Harness",
        sub: "Walking",
        price: 5900,
        variants: "apparel",
        blurb: "A no-pull harness with front and back clips and 360° reflectivity.",
        features: [
          "Front and back attachment points for training and walking",
          "Reflective piping visible from every angle",
          "Padded chest plate spreads pressure off the throat",
        ],
        specs: [
          ["Sizes", "XS–XL, chest 33–110 cm"],
          ["Hardware", "Cast aluminium D-rings"],
          ["Webbing", "Recycled nylon, 25 mm"],
        ],
      },
      {
        name: "Cat Tree Tower",
        sub: "Cats",
        price: 18900,
        variants: "warm",
        blurb: "A solid-timber tower with replaceable sisal, not carpet-wrapped MDF.",
        features: [
          "Solid pine frame — no particleboard anywhere",
          "Sisal posts replaceable individually when worn",
          "Wall bracket included for taller configurations",
        ],
        specs: [
          ["Height", "152 cm"],
          ["Platforms", "4 plus a covered den"],
          ["Max cat weight", "9 kg per platform"],
        ],
      },
      {
        name: "Self-Cleaning Litter Box",
        sub: "Cats",
        price: 44900,
        variants: "soft",
        blurb: "A sifting box with a sealed waste drawer and no subscription.",
        features: [
          "Sealed carbon-filtered drawer holds a week for one cat",
          "Weight and infrared sensors both required before a cycle runs",
          "Works with any clumping litter — no proprietary refill",
        ],
        specs: [
          ["Entry", "Front, 24 cm wide"],
          ["Drawer", "6 L sealed"],
          ["Noise", "38 dB during a cycle"],
        ],
      },
      {
        name: "Interactive Treat Puzzle",
        sub: "Beds",
        price: 3400,
        variants: "bold",
        blurb: "A four-level puzzle that keeps working after the dog solves level one.",
        features: [
          "Four difficulty levels in one board",
          "Food-safe ABS, dishwasher safe on the top rack",
          "Non-slip feet keep it still under a determined nose",
        ],
        specs: [
          ["Levels", "4"],
          ["Size", "30 × 30 cm"],
          ["Suits", "Dogs and cats"],
        ],
      },
      {
        name: "Travel Pet Carrier",
        sub: "Travel",
        price: 12900,
        variants: "bold",
        blurb: "Airline-compliant on major carriers, with a rigid frame that packs flat.",
        features: [
          "Meets under-seat dimensions for most major airlines",
          "Rigid internal frame collapses flat for storage",
          "Removable, washable sherpa base pad",
        ],
        specs: [
          ["Dimensions", "46 × 28 × 28 cm"],
          ["Max pet weight", "9 kg"],
          ["Ventilation", "Mesh on three sides"],
        ],
      },
      {
        name: "Grooming Deshedding Kit",
        sub: "Grooming",
        price: 4900,
        variants: "none",
        blurb: "A stainless deshedding blade with a release button that works.",
        features: [
          "Stainless blade reaches the undercoat without cutting guard hair",
          "One-press hair release, no picking it out by hand",
          "Includes a slicker brush and nail clippers with a guard",
        ],
        specs: [
          ["Blade", "10 cm stainless, rounded teeth"],
          ["Includes", "Deshedder, slicker, clippers, comb"],
          ["Suits", "Double-coated breeds"],
        ],
      },
      {
        name: "Waterproof Car Seat Cover",
        sub: "Travel",
        price: 8900,
        variants: "bold",
        blurb: "A hammock cover with seatbelt cut-outs and a genuine waterproof layer.",
        features: [
          "Hammock design stops a dog sliding into the footwell",
          "Fully waterproof backing, not just water resistant",
          "Seatbelt openings close with a flap when unused",
        ],
        specs: [
          ["Size", "137 × 147 cm"],
          ["Fabric", "600D Oxford with TPU backing"],
          ["Fit", "Bench seats in most saloons and SUVs"],
        ],
      },
    ],
  },

  "baby-products": {
    brands: ["Lullaby Co", "Petalen", "Nestly", "Bambino Nord", "Softmark", "Cradlewell", "Milo & Fern", "Aurea Baby"],
    gradients: [
      "from-sky-300 via-cyan-400 to-blue-500",
      "from-blue-300 via-sky-400 to-indigo-400",
      "from-cyan-300 via-teal-300 to-sky-500",
      "from-indigo-300 via-blue-400 to-cyan-500",
    ],
    commonFeatures: [
      "Meets or exceeds the current EN and ASTM safety standards for its class",
      "Every fabric is Oeko-Tex Standard 100 certified for infant contact",
    ],
    commonSpecs: [
      ["Certification", "EN 1888 / ASTM F833 as applicable"],
      ["Materials", "BPA, BPS and phthalate free"],
    ],
    concepts: [
      {
        name: "Convertible Crib",
        sub: "Nursery",
        price: 59900,
        variants: "warm",
        blurb: "Solid beech that converts from crib to toddler bed to daybed.",
        features: [
          "Three configurations — crib, toddler bed, daybed",
          "Solid beech with a water-based, zero-VOC finish",
          "Four mattress heights, adjusted with the supplied key",
        ],
        specs: [
          ["Material", "Solid beech"],
          ["Mattress", "Fits standard 132 × 70 cm"],
          ["Weight limit", "23 kg in toddler mode"],
        ],
      },
      {
        name: "Compact Stroller",
        sub: "Travel",
        price: 44900,
        variants: "bold",
        blurb: "Folds one-handed to cabin size and stands up on its own.",
        features: [
          "One-handed fold that stands unsupported",
          "Fits most airline cabin lockers at 55 × 40 × 23 cm folded",
          "Full recline and a UPF 50+ extendable canopy",
        ],
        specs: [
          ["Folded", "55 × 40 × 23 cm"],
          ["Weight", "6.2 kg"],
          ["Capacity", "Birth to 22 kg"],
        ],
      },
      {
        name: "Infant Car Seat",
        sub: "Car Safety",
        price: 34900,
        variants: "soft",
        blurb: "A rear-facing seat with a load leg and a no-rethread harness.",
        features: [
          "Load leg reduces rotation in a frontal impact",
          "No-rethread harness adjusts with the headrest",
          "Level indicator visible from outside the car",
        ],
        specs: [
          ["Orientation", "Rear-facing"],
          ["Range", "40–85 cm, up to 13 kg"],
          ["Install", "ISOFIX base or belt path"],
        ],
      },
      {
        name: "Baby Monitor HD",
        sub: "Monitoring",
        price: 19900,
        variants: "tech",
        blurb: "A 1080p monitor on a closed local link with no account required.",
        features: [
          "Closed local radio link — nothing leaves the house",
          "No account, no app and no subscription",
          "Pan, tilt and zoom from the bundled parent unit",
        ],
        specs: [
          ["Camera", "1080p with infrared night vision"],
          ["Range", "300 m open, 50 m through walls"],
          ["Battery", "18 hours in audio-only mode"],
        ],
      },
      {
        name: "Bottle Warmer",
        sub: "Feeding",
        price: 6900,
        variants: "soft",
        blurb: "Even warming in 3 minutes with an automatic shut-off.",
        features: [
          "Circulating water warms evenly with no hot spots",
          "Automatic shut-off and a keep-warm hold",
          "Fits wide, narrow and angled bottles",
        ],
        specs: [
          ["Warm time", "3 minutes for 150 ml"],
          ["Modes", "Warm, defrost, steam sterilise"],
          ["Power", "300 W"],
        ],
      },
      {
        name: "Organic Cotton Swaddle Set",
        sub: "Textiles",
        price: 4900,
        variants: "soft",
        blurb: "GOTS muslin that gets softer with every wash.",
        features: [
          "GOTS-certified organic cotton muslin",
          "Pre-washed, so shrinkage is done before it arrives",
          "120 × 120 cm — big enough to swaddle properly",
        ],
        specs: [
          ["Includes", "3 swaddles"],
          ["Size", "120 × 120 cm each"],
          ["Care", "Machine wash warm, tumble low"],
        ],
      },
      {
        name: "Diaper Bag Backpack",
        sub: "Travel",
        price: 12900,
        variants: "bold",
        blurb: "An insulated-bottle backpack that opens flat like a suitcase.",
        features: [
          "Opens flat so you can see everything at once",
          "Two insulated bottle pockets hold temperature for 4 hours",
          "Includes a wipe-clean changing mat and stroller straps",
        ],
        specs: [
          ["Volume", "22 L"],
          ["Pockets", "16 including a rear security pocket"],
          ["Fabric", "Recycled polyester with a water-resistant coating"],
        ],
      },
      {
        name: "Nursery Sound Machine",
        sub: "Nursery",
        price: 5900,
        variants: "soft",
        blurb: "Non-looping noise that plays all night without a phone.",
        features: [
          "True non-looping playback — no audible seam",
          "Runs standalone; the app is optional, not required",
          "Nightlight dims to a level that will not wake a sleeping room",
        ],
        specs: [
          ["Sounds", "18 including three brown-noise profiles"],
          ["Battery", "40 hours, USB-C"],
          ["Volume", "Up to 85 dB with a safe-level marker"],
        ],
      },
      {
        name: "Adjustable High Chair",
        sub: "Feeding",
        price: 21900,
        variants: "warm",
        blurb: "A beech chair that follows the child from six months to adult.",
        features: [
          "Seat and footplate adjust in eight positions each",
          "Meets the table without a bulky tray",
          "Converts to a standard chair rated to 85 kg",
        ],
        specs: [
          ["Material", "Solid beech, water-based lacquer"],
          ["Range", "6 months to adult"],
          ["Harness", "Five-point, removable"],
        ],
      },
      {
        name: "Silicone Feeding Set",
        sub: "Feeding",
        price: 3400,
        variants: "soft",
        blurb: "Suction plates and bowls that hold to the table, not to a toddler.",
        features: [
          "Suction base holds on wood, laminate and glass",
          "Platinum-cured silicone, no fillers",
          "Dishwasher, microwave and freezer safe",
        ],
        specs: [
          ["Includes", "Plate, bowl, cup, 2 spoons, bib"],
          ["Material", "Platinum-cured LFGB silicone"],
          ["Temperature", "−40 °C to 230 °C"],
        ],
      },
    ],
  },

  "office-products": {
    brands: ["Meridiem", "Quill & Co", "Deskform", "Northline", "Paperis", "Ergovia", "Stelvio", "Axio"],
    gradients: [
      "from-zinc-600 via-slate-600 to-neutral-800",
      "from-slate-700 via-zinc-600 to-stone-500",
      "from-neutral-700 via-slate-500 to-zinc-400",
      "from-stone-700 via-neutral-600 to-slate-800",
    ],
    commonFeatures: [
      "Rated for eight-hour daily use rather than occasional home use",
      "Replacement castors, gas lifts and fixings kept in stock for ten years",
    ],
    commonSpecs: [
      ["Warranty", "10 years on the frame"],
      ["Assembly", "Tools included, under 20 minutes"],
    ],
    concepts: [
      {
        name: "Standing Desk Converter",
        sub: "Desks",
        price: 32900,
        variants: "warm",
        blurb: "A gas-assisted riser that lifts a dual-monitor load with one hand.",
        features: [
          "Gas assist handles 15 kg with a single-hand release",
          "Straight vertical travel — it does not lunge forward",
          "Separate keyboard tray at the correct offset",
        ],
        specs: [
          ["Travel", "12–50 cm above the desk"],
          ["Capacity", "15 kg"],
          ["Surface", "89 × 55 cm"],
        ],
      },
      {
        name: "Ergonomic Mesh Chair",
        sub: "Seating",
        price: 44900,
        variants: "tech",
        blurb: "Independent lumbar depth and height, plus a proper forward tilt.",
        features: [
          "Lumbar adjusts for both height and depth independently",
          "Seat pan slides 6 cm for leg length",
          "Forward tilt for desk work, locked in five positions",
        ],
        specs: [
          ["Mesh", "Elastomeric, replaceable panel"],
          ["Capacity", "150 kg"],
          ["Adjustments", "4D arms, tilt tension, seat depth"],
        ],
      },
      {
        name: "Dual Monitor Arm",
        sub: "Monitor Setup",
        price: 14900,
        variants: "tech",
        blurb: "Aluminium gas-spring arms that hold position without creeping.",
        features: [
          "Gas springs hold position — no drift over the day",
          "Integrated cable channels, no adhesive clips",
          "Clamp and grommet mounts both included",
        ],
        specs: [
          ["Screens", "2, up to 32\" each"],
          ["Capacity", "9 kg per arm"],
          ["VESA", "75 × 75 and 100 × 100"],
        ],
      },
      {
        name: "Hardcover Notebook Set",
        sub: "Paper",
        price: 3900,
        variants: "bold",
        blurb: "120 gsm paper that takes fountain ink without ghosting.",
        features: [
          "120 gsm stock — fountain pen safe, no bleed-through",
          "Lies flat from the first page on a sewn binding",
          "Numbered pages with an index at the front",
        ],
        specs: [
          ["Pages", "192 numbered, dot grid"],
          ["Size", "A5, 148 × 210 mm"],
          ["Includes", "3 notebooks, two ribbons each"],
        ],
      },
      {
        name: "Desk Organiser Set",
        sub: "Paper",
        price: 5900,
        variants: "warm",
        blurb: "Solid walnut trays with felt bases and no visible fixings.",
        features: [
          "Solid walnut, oil finished and refinishable",
          "Wool felt bases protect the desk surface",
          "Modular — the trays stack and nest",
        ],
        specs: [
          ["Pieces", "5 trays and a pen block"],
          ["Material", "FSC walnut, hardwax oil"],
          ["Footprint", "38 × 24 cm assembled"],
        ],
      },
      {
        name: "Compact Laser Printer",
        sub: "Printing",
        price: 24900,
        variants: "soft",
        blurb: "Duplex mono laser with no chipped cartridges and no cloud account.",
        features: [
          "Third-party toner works — no cartridge chip lockout",
          "Prints from the local network without any account",
          "Automatic duplex at full speed",
        ],
        specs: [
          ["Speed", "34 ppm mono"],
          ["Resolution", "1200 × 1200 dpi"],
          ["Connectivity", "Wi-Fi, Ethernet, USB"],
        ],
      },
      {
        name: "Cross-Cut Shredder",
        sub: "Paper",
        price: 17900,
        variants: "none",
        blurb: "P-4 security with a 20-minute duty cycle and jam reverse.",
        features: [
          "P-4 cross cut — 4 × 35 mm particles",
          "20-minute continuous run before cooldown",
          "Handles staples, clips and credit cards",
        ],
        specs: [
          ["Capacity", "14 sheets per pass"],
          ["Bin", "23 L pull-out"],
          ["Noise", "58 dB"],
        ],
      },
      {
        name: "LED Desk Lamp",
        sub: "Lighting",
        price: 9900,
        variants: "tech",
        blurb: "An asymmetric head that lights the desk without glare on the screen.",
        features: [
          "Asymmetric optic puts light on the desk, not the monitor",
          "CRI 95 with flicker-free dimming to 1%",
          "Tunable 2,700–6,500 K with a memory setting",
        ],
        specs: [
          ["Output", "1,000 lm"],
          ["Reach", "60 cm arm"],
          ["Power", "USB-C PD or mains adapter"],
        ],
      },
      {
        name: "Magnetic Glass Whiteboard",
        sub: "Monitor Setup",
        price: 12900,
        variants: "soft",
        blurb: "Tempered glass that will not ghost, with concealed mounts.",
        features: [
          "Tempered glass surface — no ghosting after months of use",
          "Concealed standoff mounts, no visible brackets",
          "Takes rare-earth magnets and standard dry-erase markers",
        ],
        specs: [
          ["Size", "120 × 90 cm"],
          ["Thickness", "5 mm tempered"],
          ["Includes", "Mounts, tray, 4 markers"],
        ],
      },
      {
        name: "Rollerball Pen Set",
        sub: "Paper",
        price: 4900,
        variants: "bold",
        blurb: "A machined brass body taking standard refills you can buy anywhere.",
        features: [
          "Machined brass, patinates with use",
          "Takes standard Euro-format refills",
          "Balanced toward the nib for long sessions",
        ],
        specs: [
          ["Body", "Machined brass, 28 g"],
          ["Refill", "0.5 mm rollerball, standard fit"],
          ["Includes", "2 pens, 4 refills, sleeve"],
        ],
      },
    ],
  },

  automotive: {
    brands: ["Torqline", "Vantar", "Roadmere", "Axlewerks", "Grypp", "Autolume", "Feldt", "Carrow"],
    gradients: [
      "from-neutral-700 via-zinc-700 to-red-700",
      "from-zinc-800 via-neutral-700 to-orange-600",
      "from-slate-800 via-zinc-700 to-red-600",
      "from-stone-800 via-neutral-700 to-amber-600",
    ],
    commonFeatures: [
      "Sized to live in a glovebox or boot well without rattling",
      "Every fuse, lead and adapter it needs is in the box",
    ],
    commonSpecs: [
      ["Operating range", "−20 °C to 60 °C"],
      ["Warranty", "3 years"],
    ],
    concepts: [
      {
        name: "Portable Jump Starter",
        sub: "Power",
        price: 12900,
        variants: "bold",
        blurb: "Starts a 7-litre diesel and holds charge on the shelf for a year.",
        features: [
          "2,000 A peak — starts up to 7.0 L diesel engines",
          "Reverse-polarity and spark protection built into the clamps",
          "Holds 85% charge after twelve months in the boot",
        ],
        specs: [
          ["Peak current", "2,000 A"],
          ["Capacity", "20,000 mAh"],
          ["Extras", "USB-C PD 60 W out, 400 lm torch"],
        ],
      },
      {
        name: "Dash Camera 4K",
        sub: "Cameras",
        price: 19900,
        variants: "tech",
        blurb: "Front and rear recording with a capacitor, not a swelling battery.",
        features: [
          "Supercapacitor instead of a lithium cell — no summer swelling",
          "Buffered parking mode captures before the impact",
          "Files stay on the card; nothing uploads by default",
        ],
        specs: [
          ["Resolution", "3840 × 2160 front, 1080p rear"],
          ["Field of view", "150°"],
          ["Storage", "microSD to 512 GB, not included"],
        ],
      },
      {
        name: "Cordless Tyre Inflator",
        sub: "Tyres",
        price: 8900,
        variants: "tech",
        blurb: "Presets a target pressure and shuts off when it gets there.",
        features: [
          "Set a target PSI and it stops on its own",
          "Digital gauge accurate to ±1 PSI",
          "Inflates a 225/45 R17 from flat in 4 minutes",
        ],
        specs: [
          ["Max pressure", "150 PSI"],
          ["Battery", "7,800 mAh, USB-C"],
          ["Adapters", "Presta, Schrader, ball, inflatable"],
        ],
      },
      {
        name: "Ceramic Coating Kit",
        sub: "Detailing",
        price: 6900,
        variants: "none",
        blurb: "A 9H SiO₂ coating with a working time long enough for a beginner.",
        features: [
          "Long flash time — forgiving on a first application",
          "Rated for three years of contact-wash durability",
          "Includes prep spray, applicators and a cure cloth",
        ],
        specs: [
          ["Coverage", "One saloon, two coats"],
          ["Hardness", "9H"],
          ["Cure", "Touch dry 1 h, full cure 7 days"],
        ],
      },
      {
        name: "All-Weather Floor Mats",
        sub: "Interior",
        price: 14900,
        variants: "none",
        blurb: "Laser-scanned TPE mats with a raised lip that actually holds water.",
        features: [
          "Laser-scanned to the specific footwell shape",
          "Raised 3 cm lip retains roughly 1.5 litres",
          "TPE stays flexible to −30 °C and rinses clean",
        ],
        specs: [
          ["Set", "Front pair and rear runner"],
          ["Material", "TPE, odourless"],
          ["Retention", "Uses factory anchor points"],
        ],
      },
      {
        name: "OBD2 Diagnostic Scanner",
        sub: "Diagnostics",
        price: 9900,
        variants: "tech",
        blurb: "Reads live data and clears codes without a monthly subscription.",
        features: [
          "Live sensor data graphed on the device",
          "Reads and clears codes with no subscription",
          "Lifetime updates over USB",
        ],
        specs: [
          ["Protocols", "All OBD2 including CAN"],
          ["Screen", "3.5\" colour"],
          ["Coverage", "Petrol from 2001, diesel from 2004"],
        ],
      },
      {
        name: "Cordless Car Vacuum",
        sub: "Interior",
        price: 7900,
        variants: "tech",
        blurb: "Real suction with a washable HEPA filter and a crevice tool that reaches.",
        features: [
          "8,000 Pa suction on the boost setting",
          "Washable HEPA filter, spares included",
          "45 cm flexible crevice tool reaches under seats",
        ],
        specs: [
          ["Suction", "8,000 Pa"],
          ["Runtime", "35 min standard, 12 min boost"],
          ["Bin", "500 ml"],
        ],
      },
      {
        name: "Magnetic Phone Mount",
        sub: "Interior",
        price: 3400,
        variants: "tech",
        blurb: "N52 magnets and a vent clip that does not sag over a summer.",
        features: [
          "N52 magnets hold a large phone over rough surfaces",
          "Metal vent clip — no plastic hook to fatigue",
          "MagSafe-compatible ring included for older phones",
        ],
        specs: [
          ["Hold", "Up to 450 g"],
          ["Rotation", "360°, ball joint"],
          ["Fits", "Blade and circular vents"],
        ],
      },
      {
        name: "Roof Cargo Box",
        sub: "Power",
        price: 59900,
        variants: "bold",
        blurb: "A 450-litre box that opens from either side and locks in both.",
        features: [
          "Dual-side opening with a lock that captures both latches",
          "Quick-fit clamps mount without tools in under five minutes",
          "Reinforced floor takes 75 kg of dynamic load",
        ],
        specs: [
          ["Volume", "450 L"],
          ["Dimensions", "205 × 84 × 38 cm"],
          ["Fits", "Bars 60–90 mm wide"],
        ],
      },
      {
        name: "Microfibre Detailing Set",
        sub: "Detailing",
        price: 4200,
        variants: "none",
        blurb: "Edgeless 500 gsm towels that survive a hundred washes.",
        features: [
          "Edgeless — no stitched border to mark paint",
          "500 gsm plush pile holds its loft past 100 washes",
          "Colour-coded for paint, glass and wheels",
        ],
        specs: [
          ["Includes", "12 towels, 2 applicators, wash bag"],
          ["Weight", "500 gsm"],
          ["Size", "40 × 40 cm"],
        ],
      },
    ],
  },

  "tools-home-improvement": {
    brands: ["Brankhardt", "Ironvale", "Toolwerk", "Craftline", "Hexa", "Steadfast", "Mortlake", "Voltek"],
    gradients: [
      "from-yellow-500 via-amber-600 to-orange-700",
      "from-amber-600 via-orange-600 to-red-600",
      "from-orange-600 via-amber-500 to-yellow-400",
      "from-yellow-600 via-orange-700 to-stone-700",
    ],
    commonFeatures: [
      "Runs on the same 18 V battery platform as everything else in the range",
      "Brushes, chucks and switches available as spare parts for ten years",
    ],
    commonSpecs: [
      ["Battery platform", "18 V, cross-compatible"],
      ["Warranty", "5 years with registration"],
    ],
    concepts: [
      {
        name: "Brushless Drill Driver",
        sub: "Power Tools",
        price: 17900,
        variants: "bold",
        blurb: "70 Nm from a brushless motor with a metal chuck that holds true.",
        features: [
          "Brushless motor, 70 Nm of torque in two speeds",
          "All-metal 13 mm keyless chuck with under 0.1 mm runout",
          "LED ring rather than a single side light — no shadow",
        ],
        specs: [
          ["Torque", "70 Nm, 20 clutch settings"],
          ["Speeds", "0–550 / 0–2,000 rpm"],
          ["Weight", "1.3 kg with a 2 Ah pack"],
        ],
      },
      {
        name: "Self-Levelling Laser Level",
        sub: "Measurement",
        price: 12900,
        variants: "tech",
        blurb: "Green cross lines visible in daylight, accurate to 2 mm at 10 m.",
        features: [
          "Green diodes stay visible in a bright room",
          "Self-levels within 4° and flags when it cannot",
          "Standard 1/4\" thread fits any tripod",
        ],
        specs: [
          ["Accuracy", "±2 mm at 10 m"],
          ["Range", "20 m, 50 m with the detector"],
          ["Battery", "Li-ion, 12 hours"],
        ],
      },
      {
        name: "Precision Screwdriver Set",
        sub: "Hand Tools",
        price: 4900,
        variants: "none",
        blurb: "S2 steel bits in a case that holds them where you left them.",
        features: [
          "S2 tool steel bits, hardened to 60 HRC",
          "Magnetised driver with a true-spinning end cap",
          "Case holds every bit in a marked position",
        ],
        specs: [
          ["Bits", "64, including Torx security and tri-point"],
          ["Driver", "Aluminium, 6.35 mm hex"],
          ["Includes", "Spudgers, tweezers, suction cup"],
        ],
      },
      {
        name: "Cordless Impact Driver",
        sub: "Power Tools",
        price: 19900,
        variants: "bold",
        blurb: "200 Nm with an assist mode that stops it stripping the screw head.",
        features: [
          "Assist mode starts slow, then drives at full speed",
          "200 Nm without the wrist shock of a cheaper hammer",
          "One-handed bit change on the collet",
        ],
        specs: [
          ["Torque", "200 Nm"],
          ["Impact rate", "0–3,600 ipm"],
          ["Chuck", "1/4\" hex quick-release"],
        ],
      },
      {
        name: "Digital Multimeter",
        sub: "Electrical",
        price: 6900,
        variants: "tech",
        blurb: "A CAT III 600 V meter with true RMS and fused current inputs.",
        features: [
          "True RMS for accurate readings on non-sinusoidal loads",
          "CAT III 600 V rated with properly fused inputs",
          "Auto-ranging with a manual override that stays put",
        ],
        specs: [
          ["Safety", "CAT III 600 V, CAT II 1000 V"],
          ["Display", "6,000 count with a bar graph"],
          ["Functions", "V, A, Ω, Hz, capacitance, continuity, diode"],
        ],
      },
      {
        name: "Rolling Tool Chest",
        sub: "Storage",
        price: 44900,
        variants: "bold",
        blurb: "Ball-bearing drawers rated to 45 kg each on castors that steer.",
        features: [
          "Every drawer rides on ball bearings rated to 45 kg",
          "Two locking swivel castors and two fixed, all 125 mm",
          "Powder-coated 18-gauge steel, not folded sheet",
        ],
        specs: [
          ["Drawers", "7, felt lined"],
          ["Capacity", "300 kg total"],
          ["Dimensions", "66 × 40 × 88 cm"],
        ],
      },
      {
        name: "Oscillating Multi-Tool",
        sub: "Power Tools",
        price: 14900,
        variants: "bold",
        blurb: "Tool-free blade changes and a genuinely useful depth stop.",
        features: [
          "Tool-free blade change on a universal fitting",
          "Adjustable depth stop for plunge cuts",
          "Variable speed from 10,000 to 20,000 opm",
        ],
        specs: [
          ["Oscillation angle", "3.2°"],
          ["Speed", "10,000–20,000 opm"],
          ["Includes", "6 blades, sanding pad, case"],
        ],
      },
      {
        name: "Digital Stud Finder",
        sub: "Measurement",
        price: 5900,
        variants: "tech",
        blurb: "Maps studs, pipes and live wires and shows the centre, not the edge.",
        features: [
          "Marks the centre of the stud rather than the edge",
          "Separate detection for live AC and metal pipe",
          "Deep scan reaches 38 mm through plaster",
        ],
        specs: [
          ["Depth", "19 mm standard, 38 mm deep scan"],
          ["Detects", "Wood, metal, live AC"],
          ["Power", "9 V battery, included"],
        ],
      },
      {
        name: "Wet Dry Shop Vacuum",
        sub: "Cleaning",
        price: 21900,
        variants: "bold",
        blurb: "A 30-litre vac with a blower port and a filter you can wash.",
        features: [
          "Handles wet and dry without swapping filters",
          "Blower port for clearing gutters and workshops",
          "Washable cartridge filter with a spare in the box",
        ],
        specs: [
          ["Tank", "30 L stainless"],
          ["Suction", "220 mbar"],
          ["Hose", "3 m, 38 mm"],
        ],
      },
      {
        name: "Adjustable Wrench Set",
        sub: "Hand Tools",
        price: 7900,
        variants: "none",
        blurb: "Forged chrome-vanadium jaws with under half a degree of play.",
        features: [
          "Forged chrome-vanadium, not cast",
          "Jaw play under 0.5° when new and after a year of use",
          "Metric and imperial scales laser-etched on both jaws",
        ],
        specs: [
          ["Sizes", '6", 8", 10", 12"'],
          ["Finish", "Satin chrome, corrosion resistant"],
          ["Jaw capacity", "Up to 34 mm"],
        ],
      },
    ],
  },
};
