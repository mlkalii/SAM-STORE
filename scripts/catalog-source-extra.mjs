/**
 * Additional concepts for the ten original departments.
 *
 * Kept separate from `catalog-source.mjs` so the original definitions stay
 * untouched. The generator concatenates `CATEGORY_SOURCE[slug].concepts` with
 * `EXTRA_CONCEPTS[slug]`, giving 13 concepts per department.
 */

export const EXTRA_CONCEPTS = {
  electronics: [
    {
      name: "Relay Bluetooth Transmitter",
      sub: "Audio",
      price: 8900,
      variants: "tech",
      blurb: "Adds low-latency wireless audio to anything with a 3.5 mm or optical out.",
      features: [
        "aptX Low Latency keeps lip-sync correct on television audio",
        "Transmits to two pairs of headphones at once",
        "Passthrough keeps the wired connection live",
      ],
      specs: [
        ["Codecs", "aptX LL, aptX HD, AAC, SBC"],
        ["Range", "30 m line of sight"],
        ["Inputs", "Optical, 3.5 mm, USB-C"],
      ],
    },
    {
      name: "Cadence Turntable",
      sub: "Audio",
      price: 44900,
      variants: "warm",
      blurb: "A belt-drive deck with a real tonearm and a cartridge you can upgrade.",
      features: [
        "Aluminium S-shaped tonearm with adjustable counterweight",
        "Standard half-inch cartridge mount — upgrade without buying a new deck",
        "Switchable built-in phono stage for amps without one",
      ],
      specs: [
        ["Drive", "Belt, 33⅓ and 45 rpm"],
        ["Platter", "300 mm die-cast aluminium"],
        ["Wow & flutter", "0.11%"],
      ],
    },
    {
      name: "Beacon Action Camera",
      sub: "Cameras",
      price: 32900,
      variants: "tech",
      blurb: "Waterproof to 10 m without a case, with stabilisation that actually holds.",
      features: [
        "Waterproof to 10 m with no housing needed",
        "Horizon-lock stabilisation up to 360° of rotation",
        "Front screen for framing yourself",
      ],
      specs: [
        ["Video", "5.3K/60, 4K/120"],
        ["Photo", "27 MP stills, RAW"],
        ["Battery", "Removable 1,720 mAh"],
      ],
    },
  ],

  "home-kitchen": [
    {
      name: "Ember Dutch Oven",
      sub: "Cookware",
      price: 21900,
      variants: "bold",
      blurb: "Enamelled cast iron with a self-basting lid and a genuinely flat base.",
      features: [
        "Self-basting spikes drip condensation back over the food",
        "Sand-cast in a single piece — no seams to crack",
        "Enamel rated for oven use to 260 °C and for induction",
      ],
      specs: [
        ["Capacity", "5.5 L"],
        ["Weight", "5.9 kg"],
        ["Base", "Ground flat for induction contact"],
      ],
    },
    {
      name: "Halden Knife Block Set",
      sub: "Cookware",
      price: 29900,
      variants: "none",
      blurb: "Five forged knives at 58 HRC, in a magnetic block that fits a drawer.",
      features: [
        "Forged from a single billet with a full bolster and tang",
        "58 HRC edge holds through a season of daily use",
        "Magnetic walnut block stores flat in a drawer or upright",
      ],
      specs: [
        ["Includes", "Chef, santoku, bread, utility, paring"],
        ["Steel", "X50CrMoV15, 58 HRC"],
        ["Edge angle", "15° per side"],
      ],
    },
    {
      name: "Sundial Robot Vacuum",
      sub: "Small Appliances",
      price: 54900,
      variants: "soft",
      blurb: "LiDAR mapping, a self-emptying dock, and no subscription for any feature.",
      features: [
        "LiDAR mapping stores multiple floor plans with no-go zones",
        "Self-emptying dock holds around seven weeks of debris",
        "Every feature works offline — the app is optional",
      ],
      specs: [
        ["Suction", "6,000 Pa"],
        ["Runtime", "180 minutes"],
        ["Bin", "0.4 L onboard, 2.5 L dock"],
      ],
    },
  ],

  "beauty-personal-care": [
    {
      name: "Barrier Repair Cream",
      sub: "Body",
      price: 4600,
      variants: "none",
      blurb: "A thick occlusive balm for hands and elbows that survives hand-washing.",
      features: [
        "Petrolatum-free occlusive layer that still holds through washing",
        "5% urea softens without stinging cracked skin",
        "Unscented and safe for eczema-prone skin",
      ],
      specs: [
        ["Size", "100 ml"],
        ["Key actives", "Urea 5%, shea 15%, ceramides"],
        ["Finish", "Rich, absorbs in ~90 seconds"],
      ],
    },
    {
      name: "Contour Electric Shaver",
      sub: "Hair Tools",
      price: 18900,
      variants: "tech",
      blurb: "A three-head rotary shaver that rinses under the tap and charges over USB-C.",
      features: [
        "Flexing heads track the jaw without pressure",
        "Fully washable head assembly, replaceable as a unit",
        "USB-C charging — a five-minute charge is one shave",
      ],
      specs: [
        ["Runtime", "60 minutes"],
        ["Heads", "3, replaceable every 12 months"],
        ["Wet/dry", "Both, IPX7"],
      ],
    },
    {
      name: "Aurelia Fragrance-Free Deodorant",
      sub: "Body",
      price: 2200,
      variants: "capacity",
      blurb: "Aluminium-free, and it does not stain the armpits of white shirts.",
      features: [
        "Aluminium-free — controls odour rather than sweating",
        "No baking soda, so it will not irritate over time",
        "Leaves no residue on dark or white fabric",
      ],
      specs: [
        ["Size", "75 g stick"],
        ["Key actives", "Magnesium hydroxide, arrowroot"],
        ["Scent", "None"],
      ],
    },
  ],


  "sports-outdoors": [
    {
      name: "Cascade Rain Shell",
      sub: "Apparel",
      price: 27900,
      variants: "apparel",
      blurb: "A three-layer shell with pit zips and a hood that fits over a helmet.",
      features: [
        "Three-layer membrane, 20,000 mm hydrostatic head",
        "Pit zips and a helmet-compatible hood",
        "PFC-free DWR that can be reproofed at home",
      ],
      specs: [
        ["Weight", "410 g in medium"],
        ["Breathability", "20,000 g/m²/24h"],
        ["Seams", "Fully taped"],
      ],
    },
    {
      name: "Competition Kettlebell",
      sub: "Training",
      price: 11900,
      variants: "none",
      blurb: "Single-cast competition bell — same handle diameter at every weight.",
      features: [
        "Single-cast, no welded handle to fail",
        "35 mm handle at every weight, so technique carries over",
        "Powder coat holds chalk without shredding hands",
      ],
      specs: [
        ["Weights", "8–32 kg"],
        ["Handle", "35 mm, powder coated"],
        ["Base", "Flat, 210 mm"],
      ],
    },
    {
      name: "Trail Headlamp",
      sub: "Camping",
      price: 6900,
      variants: "bold",
      blurb: "Reactive dimming, a red night mode, and a battery you can replace.",
      features: [
        "Reactive lighting dims automatically when you look at a map",
        "Red mode preserves night vision and does not wake a tent",
        "Standard 18650 cell — replaceable, and it takes AAAs in a pinch",
      ],
      specs: [
        ["Output", "500 lumens, 120 m beam"],
        ["Runtime", "8 h high, 90 h low"],
        ["Rating", "IPX7"],
      ],
    },
  ],

  "pet-supplies": [
    {
      name: "Meadow Dog Coat",
      sub: "Walking",
      price: 6900,
      variants: "apparel",
      blurb: "Waterproof, fully lined, and it stays on a dog that rolls in things.",
      features: [
        "Waterproof outer with a fleece-lined chest panel",
        "Belly strap keeps it in place through a full roll",
        "Reflective piping on both flanks",
      ],
      specs: [
        ["Sizes", "XS–XXL, back 25–70 cm"],
        ["Fabric", "Recycled polyester, PU coated"],
        ["Care", "Machine wash cold"],
      ],
    },
    {
      name: "Quiet Hours Cat Water Fountain",
      sub: "Cats",
      price: 7900,
      variants: "soft",
      blurb: "A ceramic fountain that runs at 25 dB and takes a standard filter.",
      features: [
        "Ceramic bowl — no plastic to hold biofilm",
        "25 dB pump, quiet enough for a bedroom",
        "Standard carbon filters, sold everywhere",
      ],
      specs: [
        ["Capacity", "2.5 L"],
        ["Pump", "Submersible, removable for cleaning"],
        ["Power", "USB-C, 2 W"],
      ],
    },
    {
      name: "Tracer Pet GPS Tag",
      sub: "Travel",
      price: 9900,
      variants: "bold",
      blurb: "Live GPS with a replaceable battery and no mandatory monthly plan.",
      features: [
        "Live tracking with a 4-second refresh in follow mode",
        "Battery lasts 10 days and is user-replaceable",
        "Works with any collar up to 25 mm",
      ],
      specs: [
        ["Positioning", "GPS, Galileo, Wi-Fi assist"],
        ["Weight", "27 g"],
        ["Rating", "IP67"],
      ],
    },
  ],

  "baby-products": [
    {
      name: "Drift Baby Carrier",
      sub: "Travel",
      price: 15900,
      variants: "soft",
      blurb: "Hip-healthy positioning from newborn to toddler, buckled one-handed.",
      features: [
        "Certified hip-healthy by the International Hip Dysplasia Institute",
        "Adjusts from newborn to 20 kg without an insert",
        "Buckles reachable and operable one-handed",
      ],
      specs: [
        ["Range", "3.5–20 kg"],
        ["Positions", "Front inward, front outward, back, hip"],
        ["Fabric", "Organic cotton, Oeko-Tex"],
      ],
    },
    {
      name: "Lumen Nursery Nightlight",
      sub: "Nursery",
      price: 4200,
      variants: "soft",
      blurb: "Warm 1,800 K light that will not suppress melatonin, dimmable to nothing.",
      features: [
        "1,800 K amber output — no blue spike before sleep",
        "Dims to 0.5 lux, low enough for a night feed",
        "Portable, magnetic base, 30-hour battery",
      ],
      specs: [
        ["Colour temperature", "1,800 K fixed"],
        ["Battery", "30 hours at low"],
        ["Charging", "USB-C or magnetic dock"],
      ],
    },
    {
      name: "Stack Nursery Storage Set",
      sub: "Textiles",
      price: 5900,
      variants: "warm",
      blurb: "Felt bins that hold their shape empty and fit standard shelving.",
      features: [
        "Stiffened felt holds its shape when empty",
        "Sized to fit standard 33 cm cube shelving",
        "Handles stitched through, not glued",
      ],
      specs: [
        ["Includes", "4 bins, 2 lidded boxes"],
        ["Material", "Recycled PET felt"],
        ["Care", "Spot clean"],
      ],
    },
  ],

  "office-products": [
    {
      name: "Quarter Desk Mat",
      sub: "Desks",
      price: 6900,
      variants: "warm",
      blurb: "Full-grain leather that takes a patina instead of peeling like PU.",
      features: [
        "Full-grain leather, 2.4 mm — no coating to flake",
        "Cork backing grips the desk without adhesive",
        "Edges burnished by hand, not cut and sealed",
      ],
      specs: [
        ["Size", "90 × 43 cm"],
        ["Thickness", "2.4 mm plus cork"],
        ["Finish", "Vegetable tanned"],
      ],
    },
    {
      name: "A3 Laminator",
      sub: "Printing",
      price: 11900,
      variants: "none",
      blurb: "Reaches temperature in 60 seconds and reverses out of a jam.",
      features: [
        "60-second warm-up, four roller heat path",
        "Reverse button clears a jam without opening the case",
        "Handles 80–250 micron pouches",
      ],
      specs: [
        ["Width", "A3"],
        ["Speed", "50 cm per minute"],
        ["Pouches", "80–250 micron"],
      ],
    },
    {
      name: "Adjustable Footrest",
      sub: "Seating",
      price: 7900,
      variants: "tech",
      blurb: "Adjustable height and tilt, with a textured surface that grips socks.",
      features: [
        "Height and tilt adjust separately, without tools",
        "Textured surface grips in socks or shoes",
        "Rocking mode keeps ankles moving through the day",
      ],
      specs: [
        ["Height", "9–14 cm"],
        ["Tilt", "0–30°"],
        ["Surface", "460 × 350 mm"],
      ],
    },
  ],

  automotive: [
    {
      name: "Lumen LED Headlight Kit",
      sub: "Power",
      price: 13900,
      variants: "tech",
      blurb: "A proper projector beam pattern with no glare for oncoming traffic.",
      features: [
        "Focused cut-off that does not dazzle oncoming drivers",
        "Copper heat path with a fanless design — nothing to seize",
        "CANbus-ready, no separate decoder for most cars",
      ],
      specs: [
        ["Output", "6,000 lm per pair"],
        ["Colour", "5,000 K neutral white"],
        ["Fitments", "H1, H4, H7, H11, 9005"],
      ],
    },
    {
      name: "Wheel Cleaning Kit",
      sub: "Detailing",
      price: 5200,
      variants: "none",
      blurb: "pH-neutral chemistry that is safe on painted, polished and coated wheels.",
      features: [
        "pH-neutral — safe on diamond-cut and coated finishes",
        "Colour-changing formula shows when iron is dissolved",
        "Includes barrel brushes that reach behind the spokes",
      ],
      specs: [
        ["Includes", "500 ml cleaner, 3 brushes, 2 mitts"],
        ["Coverage", "Approximately 8 full wheel sets"],
        ["Safe on", "Alloy, painted, polished, ceramic-coated"],
      ],
    },
    {
      name: "Roadside Emergency Kit",
      sub: "Interior",
      price: 8900,
      variants: "bold",
      blurb: "Everything for a roadside stop in one case that fits under the boot floor.",
      features: [
        "Reflective triangle, vest, and a 400-lumen work light",
        "Jump leads rated to 600 A with insulated clamps",
        "Case sized to sit under a standard boot floor",
      ],
      specs: [
        ["Case", "42 × 30 × 12 cm"],
        ["Leads", "600 A, 3 m, 8 AWG"],
        ["Includes", "First aid kit, tow strap, gloves"],
      ],
    },
  ],

  "tools-home-improvement": [
    {
      name: "Brushless Circular Saw",
      sub: "Power Tools",
      price: 22900,
      variants: "bold",
      blurb: "Brushless, with a rigid magnesium shoe that stays true after a drop.",
      features: [
        "Magnesium shoe stays flat — the usual failure on a cheap saw",
        "Brushless motor with electronic brake",
        "Rafter hook and a dust port that fits a standard extractor",
      ],
      specs: [
        ["Blade", "184 mm, 24T supplied"],
        ["Cut depth", "62 mm at 90°, 45 mm at 45°"],
        ["Speed", "5,200 rpm"],
      ],
    },
    {
      name: "Solid Beech Workbench",
      sub: "Storage",
      price: 39900,
      variants: "warm",
      blurb: "A solid beech top on a steel frame that does not rack under load.",
      features: [
        "40 mm solid beech top, resurfaceable",
        "Welded steel frame — no bolted joints to loosen",
        "Rated to 500 kg distributed load",
      ],
      specs: [
        ["Size", "150 × 65 × 87 cm"],
        ["Top", "40 mm beech"],
        ["Load", "500 kg"],
      ],
    },
    {
      name: "Thermal Imaging Camera",
      sub: "Measurement",
      price: 34900,
      variants: "tech",
      blurb: "Finds a draught or a hot joint without guessing, in a pocket housing.",
      features: [
        "256 × 192 thermal sensor with a visible-light overlay",
        "Spot, box and line measurement on the device",
        "Exports radiometric images for a report",
      ],
      specs: [
        ["Resolution", "256 × 192 thermal"],
        ["Range", "−20 °C to 550 °C"],
        ["Accuracy", "±2 °C"],
      ],
    },
  ],
};
