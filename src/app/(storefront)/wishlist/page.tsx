import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { WishlistView } from "@/components/product/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you have saved for later.",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <Container className="py-14">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Wishlist</h1>
      <WishlistView />
    </Container>
  );
}
