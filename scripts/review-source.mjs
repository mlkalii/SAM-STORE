/**
 * Copy pools for the generated review set. Reviews are written for this project
 * — none are copied from any retailer.
 */

export const REVIEWER_NAMES = [
  "Amara O.", "Lucas M.", "Priya N.", "Tomas H.", "Sofia R.", "Daniel K.", "Yuki T.",
  "Marta L.", "Owen B.", "Ines C.", "Jonas W.", "Nadia S.", "Felix A.", "Clara D.",
  "Hugo P.", "Leila F.", "Marco V.", "Anouk J.", "Ravi S.", "Elena G.", "Noah E.",
  "Sanne K.", "Diego A.", "Mei L.", "Oskar N.", "Aisha B.", "Pieter DV.", "Rosa M.",
  "Kai H.", "Farah Z.", "Erik S.", "Camila T.", "Jonah R.", "Lina W.", "Andrei P.",
  "Bea C.", "Tariq M.", "Hanna V.", "Sam O.", "Nour A.",
];

/** Short, plausible ownership contexts appended to some review bodies. */
export const CONTEXTS = [
  "Been using it daily for about three months now.",
  "Bought it after returning a cheaper one that lasted six weeks.",
  "Second one I've owned — replaced a five-year-old unit.",
  "Ordered on a Thursday, arrived Monday.",
  "Bought it as a gift and ended up ordering a second for myself.",
  "Using it several times a week rather than daily.",
  "Replaced something twice the price and have not missed it.",
];

export const TITLES = {
  5: [
    "Exactly what was described",
    "Worth the money",
    "No notes",
    "Better than the one it replaced",
    "Would buy again without thinking",
    "Does the job properly",
  ],
  4: [
    "Very good, one small gripe",
    "Happy with it",
    "Solid, minor niggles",
    "Good — nearly perfect",
    "Recommended with one caveat",
  ],
  3: [
    "Fine, not remarkable",
    "Does the job, feels average",
    "Mixed feelings",
    "OK for the price",
  ],
  2: [
    "Not quite right for me",
    "Expected more",
    "Disappointing on one point",
  ],
};

export const BODIES = {
  5: [
    "The spec sheet matched reality, which is more than I can say for the last three I tried. Build quality is genuinely good and it has not developed any rattles or quirks.",
    "I was sceptical at this price but the finish is excellent and it has taken daily use without complaint. Packaging was plastic-free too, which I appreciated.",
    "Setup took five minutes and it has done exactly what it says since. Nothing clever, nothing annoying — it just works.",
    "Bought it partly on the warranty terms and have not needed them, which is the ideal outcome. Feels like it will outlast the guarantee comfortably.",
    "Noticeably better made than the mainstream option I was comparing against. The details you only notice after a month are all right.",
  ],
  4: [
    "Very pleased overall. The only thing I would change is the documentation — it assumes you already know what you are doing.",
    "Performs well and feels durable. Took off a star because the first one arrived with a cosmetic mark; support replaced it in two days without argument.",
    "Does everything promised. It is slightly bulkier than the photos suggest, so measure your space before ordering.",
    "Great quality for the money. Would be five stars if the accessories included were a little better.",
  ],
  3: [
    "It is competent but unexciting. Nothing wrong with it, nothing that made me glad I chose it over the alternatives.",
    "Works as intended, though I expected a bit more refinement at this price. Fine if you catch it on a discount.",
    "Mixed — the core function is good but the finish is average. I would probably look around before rebuying.",
  ],
  2: [
    "Quality seems fine but it was not the right fit for how I intended to use it. Returns were painless, to be fair.",
    "Ran into a fault in the first fortnight. Replacement arrived quickly and has been fine, but the first impression was not great.",
  ],
};
