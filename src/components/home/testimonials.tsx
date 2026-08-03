import { Quote } from "lucide-react";

import { Container } from "@/components/common/container";
import { MotionDiv } from "@/components/common/motion-div";
import { RevealGroup, revealItem } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "I bought a monitor and a desk chair eight months apart and both arrived with the same care. That consistency is the reason I stopped comparison shopping.",
    name: "Priya N.",
    role: "Verified buyer · Electronics, Office",
  },
  {
    quote:
      "The spec sheets are honest. The air purifier's coverage figure matched what it actually did in my flat, which is not something I can say about the last three I owned.",
    name: "Tom H.",
    role: "Verified buyer · Home & Kitchen",
  },
  {
    quote:
      "A warranty claim on a drill took one email and no forwarding to the manufacturer. Replacement shipped the next morning.",
    name: "Sofia R.",
    role: "Verified buyer · Tools & Home Improvement",
  },
];

export function Testimonials() {
  return (
    <Container as="section" className="py-24">
      <SectionHeading
        eyebrow="Owners"
        title="What happens after the honeymoon"
        description="We ask buyers to write back six months in, once the newness has worn off. These are unedited."
        align="center"
      />

      <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <MotionDiv key={testimonial.name} variants={revealItem}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-6">
                <Quote className="size-5 text-muted-foreground" aria-hidden />
                <blockquote className="flex-1 text-pretty leading-relaxed">
                  {testimonial.quote}
                </blockquote>
                <footer className="text-sm">
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-muted-foreground">{testimonial.role}</p>
                </footer>
              </CardContent>
            </Card>
          </MotionDiv>
        ))}
      </RevealGroup>
    </Container>
  );
}
