import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { Container } from "@/components/common/container";
import { MotionDiv } from "@/components/common/motion-div";
import { RevealGroup, revealItem } from "@/components/common/reveal";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

const values = [
  {
    icon: Truck,
    title: "Dispatched in 48 hours",
    body: `Tracked to all fifty states. Free over ${formatPrice(siteConfig.freeShippingThreshold)}, flat ${formatPrice(995)} below it.`,
  },
  {
    icon: RotateCcw,
    title: "30-day returns",
    body: "Unused and boxed, sent back on our label. No restocking fee, ever.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty handled here",
    body: "We process the claim ourselves instead of forwarding you to a manufacturer.",
  },
  {
    icon: Headphones,
    title: "Support that answers",
    body: "A real person, within one working day, who can see your order.",
  },
];

export function ValueProps() {
  return (
    <Container as="section" className="py-24">
      <RevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <MotionDiv key={value.title} variants={revealItem}>
            <value.icon className="size-5" aria-hidden />
            <h3 className="mt-4 text-base font-medium">{value.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
          </MotionDiv>
        ))}
      </RevealGroup>
    </Container>
  );
}
