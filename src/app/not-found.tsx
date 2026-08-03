import Link from "next/link";

import { Container } from "@/components/common/container";
import { StorefrontFrame } from "@/components/layout/storefront-frame";
import { Button } from "@/components/ui/button";

/**
 * Unmatched URLs render outside the `(storefront)` group, so this page has to
 * bring the chrome with it.
 */
export default function NotFound() {
  return (
    <StorefrontFrame>
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-6 font-display text-6xl tracking-tight">
          This one sold out of existence
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground text-pretty">
          The page you asked for is not here. The catalogue, thankfully, still
          is.
        </p>
        <div className="mt-8 flex gap-3">
          <Button render={<Link href="/shop" />}>Browse the shop</Button>
          <Button variant="outline" render={<Link href="/" />}>
            Back home
          </Button>
        </div>
      </Container>
    </StorefrontFrame>
  );
}
