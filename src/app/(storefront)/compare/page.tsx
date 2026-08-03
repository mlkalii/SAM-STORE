import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { CompareView } from "@/components/product/compare-view";

export const metadata: Metadata = {
  title: "Compare",
  description: "Line up products side by side across price, rating and specifications.",
  robots: { index: false },
};

export default function ComparePage() {
  return (
    <Container className="py-14">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Compare</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Specifications side by side, including the rows only one of them publishes.
      </p>
      <CompareView />
    </Container>
  );
}
