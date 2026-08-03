"use client";

import { Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { deleteSellerCouponAction, saveSellerCouponAction } from "@/app/actions/seller";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";
import { Card, EmptyState, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import { formatPrice, toDecimal } from "@/lib/format";

interface SellerCoupon {
  id: string;
  code: string;
  label: string;
  description: string;
  value: number;
  minSubtotal?: number;
  usageCount: number;
  usageLimit?: number;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
}

export function SellerCouponManager({
  csrfToken,
  coupons,
}: {
  csrfToken: string;
  coupons: SellerCoupon[];
}) {
  const [editing, setEditing] = React.useState<SellerCoupon | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", id);

      const result = await deleteSellerCouponAction(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Removed");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const open = adding || editing !== null;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card
        title={`${coupons.length} coupons`}
        bodyClassName="p-0"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            New coupon
          </Button>
        }
      >
        {coupons.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Tag}
              title="No coupons yet"
              description="Create a code to run a discount across your own listings."
            />
          </div>
        ) : (
          <ul className="divide-y">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {coupon.code}
                </code>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{coupon.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {coupon.value}% off
                    {coupon.minSubtotal ? ` over ${formatPrice(coupon.minSubtotal)}` : ""}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {coupon.usageCount}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </span>
                <Pill tone={coupon.active ? "positive" : "neutral"}>
                  {coupon.active ? "active" : "paused"}
                </Pill>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Edit ${coupon.label}`}
                  onClick={() => {
                    setAdding(false);
                    setEditing(coupon);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete ${coupon.label}`}
                  disabled={pending}
                  onClick={() => remove(coupon.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        {open ? (
          <Card
            title={editing ? `Edit ${editing.label}` : "New coupon"}
            actions={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Close"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            }
          >
            <AdminForm
              key={editing?.id ?? "new-coupon"}
              action={saveSellerCouponAction}
              csrfToken={csrfToken}
              submitLabel={editing ? "Save coupon" : "Create coupon"}
            >
              <TextInput name="label" label="Coupon name" defaultValue={editing?.label} required />
              <TextArea
                name="description"
                label="Description"
                rows={2}
                defaultValue={editing?.description}
              />
              <FormGrid>
                <TextInput
                  name="code"
                  label="Code"
                  placeholder="SPRING10"
                  defaultValue={editing?.code}
                  required
                />
                <TextInput
                  name="value"
                  label="Percent off"
                  inputMode="decimal"
                  defaultValue={editing ? String(editing.value) : "10"}
                />
              </FormGrid>
              <FormGrid>
                <TextInput
                  name="minSubtotal"
                  label="Minimum spend"
                  inputMode="decimal"
                  defaultValue={editing?.minSubtotal ? toDecimal(editing.minSubtotal) : ""}
                />
                <TextInput
                  name="usageLimit"
                  label="Usage limit"
                  type="number"
                  defaultValue={editing?.usageLimit ? String(editing.usageLimit) : ""}
                />
              </FormGrid>
              <FormGrid>
                <TextInput
                  name="startsAt"
                  label="Starts"
                  type="date"
                  defaultValue={editing?.startsAt?.slice(0, 10)}
                />
                <TextInput
                  name="endsAt"
                  label="Ends"
                  type="date"
                  defaultValue={editing?.endsAt?.slice(0, 10)}
                />
              </FormGrid>
              <CheckboxInput
                name="active"
                label="Active"
                defaultChecked={editing ? editing.active : true}
              />
            </AdminForm>
          </Card>
        ) : (
          <Card title="How seller coupons work">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Your coupon is restricted to your own products automatically.</li>
              <li>Codes are unique across the whole marketplace, so pick something distinctive.</li>
              <li>
                Commission is calculated after the discount — you pay commission on what the
                customer actually paid.
              </li>
              <li>Every rule is re-checked server-side when the order is placed.</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
