import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerNotes } from "@/components/admin/customer-notes";
import { Card, Detail, PageHeader, Pill } from "@/components/admin/ui";
import { can } from "@/config/admin";
import { requirePermission } from "@/lib/admin/auth";
import { noteStore } from "@/lib/admin/stores";
import { userStore } from "@/lib/auth/user-store";
import { adminOrders } from "@/lib/admin";
import { getCsrfToken } from "@/lib/auth/csrf";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Customer" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const statusTone: Record<string, "positive" | "warning" | "info" | "danger" | "neutral"> = {
  processing: "warning",
  packed: "info",
  shipped: "info",
  delivered: "positive",
  cancelled: "danger",
  refunded: "danger",
};

export default async function AdminCustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const { id } = await props.params;
  const staff = await requirePermission("customers.view", `/admin/customers/${id}`);
  const csrfToken = await getCsrfToken();

  const orders = await adminOrders.forUser(id);
  const account = await userStore.findById(id);
  if (orders.length === 0 && !account) notFound();

  const spend = orders.reduce((total, order) => total + order.totals.grandTotal, 0);
  const notes = noteStore.for("customer", id);
  const name = account?.name ?? orders[0]?.shippingAddress.recipient ?? "Customer";
  const email = account?.email ?? orders[0]?.email ?? "";

  return (
    <>
      <PageHeader
        title={name}
        description={email}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: name },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card title="Orders" description={`${orders.length} placed`} bodyClassName="p-0">
            {orders.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {order.reference}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {dateFormat.format(new Date(order.placedAt))}
                    </span>
                    <Pill tone={statusTone[order.status] ?? "neutral"}>
                      {order.status.replaceAll("-", " ")}
                    </Pill>
                    <span className="ml-auto font-mono text-sm tabular-nums">
                      {formatPrice(order.totals.grandTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Notes" description="Internal only — customers never see these.">
            <CustomerNotes
              customerId={id}
              csrfToken={csrfToken}
              canEdit={can(staff.role, "customers.edit")}
              notes={notes}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Lifetime">
            <dl className="divide-y">
              <Detail label="Orders">{orders.length}</Detail>
              <Detail label="Total spend">{formatPrice(spend)}</Detail>
              <Detail label="Average order">
                {formatPrice(orders.length > 0 ? Math.round(spend / orders.length) : 0)}
              </Detail>
              {account ? (
                <Detail label="Joined">
                  <span className="text-xs">{dateFormat.format(new Date(account.createdAt))}</span>
                </Detail>
              ) : null}
              {account ? (
                <Detail label="Email verified">
                  <Pill tone={account.emailVerified ? "positive" : "warning"}>
                    {account.emailVerified ? "verified" : "unverified"}
                  </Pill>
                </Detail>
              ) : null}
            </dl>
          </Card>

          {account && account.addresses.length > 0 ? (
            <Card title="Addresses">
              <ul className="space-y-3">
                {account.addresses.map((address) => (
                  <li key={address.id} className="rounded-lg border p-3 text-xs">
                    <p className="flex items-center gap-2 font-medium">
                      {address.label}
                      {address.isDefault ? <Pill tone="gold">default</Pill> : null}
                    </p>
                    <address className="mt-1 not-italic leading-relaxed text-muted-foreground">
                      {address.recipient}
                      <br />
                      {address.line1}, {address.city} {address.postcode}
                      <br />
                      {address.country}
                    </address>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card title="Activity">
            <p className="text-xs text-muted-foreground">
              Wishlist and recently-viewed lists are stored in the customer&rsquo;s own browser, so
              they are deliberately not visible here. They become server-side — and appear in this
              panel — once list sync is connected.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
