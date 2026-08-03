"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { registerSellerAction } from "@/app/actions/seller";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  FormSection,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";
import { returnPolicy } from "@/config/returns";

/**
 * Seller application.
 *
 * Reuses the admin form primitives rather than a second set of inputs — the
 * validation, error display and CSRF handling are already correct there, and a
 * duplicate would drift.
 */
export function SellerRegistrationForm({
  csrfToken,
  states,
  defaults,
}: {
  csrfToken: string;
  states: { code: string; name: string }[];
  defaults: { contactName: string; contactEmail: string; contactPhone: string };
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <AdminForm
        action={registerSellerAction}
        csrfToken={csrfToken}
        submitLabel="Submit application"
        pendingLabel="Submitting…"
        onSuccess={() => router.push("/seller/status")}
      >
        <FormSection title="Your store">
          <TextInput
            name="storeName"
            label="Store name"
            hint="This is your storefront URL and what shoppers see on every product"
            required
          />
          <TextArea
            name="storeDescription"
            label="Store description"
            rows={4}
            hint="What you sell and why someone should buy it from you"
          />
          <FormGrid>
            <TextInput name="logoUrl" label="Logo URL" placeholder="https://…" />
            <TextInput name="bannerUrl" label="Banner URL" placeholder="https://…" />
          </FormGrid>
        </FormSection>

        <FormSection title="Business information">
          <FormGrid>
            <TextInput name="legalName" label="Legal business name" required />
            <SelectInput
              name="businessType"
              label="Business type"
              defaultValue="llc"
              options={[
                { value: "llc", label: "LLC" },
                { value: "corporation", label: "Corporation" },
                { value: "partnership", label: "Partnership" },
                { value: "sole-proprietor", label: "Sole proprietor" },
                { value: "individual", label: "Individual" },
              ]}
            />
          </FormGrid>
          <FormGrid>
            <TextInput
              name="taxId"
              label="Tax ID (EIN or SSN)"
              hint="Stored masked. Verified against your W-9."
              required
            />
            <TextInput name="registrationNumber" label="Registration number" />
          </FormGrid>
        </FormSection>

        <FormSection title="Business address">
          <TextInput name="addressLine1" label="Street address" required />
          <TextInput name="addressLine2" label="Suite, unit, floor" />
          <FormGrid>
            <TextInput name="city" label="City" required />
            <SelectInput
              name="state"
              label="State"
              defaultValue="FL"
              options={states.map((state) => ({ value: state.code, label: state.name }))}
            />
          </FormGrid>
          <FormGrid>
            <TextInput name="postcode" label="ZIP code" required />
            <TextInput name="country" label="Country" defaultValue="United States" disabled />
          </FormGrid>
          <p className="text-xs text-muted-foreground">
            SAMRUX ships within the United States, so sellers must be able to ship domestically.
          </p>
        </FormSection>

        <FormSection title="Contact">
          <FormGrid>
            <TextInput name="contactName" label="Contact name" defaultValue={defaults.contactName} />
            <TextInput
              name="contactEmail"
              label="Contact email"
              type="email"
              defaultValue={defaults.contactEmail}
              required
            />
          </FormGrid>
          <TextInput
            name="contactPhone"
            label="Contact phone"
            defaultValue={defaults.contactPhone}
            required
          />
        </FormSection>

        <FormSection title="Agreement">
          <CheckboxInput
            name="terms"
            label="I accept the SAMRUX seller agreement"
            hint={`Including the ${returnPolicy.windowDays}-day return policy, the department warranty schedule, and marketplace commission.`}
          />
        </FormSection>
      </AdminForm>
    </div>
  );
}
