import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/common/container";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review your bag before checkout.",
};

export default function CartPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-5xl tracking-tight">Your bag</h1>
      <CartView />
    </Container>
  );
}
