import type { Metadata } from "next";

import { AdminForm, FormGrid, FormSection, TextArea, TextInput } from "@/components/admin/form-shell";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { saveStoreSettingsAction } from "@/app/actions/seller";
import { storeConfig, stateName } from "@/config/store";
import { returnPolicy } from "@/config/returns";
import { requireSeller } from "@/lib/marketplace/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { DEFAULT_COMMISSION_RATE } from "@/lib/marketplace/commission";

export const metadata: Metadata = { title: "Store settings" };

export default async function SellerSettingsPage() {
  const { seller } = await requireSeller("/seller/settings");
  const csrfToken = await getCsrfToken();

  return (
    <>
      <PageHeader
        title="Store settings"
        description="How your store appears to shoppers, and how you are reached."
        breadcrumbs={[{ label: "Seller", href: "/seller" }, { label: "Store settings" }]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="min-w-0">
          <AdminForm
            action={saveStoreSettingsAction}
            csrfToken={csrfToken}
            submitLabel="Save settings"
          >
            <FormSection title="Storefront">
              <TextInput
                name="storeName"
                label="Store name"
                defaultValue={seller.storeName}
                hint={`Your storefront lives at /sellers/${seller.slug}`}
                required
              />
              <TextArea
                name="storeDescription"
                label="Store description"
                rows={5}
                defaultValue={seller.storeDescription}
                hint="Shown on your storefront banner and in the seller directory"
              />
              <FormGrid>
                <TextInput name="logoUrl" label="Logo URL" defaultValue={seller.logoUrl} />
                <TextInput name="bannerUrl" label="Banner URL" defaultValue={seller.bannerUrl} />
              </FormGrid>
            </FormSection>

            <FormSection title="Contact">
              <FormGrid>
                <TextInput
                  name="contactName"
                  label="Contact name"
                  defaultValue={seller.contact.name}
                />
                <TextInput
                  name="contactEmail"
                  label="Contact email"
                  type="email"
                  defaultValue={seller.contact.email}
                  required
                />
              </FormGrid>
              <TextInput
                name="contactPhone"
                label="Contact phone"
                defaultValue={seller.contact.phone}
              />
            </FormSection>

            <FormSection title="Fulfilment promise">
              <FormGrid>
                <TextInput
                  name="dispatchHours"
                  label="Dispatch within (hours)"
                  type="number"
                  defaultValue={String(seller.dispatchHours)}
                  hint="Shown on every product page"
                />
                <TextInput
                  name="returnWindowDays"
                  label="Return window (days)"
                  type="number"
                  defaultValue={String(seller.returnWindowDays)}
                  hint={`Cannot be shorter than the marketplace ${returnPolicy.windowDays} days`}
                />
              </FormGrid>
            </FormSection>
          </AdminForm>
        </Card>

        <div className="space-y-4">
          <Card title="Business record" description="Changes require re-verification">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Legal name</dt>
                <dd className="text-right">{seller.business.legalName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-right capitalize">{seller.business.type.replaceAll("-", " ")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tax ID</dt>
                <dd className="text-right font-mono text-xs">{seller.business.taxId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Registered</dt>
                <dd className="text-right text-xs">
                  {seller.business.city}, {stateName(seller.business.state)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              To change the legal entity, contact {storeConfig.contactEmail}. It is re-verified
              before it takes effect.
            </p>
          </Card>

          <Card title="Commission">
            <div className="flex items-center gap-2">
              <Pill tone="gold">
                {seller.commissionOverride !== undefined
                  ? `${seller.commissionOverride}%`
                  : `${DEFAULT_COMMISSION_RATE}%`}
              </Pill>
              <span className="text-xs text-muted-foreground">
                {seller.commissionOverride !== undefined ? "negotiated rate" : "standard rate"}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Some departments carry their own rate — electronics and grocery are lower, fashion
              and beauty higher. Your invoice shows the exact rule applied to every order.
            </p>
          </Card>

          <Card title="Marketplace policies">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Ships to all fifty US states, rates set marketplace-wide.</li>
              <li>{returnPolicy.windowDays}-day returns from delivery on eligible products.</li>
              <li>Warranty is assigned automatically by department.</li>
              <li>
                Refunds reach customers within {returnPolicy.refundBusinessDaysMin}–
                {returnPolicy.refundBusinessDaysMax} business days of approval.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
