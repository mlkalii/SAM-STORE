import type { Metadata } from "next";

import { AddressManager } from "@/components/account/address-manager";
import { Panel } from "@/components/account/account-ui";
import { requireUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";

export const metadata: Metadata = { title: "Address book", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser();
  const csrfToken = await getCsrfToken();

  return (
    <Panel
      title="Address book"
      description="Saved addresses are offered at checkout. The default is pre-selected."
    >
      <AddressManager csrfToken={csrfToken} addresses={user.addresses} />
    </Panel>
  );
}
