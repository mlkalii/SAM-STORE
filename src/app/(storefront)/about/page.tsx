import type { Metadata } from "next";
import Link from "next/link";

import { CategoryIcon } from "@/components/common/category-icon";
import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/data/categories";
import { getCatalogMeta } from "@/data/products";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "How SAMRUX selects products, what gets rejected, and why every department is kept deliberately small.",
};

const chapters = [
  {
    year: "2019",
    title: "One department, one buyer",
    body: "SAMRUX started as an electronics shortlist — twelve products a single buyer was willing to put their name against. The list was useful precisely because it was short.",
  },
  {
    year: "2022",
    title: "The cap",
    body: "As departments were added we kept each one deliberately small. Adding something means removing something. It is the only rule that has never been relaxed.",
  },
  {
    year: "2025",
    title: "Warranty in-house",
    body: "We stopped forwarding warranty claims to manufacturers. If we sold it, we handle it — which quietly changed what we were willing to stock in the first place.",
  },
];

const criteria = [
  {
    title: "Serviceable",
    body: "Spare parts exist and are sold to consumers. A sealed unit with a two-year lifespan does not make the list.",
  },
  {
    title: "Honestly specified",
    body: "We test the headline number. If the claimed coverage, runtime or brightness does not hold up, the product is rejected.",
  },
  {
    title: "Supported",
    body: "There is a real support channel behind it — a firmware roadmap, a parts line, a human on the phone.",
  },
  {
    title: "Priced without theatre",
    body: "No permanent sale. When a product is reduced, the compare-at price is its regular price and the saving shown is the difference between the two.",
  },
];

export default async function AboutPage() {
  const meta = await getCatalogMeta();

  return (
    <>
      <Container className="py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            About {siteConfig.name}
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.98] tracking-tight text-balance">
            A department store with a rejection rate.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-pretty">
            {siteConfig.name} is an online retail store operated by {siteConfig.legalName}. Every
            product on this site is sold and shipped directly by us.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {meta.count} products across {categories.length} departments. Every one of
            them displaced something else, because each department is kept deliberately small. That cap
            is the entire product strategy — it forces a decision instead of a listing.
          </p>
        </Reveal>
      </Container>

      <Container as="section" className="py-16">
        <SectionHeading eyebrow="Timeline" title="Three decisions that set the rules" />
        <div className="mt-14">
          {chapters.map((chapter, index) => (
            <Reveal key={chapter.year} delay={index * 0.05}>
              <div className="grid gap-4 py-10 md:grid-cols-[8rem_1fr]">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  {chapter.year}
                </p>
                <div>
                  <h3 className="font-display text-3xl tracking-tight">{chapter.title}</h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground text-pretty">
                    {chapter.body}
                  </p>
                </div>
              </div>
              {index < chapters.length - 1 ? <Separator /> : null}
            </Reveal>
          ))}
        </div>
      </Container>

      <Container as="section" id="selection" className="py-16 scroll-mt-32">
        <SectionHeading
          eyebrow="Selection"
          title="What has to be true before we stock it"
          description="Four tests. A product that fails any one of them does not make the catalogue, however well it would sell."
        />
        <div className="mt-14 grid gap-10 sm:grid-cols-2">
          {criteria.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <h3 className="font-display text-2xl tracking-tight">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>

      <Container as="section" className="py-16">
        <SectionHeading
          eyebrow="Departments"
          title="Where the catalogue sits today"
          description="A small range per department, reviewed quarterly."
        />
        <div className="mt-14 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={index * 0.03}>
              <Link
                href={`/categories/${category.slug}`}
                className="group flex items-start gap-3"
              >
                <CategoryIcon
                  name={category.icon}
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <span>
                  <span className="block font-medium group-hover:underline group-hover:underline-offset-4">
                    {category.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {category.tagline}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </>
  );
}
