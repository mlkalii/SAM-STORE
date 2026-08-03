"use client";

import { CheckCircle2, CircleDashed, Truck } from "lucide-react";
import * as React from "react";

import { saveSettingsAction } from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  FormSection,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";
import { Card, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import type { StoreSettings } from "@/lib/admin/stores";
import { formatPrice } from "@/lib/format";

interface ProviderRow {
  id: string;
  label: string;
  description: string;
  requiredEnv: string[];
  offline: boolean;
  wallet: boolean;
  configured: boolean;
}

interface ZoneRow {
  id: string;
  label: string;
  countries: string[];
}

interface MethodRow {
  id: string;
  zone: string;
  label: string;
  description: string;
  rate: number;
  freeOver?: number;
  minDays: number;
  maxDays: number;
}

const SECTIONS = [
  "store",
  "currency",
  "taxes",
  "shipping",
  "notifications",
  "payments",
  "appearance",
  "seo",
  "backup",
] as const;

export function SettingsForm({
  csrfToken,
  settings,
  canEdit,
  providers,
  zones,
  methods,
}: {
  csrfToken: string;
  settings: StoreSettings;
  canEdit: boolean;
  providers: ProviderRow[];
  zones: ZoneRow[];
  methods: MethodRow[];
}) {
  const [section, setSection] = React.useState<(typeof SECTIONS)[number]>("store");

  return (
    <div className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)]">
      <nav aria-label="Settings groups" className="flex flex-wrap gap-1 lg:flex-col">
        {SECTIONS.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={section === entry ? "secondary" : "ghost"}
            className="h-8 justify-start px-3 text-xs capitalize"
            onClick={() => setSection(entry)}
          >
            {entry}
          </Button>
        ))}
      </nav>

      <div className="min-w-0 space-y-4">
        {!canEdit ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-xs text-amber-800 dark:text-amber-300">
            Your role can view settings but not change them. Saving will be refused server-side.
          </div>
        ) : null}

        {/*
          One form, every field. Settings save as a whole so a partially-filled
          section can never blank out another — the action reads each field by
          name and only writes what it receives.
        */}
        <AdminForm
          action={saveSettingsAction}
          csrfToken={csrfToken}
          submitLabel="Save settings"
          disabled={!canEdit}
        >
          <div className={section === "store" ? "" : "hidden"}>
            <FormSection title="Store information">
              <FormGrid>
                <TextInput name="storeName" label="Store name" defaultValue={settings.storeName} />
                <TextInput name="legalName" label="Legal name" defaultValue={settings.legalName} />
              </FormGrid>
              <FormGrid>
                <TextInput
                  name="supportEmail"
                  label="Primary email"
                  type="email"
                  hint="Used as the sender on every transactional email"
                  defaultValue={settings.supportEmail}
                />
                <TextInput
                  name="contactEmail"
                  label="Secondary email"
                  type="email"
                  hint="Shown on the contact page"
                  defaultValue={settings.contactEmail}
                />
              </FormGrid>
              <FormGrid>
                <TextInput name="phone" label="Phone" defaultValue={settings.phone} />
                <TextInput
                  name="addressLine"
                  label="Registered address"
                  defaultValue={settings.addressLine}
                />
              </FormGrid>
              <CheckboxInput
                name="maintenanceMode"
                label="Maintenance mode"
                hint="Storefront shows a holding page; the admin stays reachable"
                defaultChecked={settings.maintenanceMode}
              />
            </FormSection>
          </div>

          <div className={section === "currency" ? "" : "hidden"}>
            <FormSection title="Currency and units">
              <FormGrid>
                <TextInput name="currency" label="Currency code" defaultValue={settings.currency} />
                <TextInput
                  name="currencySymbol"
                  label="Symbol"
                  defaultValue={settings.currencySymbol}
                />
              </FormGrid>
              <SelectInput
                name="weightUnit"
                label="Weight unit"
                defaultValue={settings.weightUnit}
                options={[
                  { value: "kg", label: "Kilograms" },
                  { value: "lb", label: "Pounds" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Prices are stored as integer cents everywhere, so changing the symbol never
                introduces a rounding error.
              </p>
            </FormSection>
          </div>

          <div className={section === "taxes" ? "" : "hidden"}>
            <FormSection title="Taxes">
              <FormGrid>
                <TextInput
                  name="defaultTaxRate"
                  label="Default rate (%)"
                  inputMode="decimal"
                  defaultValue={(settings.defaultTaxRate * 100).toFixed(2)}
                />
                <TextInput
                  name="freeShippingThreshold"
                  label="Free shipping over"
                  inputMode="decimal"
                  defaultValue={(settings.freeShippingThreshold / 100).toFixed(2)}
                />
              </FormGrid>
              <CheckboxInput
                name="pricesIncludeTax"
                label="Displayed prices include tax"
                defaultChecked={settings.pricesIncludeTax}
              />
              <p className="text-xs text-muted-foreground">
                Destination rates override this default per country and state. The checkout
                recalculates tax server-side on every request.
              </p>
            </FormSection>
          </div>

          <div className={section === "notifications" ? "" : "hidden"}>
            <FormSection title="Notifications">
              <CheckboxInput
                name="notifyOnNewOrder"
                label="Email staff on every new order"
                defaultChecked={settings.notifyOnNewOrder}
              />
              <CheckboxInput
                name="notifyOnLowStock"
                label="Email staff when stock runs low"
                defaultChecked={settings.notifyOnLowStock}
              />
              <TextInput
                name="lowStockThreshold"
                label="Low stock threshold"
                type="number"
                hint="Units at or below this count raise an alert"
                defaultValue={String(settings.lowStockThreshold)}
              />
            </FormSection>
          </div>

          <div className={section === "appearance" ? "" : "hidden"}>
            <FormSection title="Appearance">
              <p className="text-sm text-muted-foreground">
                The storefront runs a light luxury palette with dark navigation and footer; the
                admin follows your system theme and can be flipped with the toggle in the top bar.
                Section visibility is managed under Content.
              </p>
            </FormSection>
          </div>

          <div className={section === "seo" ? "" : "hidden"}>
            <FormSection title="SEO">
              <TextInput
                name="seoTitleTemplate"
                label="Title template"
                hint="%s is replaced by the page title"
                defaultValue={settings.seoTitleTemplate}
              />
              <TextArea
                name="seoDescription"
                label="Default description"
                rows={3}
                defaultValue={settings.seoDescription}
              />
              <p className="text-xs text-muted-foreground">
                Sitemap and robots are generated from the live catalogue; product, category and
                breadcrumb structured data are emitted per page.
              </p>
            </FormSection>
          </div>

          <div className={section === "backup" ? "" : "hidden"}>
            <FormSection title="Backup">
              <SelectInput
                name="backupFrequency"
                label="Frequency"
                defaultValue={settings.backupFrequency}
                options={[
                  { value: "hourly", label: "Hourly" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Last backup:{" "}
                {settings.lastBackupAt ? settings.lastBackupAt.slice(0, 16).replace("T", " ") : "—"}.
                Backups run against the database once one is connected; the in-memory stores are
                rebuilt from seed on restart.
              </p>
            </FormSection>
          </div>
        </AdminForm>

        {/* Read-only reference panels — these are configuration, not settings. */}
        {section === "shipping" ? (
          <div className="space-y-4">
            <Card title="Zones" description="Countries are matched top to bottom" bodyClassName="p-0">
              <ul className="divide-y">
                {zones.map((zone) => (
                  <li key={zone.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{zone.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {zone.countries.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Methods" bodyClassName="p-0">
              <ul className="divide-y">
                {methods.map((method) => (
                  <li key={method.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Truck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{method.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{method.description}</p>
                    </div>
                    <Pill tone="neutral">{method.zone}</Pill>
                    <span className="text-xs text-muted-foreground">
                      {method.minDays}–{method.maxDays} days
                    </span>
                    <span className="w-20 text-right font-mono text-xs tabular-nums">
                      {method.rate === 0 ? "Free" : formatPrice(method.rate)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {section === "payments" ? (
          <Card
            title="Payment providers"
            description="Credentials come from the environment. Nothing is stored here."
            bodyClassName="p-0"
          >
            <ul className="divide-y">
              {providers.map((provider) => (
                <li key={provider.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                  {provider.configured ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {provider.label}
                      {provider.offline ? <Pill tone="neutral">offline</Pill> : null}
                      {provider.wallet ? <Pill tone="info">wallet</Pill> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                    {provider.requiredEnv.length > 0 ? (
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {provider.requiredEnv.join("  ")}
                      </p>
                    ) : null}
                  </div>
                  <Pill tone={provider.configured ? "positive" : "warning"}>
                    {provider.configured ? "configured" : "needs credentials"}
                  </Pill>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
