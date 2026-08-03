import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";
import { requirePermission } from "@/lib/admin/auth";
import { can } from "@/config/admin";
import { settingsStore } from "@/lib/admin/stores";
import { getCsrfToken } from "@/lib/auth/csrf";
import { SHIPPING_METHODS, SHIPPING_ZONES } from "@/lib/commerce/shipping";
import { allPaymentProviders } from "@/lib/payments/registry";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const staff = await requirePermission("settings.view", "/admin/settings");
  const csrfToken = await getCsrfToken();

  // `isConfigured()` reads the environment; nothing here exposes a secret, only
  // whether one is present.
  const providers = allPaymentProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    description: provider.description,
    requiredEnv: provider.requiredEnv,
    offline: provider.offline,
    wallet: provider.wallet,
    configured: provider.isConfigured(),
  }));

  return (
    <SettingsForm
      csrfToken={csrfToken}
      settings={settingsStore.get()}
      canEdit={can(staff.role, "settings.edit")}
      providers={providers}
      zones={SHIPPING_ZONES.map((zone) => ({
        id: zone.id,
        label: zone.label,
        countries: zone.countries,
      }))}
      methods={SHIPPING_METHODS.map((method) => ({
        id: method.id,
        label: method.label,
        description: method.description,
        rate: method.rate,
        zone: method.zone,
        freeOver: method.freeOver,
        minDays: method.minDays,
        maxDays: method.maxDays,
      }))}
    />
  );
}
