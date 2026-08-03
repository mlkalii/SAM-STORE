import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { shippingRegion, storeConfig } from "@/config/store";
import { getCsrfToken } from "@/lib/auth/csrf";
import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about an order, a warranty or a product spec? Write to a real person.",
};

const faqs = [
  {
    id: "shipping",
    question: "How fast do orders ship?",
    answer:
      `Within 48 hours, Monday to Friday. Orders arrive in two to four days anywhere in the fifty states. Free over ${formatPrice(siteConfig.freeShippingThreshold)}, flat ${formatPrice(995)} below that.`,
  },
  {
    id: "returns",
    question: "What is the return policy?",
    answer:
      "Thirty days from delivery, unused and in its original packing. We cover return postage on the first exchange of any order.",
  },
  {
    id: "warranty",
    question: "How do warranty claims work?",
    answer:
      "We handle them, not the manufacturer. Send us the order number and a photo; if it is covered we ship the replacement before the faulty unit reaches us.",
  },
  {
    id: "stock",
    question: "Why is something out of stock?",
    answer:
      "Because each department is capped at fifty-two products, we do not overstock. Ask us and we will tell you the actual restock date rather than a guess.",
  },
];

export default async function ContactPage() {
  const csrfToken = await getCsrfToken();

  return (
    <Container className="py-16">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Contact
        </p>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1] tracking-tight text-balance">
          A person reads every message.
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="space-y-8">
          <div className="flex gap-4">
            <Mail className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <a
                href={`mailto:${storeConfig.supportEmail}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {storeConfig.supportEmail}
              </a>
              <p className="text-sm text-muted-foreground">
                Orders, returns and warranty — replies within one business day.
              </p>
              <a
                href={`mailto:${storeConfig.contactEmail}`}
                className="mt-2 block font-medium underline-offset-4 hover:underline"
              >
                {storeConfig.contactEmail}
              </a>
              <p className="text-sm text-muted-foreground">
                Company, press, wholesale, seller applications and legal.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Phone className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <a
                href={`tel:${storeConfig.phoneHref}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {storeConfig.phone}
              </a>
              <p className="text-sm text-muted-foreground">
                Support line, {storeConfig.language}.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{storeConfig.legalName}</p>
              <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                {storeConfig.address.line1}, {storeConfig.address.line2}
                <br />
                {storeConfig.address.city}, {storeConfig.address.state}{" "}
                {storeConfig.address.postcode}
                <br />
                {storeConfig.address.country}
              </address>
              <p className="mt-1 text-sm text-muted-foreground">Visits by appointment.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Monday to Friday</p>
              <p className="text-sm text-muted-foreground">
                09:00 – 18:00 {storeConfig.timezone.split("/")[1].replace("_", " ")} time
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Shipping to {shippingRegion.label.toLowerCase()}.
              </p>
            </div>
          </div>

          <Accordion className="pt-4">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} id={faq.id} value={faq.id} className="scroll-mt-24">
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal delay={0.08}>
          <ContactForm csrfToken={csrfToken} />
        </Reveal>
      </div>
    </Container>
  );
}
