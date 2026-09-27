import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { categories } from "@/data/categories";
import { storeConfig } from "@/config/store";
import { returnPolicy } from "@/config/returns";
import { warrantyTable } from "@/config/warranty";

export const metadata: Metadata = {
  title: "Warranty",
  description:
    "SAMRUX warranty schedule: cover assigned automatically by department, administered in-house.",
  alternates: { canonical: "/warranty" },
};

/**
 * The warranty schedule.
 *
 * Generated from `config/warranty` and the live department list, so the table a
 * customer reads can never disagree with the warranty shown on a product page.
 */
export default function WarrantyPage() {
  const table = warrantyTable(
    categories.map((category) => ({ slug: category.slug, name: category.name })),
  );

  return (
    <PolicyPage
      title="Warranty"
      updated="July 2026"
      intro="Warranty cover is assigned automatically by department, so you always know what a product carries before you buy it. Claims are administered by SAMRUX rather than passed to the manufacturer."
      sections={[
        {
          heading: "The schedule",
          paragraphs: [
            "Every product inherits the warranty for the department it is filed in. It is shown on the product page, in the buy panel and on your invoice.",
          ],
          bullets: table.map(
            (entry) => `${entry.policy.label} — ${entry.departments.join(", ")}`,
          ),
        },
        ...table.map((entry) => ({
          heading: entry.policy.label,
          paragraphs: [entry.policy.summary],
          bullets: entry.departments,
        })),
        {
          heading: "What a warranty covers",
          paragraphs: [
            "Defects in materials and workmanship under normal use. Cover starts on the delivery date, not the order date.",
          ],
          bullets: [
            "Manufacturing faults that appear in normal use",
            "Components that fail before the end of the cover period",
            "Anything that arrives already defective, whatever the department",
          ],
        },
        {
          heading: "What it does not cover",
          bullets: [
            "Accidental damage, misuse or unauthorised modification",
            "Normal wear — worn soles, faded fabric, depleted consumables",
            "Batteries and other consumable parts beyond their rated life",
            "Damage from using the product outside its stated purpose",
          ],
        },
        {
          heading: "Making a claim",
          bullets: [
            "Open the order under Orders in your account and choose the product",
            `Or email ${storeConfig.supportEmail} with the order reference and a photograph`,
            "We assess the claim ourselves — you do not need to contact the manufacturer",
            "Approved claims are repaired, replaced or refunded, in that order of preference",
          ],
        },
        {
          heading: "Warranty and the return policy",
          paragraphs: [
            `The two are separate. The return policy gives you ${returnPolicy.windowDays} days to change your mind on an eligible product. The warranty covers faults for its whole period, which is usually much longer.`,
            "Fashion is covered by the return policy alone. Grocery carries no warranty, but anything that arrives spoiled, damaged or past date is refunded in full.",
          ],
        },
        {
          heading: "Who stands behind it",
          paragraphs: [
            "The warranty is SAMRUX LLC's own promise. We sell every product on this site directly, so a warranty claim is made to us and honoured by us.",
            `${storeConfig.legalName}, ${storeConfig.address.line1}, ${storeConfig.address.line2}, ${storeConfig.address.city}, ${storeConfig.address.state} ${storeConfig.address.postcode}. ${storeConfig.phone}.`,
          ],
        },
      ]}
    />
  );
}
