import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { organizationJsonLd, jsonLd } from "@/lib/structured-data";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  applicationName: siteConfig.name,
  keywords: [
    "electronics",
    "home and kitchen",
    "beauty",
    "sports",
    "pet supplies",
    "baby products",
    "office",
    "automotive",
    "tools",
  ],
};

export const viewport: Viewport = {
  // The chrome is dark but the page canvas is white — browsers should tint to
  // the header, which is what sits under the status bar.
  themeColor: "#0a0a0b",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <head>
        {/* Product imagery is served from here — open the connection early. */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(organizationJsonLd(siteConfig)),
          }}
        />
      </head>
      <body className="min-h-full font-sans">
        {/*
          Deliberately bare. The storefront chrome lives in the `(storefront)`
          group and the admin brings its own shell, so neither surface inherits
          the other's furniture. Only the toaster is shared.
        */}
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
