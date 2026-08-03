"use client";

import * as React from "react";

import { useCart } from "@/components/providers/cart-provider";

/**
 * Empties the cart once an order genuinely exists.
 *
 * Mounted only on the confirmation page, which is reachable only after
 * `placeOrder` has written the order — so the basket is never thrown away for
 * an order that failed validation or payment.
 */
export function ClearCartOnSuccess() {
  const { clear } = useCart();

  React.useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
