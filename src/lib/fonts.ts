import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";

/**
 * Each face gets its own CSS variable name. `globals.css` maps them onto the
 * Tailwind theme tokens (`--font-sans`, `--font-display`, `--font-mono`), so no
 * variable ever references itself.
 */

/** Body / UI typeface. */
export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Editorial display typeface used for headings. */
export const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

/** Monospace, used for prices, SKUs and micro-labels. */
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const fontVariables = [
  fontSans.variable,
  fontDisplay.variable,
  fontMono.variable,
].join(" ");
