import type { Category, Product } from "@/types";

/**
 * Serialise a JSON-LD payload for embedding in a <script> tag.
 *
 * `JSON.stringify` alone is not enough: a value containing `</script>` would
 * terminate the tag and start injecting markup. The catalogue was trusted
 * data when this file was written, but staff can now edit product names, so
 * every embedded character that could close the tag is escaped to its unicode
 * form — valid JSON, inert in HTML.
 */
export function jsonLd(payload: object): string {
  return JSON.stringify(payload)
    .replaceAll("<", "\u003c")
    .replaceAll(">", "\u003e")
    .replaceAll("&", "\u0026");
}
import { currencyConfig, storeConfig } from "@/config/store";
import { returnEligibility, returnPolicy } from "@/config/returns";
import { warrantyFor } from "@/config/warranty";

/**
 * schema.org payloads for rich results. Everything is derived from our own
 * catalogue, so nothing here needs escaping beyond `JSON.stringify`.
 */

const availability: Record<Product["stockStatus"], string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
};

export function productJsonLd(product: Product, siteUrl: string) {
  const url = `${siteUrl}/shop/${product.slug}`;
  const warranty = warrantyFor(product.category);
  const eligibility = returnEligibility(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    mpn: product.sku,
    category: product.subcategory,
    image: product.images.map((image) => image.src),
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currencyConfig.code,
      price: (product.price / 100).toFixed(2),
      availability: availability[product.stockStatus],
      itemCondition: "https://schema.org/NewCondition",
      // Return terms come from the policy configuration, not the product row,
      // so the rich result always matches the published policy.
      ...(eligibility.returnable
        ? {
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: storeConfig.address.countryCode,
              returnPolicyCategory:
                "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: returnPolicy.windowDays,
              returnMethod: "https://schema.org/ReturnByMail",
              returnFees: "https://schema.org/FreeReturn",
            },
          }
        : {
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: storeConfig.address.countryCode,
              returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
            },
          }),
    },
    ...(warranty.kind === "months"
      ? {
          warranty: {
            "@type": "WarrantyPromise",
            durationOfWarranty: {
              "@type": "QuantitativeValue",
              value: warranty.months,
              unitCode: "MON",
            },
            warrantyScope: "https://schema.org/WarrantyScope",
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; url: string }[],
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${siteUrl}${entry.url}`,
    })),
  };
}

export function categoryJsonLd(category: Category, products: Product[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${siteUrl}/categories/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/shop/${product.slug}`,
        name: product.name,
      })),
    },
  };
}

export function organizationJsonLd(site: { name: string; url: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: site.name,
    legalName: storeConfig.legalName,
    url: site.url,
    description: site.description,
    email: storeConfig.supportEmail,
    telephone: storeConfig.phoneHref,
    currenciesAccepted: currencyConfig.code,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${storeConfig.address.line1}, ${storeConfig.address.line2}`,
      addressLocality: storeConfig.address.city,
      addressRegion: storeConfig.address.state,
      postalCode: storeConfig.address.postcode,
      addressCountry: storeConfig.address.countryCode,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: storeConfig.supportEmail,
        telephone: storeConfig.phoneHref,
        areaServed: storeConfig.address.countryCode,
        availableLanguage: storeConfig.language,
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: storeConfig.contactEmail,
        areaServed: storeConfig.address.countryCode,
        availableLanguage: storeConfig.language,
      },
    ],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
