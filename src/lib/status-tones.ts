import type { Pill } from "@/components/admin/ui";

type Tone = React.ComponentProps<typeof Pill>["tone"];

/**
 * The one mapping from order status to display tone.
 *
 * Several admin surfaces render order-status pills; they must never
 * disagree about whether "shipped" is blue or green. Import this instead of
 * declaring a local copy.
 */
export const ORDER_STATUS_TONE: Record<string, Tone> = {
  processing: "warning",
  packed: "info",
  shipped: "info",
  "out-for-delivery": "info",
  delivered: "positive",
  cancelled: "danger",
  refunded: "danger",
  returned: "danger",
};
