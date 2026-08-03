"use client";

import { Gift, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  deletePromotionAction,
  issueGiftCardAction,
  savePromotionAction,
  toggleGiftCardAction,
  togglePromotionAction,
} from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card, EmptyState, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import type { GiftCard, Promotion, PromotionKind } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";

const KINDS: { value: PromotionKind; label: string; hint: string }[] = [
  { value: "percentage", label: "Percentage off", hint: "Value is a percentage, e.g. 10" },
  { value: "fixed", label: "Fixed amount off", hint: "Value is in dollars, e.g. 25" },
  { value: "free-shipping", label: "Free shipping", hint: "Value is ignored" },
  { value: "bogo", label: "Buy one get one", hint: "Cheapest of each pair is free" },
  { value: "bundle", label: "Bundle saving", hint: "Percentage off once 3+ items are in the cart" },
  { value: "flash", label: "Flash deal", hint: "Percentage off inside a time window" },
];

const kindTone: Record<PromotionKind, "gold" | "info" | "positive" | "warning" | "neutral"> = {
  percentage: "info",
  fixed: "info",
  "free-shipping": "positive",
  bogo: "gold",
  bundle: "gold",
  flash: "warning",
};

function describeValue(promotion: Promotion) {
  switch (promotion.kind) {
    case "fixed":
      return formatPrice(promotion.value);
    case "free-shipping":
      return "shipping";
    case "bogo":
      return "2 for 1";
    default:
      return `${promotion.value}%`;
  }
}

const TABS = ["promotions", "gift-cards"] as const;

