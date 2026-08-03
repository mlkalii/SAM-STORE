import { StorefrontFrame } from "@/components/layout/storefront-frame";

/**
 * Storefront layout.
 *
 * Every customer-facing route lives in this group. Route groups do not appear
 * in the URL, so `/shop` is still `/shop` — the group exists purely to keep the
 * shop chrome off `/admin`.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontFrame>{children}</StorefrontFrame>;
}