export function MarketingManager({
  csrfToken,
  promotions,
  giftCards,
  categories,
}: {
  csrfToken: string;
  promotions: Promotion[];
  giftCards: GiftCard[];
  categories: { slug: string; name: string }[];
}) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("promotions");
  const [editing, setEditing] = React.useState<Promotion | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function post(
    action: (prev: never, form: FormData) => Promise<{ ok: boolean; message?: string }>,
    entries: Record<string, string>,
  ) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      for (const [key, value] of Object.entries(entries)) form.set(key, value);
      const result = await action(undefined as never, form);
      if (result.ok) toast.success(result.message ?? "Done");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const promotionColumns: Column<Promotion>[] = [
    {
      id: "label",
      header: "Promotion",
      sortValue: (row) => row.label,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.label}</p>
          <p className="truncate text-xs text-muted-foreground">{row.description}</p>
        </div>
      ),
    },
    {
      id: "code",
      header: "Code",
      sortValue: (row) => row.code ?? "",
      cell: (row) =>
        row.code ? (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{row.code}</code>
        ) : (
          <Pill tone="neutral">automatic</Pill>
        ),
    },
    {
      id: "kind",
      header: "Type",
      sortValue: (row) => row.kind,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Pill tone={kindTone[row.kind]}>{row.kind.replaceAll("-", " ")}</Pill>
          <span className="font-mono text-xs tabular-nums">{describeValue(row)}</span>
        </div>
      ),
    },
    {
      id: "usage",
      header: "Used",
      sortValue: (row) => row.usageCount,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.usageCount}
          {row.usageLimit ? ` / ${row.usageLimit}` : ""}
        </span>
      ),
    },
    {
      id: "active",
      header: "Status",
      sortValue: (row) => (row.active ? "active" : "paused"),
      cell: (row) => (
        <Pill tone={row.active ? "positive" : "neutral"}>{row.active ? "active" : "paused"}</Pill>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={pending}
            onClick={() => post(togglePromotionAction, { id: row.id })}
          >
            {row.active ? "Pause" : "Activate"}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${row.label}`}
            onClick={() => {
              setAdding(false);
              setEditing(row);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Delete ${row.label}`}
            disabled={pending}
            onClick={() => post(deletePromotionAction, { id: row.id })}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const open = adding || editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {TABS.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={tab === entry ? "default" : "ghost"}
            className="h-8 px-3 text-xs capitalize"
            onClick={() => setTab(entry)}
          >
            {entry.replaceAll("-", " ")}
          </Button>
        ))}
      </div>

      {tab === "promotions" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card
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
                New promotion
              </Button>
            }
            title={`${promotions.length} promotions`}
          >
            <DataTable
              rows={promotions}
              columns={promotionColumns}
              getRowId={(row) => row.id}
              searchPlaceholder="Search promotions…"
              emptyIcon={Tag}
              emptyTitle="No promotions"
              emptyDescription="Create a coupon or an automatic discount to get started."
            />
          </Card>

          <div>
            {open ? (
              <Card
                title={editing ? `Edit ${editing.label}` : "New promotion"}
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
                  key={editing?.id ?? "new-promotion"}
                  action={savePromotionAction}
                  csrfToken={csrfToken}
                  hidden={editing ? { id: editing.id } : {}}
                  submitLabel={editing ? "Save promotion" : "Create promotion"}
                >
                  <TextInput name="label" label="Name" defaultValue={editing?.label} required />
                  <TextArea
                    name="description"
                    label="Description"
                    rows={2}
                    defaultValue={editing?.description}
                  />
                  <SelectInput
                    name="kind"
                    label="Type"
                    defaultValue={editing?.kind ?? "percentage"}
                    options={KINDS.map((kind) => ({ value: kind.value, label: kind.label }))}
                  />
                  <FormGrid>
                    <TextInput
                      name="value"
                      label="Value"
                      inputMode="decimal"
                      hint="% or $ depending on type"
                      defaultValue={
                        editing
                          ? editing.kind === "fixed"
                            ? (editing.value / 100).toFixed(2)
                            : String(editing.value)
                          : ""
                      }
                    />
                    <TextInput
                      name="code"
                      label="Coupon code"
                      placeholder="Leave blank for automatic"
                      defaultValue={editing?.code}
                    />
                  </FormGrid>
                  <FormGrid>
                    <TextInput
                      name="minSubtotal"
                      label="Minimum spend"
                      inputMode="decimal"
                      defaultValue={
                        editing?.minSubtotal ? (editing.minSubtotal / 100).toFixed(2) : ""
                      }
                    />
                    <TextInput
                      name="usageLimit"
                      label="Usage limit"
                      type="number"
                      defaultValue={editing?.usageLimit ? String(editing.usageLimit) : ""}
                    />
                  </FormGrid>
                  <SelectInput
                    name="category"
                    label="Restrict to department"
                    defaultValue={editing?.category ?? ""}
                    options={[
                      { value: "", label: "All departments" },
                      ...categories.map((category) => ({
                        value: category.slug,
                        label: category.name,
                      })),
                    ]}
                  />
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
                    name="automatic"
                    label="Applies automatically"
                    hint="No code needed; stacks below coupons"
                    defaultChecked={editing?.automatic}
                  />
                  <CheckboxInput
                    name="oncePerCustomer"
                    label="One use per customer"
                    defaultChecked={editing?.oncePerCustomer}
                  />
                  <CheckboxInput
                    name="active"
                    label="Active"
                    defaultChecked={editing ? editing.active : true}
                  />
                </AdminForm>
              </Card>
            ) : (
              <Card title="How promotions apply">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {KINDS.map((kind) => (
                    <li key={kind.value}>
                      <span className="font-medium text-foreground">{kind.label}</span> — {kind.hint}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Coupons are evaluated before automatic promotions, and every rule is re-checked
                  server-side when the order is placed.
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : null}

      {tab === "gift-cards" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card title={`${giftCards.length} gift cards`} bodyClassName="p-0">
            {giftCards.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Gift}
                  title="No gift cards"
                  description="Issue one from the panel beside this list."
                />
              </div>
            ) : (
              <ul className="divide-y">
                {giftCards.map((card) => (
                  <li key={card.code} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {card.code}
                    </code>
                    <Pill tone={card.active ? "positive" : "neutral"}>
                      {card.active ? "active" : "inactive"}
                    </Pill>
                    {card.expiresAt ? (
                      <span className="text-xs text-muted-foreground">
                        expires {card.expiresAt.slice(0, 10)}
                      </span>
                    ) : null}
                    <span className="ml-auto text-right">
                      <span className="block font-mono text-sm tabular-nums">
                        {formatPrice(card.balance)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        of {formatPrice(card.initialBalance)}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={pending}
                      onClick={() => post(toggleGiftCardAction, { code: card.code })}
                    >
                      {card.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Issue a gift card">
            <AdminForm
              action={issueGiftCardAction}
              csrfToken={csrfToken}
              submitLabel="Issue card"
            >
              <TextInput
                name="amount"
                label="Amount"
                inputMode="decimal"
                placeholder="100.00"
                required
              />
              <TextInput
                name="code"
                label="Code"
                placeholder="Leave blank to generate"
                hint="Codes are normalised to uppercase"
              />
              <TextInput name="expiresAt" label="Expires" type="date" />
            </AdminForm>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
