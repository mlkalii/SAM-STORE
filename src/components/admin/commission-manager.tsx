"use client";

import { Pencil, Percent, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  deleteCommissionRuleAction,
  saveCommissionRuleAction,
  toggleCommissionRuleAction,
} from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  SelectInput,
  TextInput,
} from "@/components/admin/form-shell";
import { Card, EmptyState, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import type { CommissionKind, CommissionRule } from "@/lib/marketplace/types";
import { formatPrice, toDecimal } from "@/lib/format";

const KIND_LABEL: Record<CommissionKind, string> = {
  percentage: "Percentage of the order",
  fixed: "Fixed fee per order",
  category: "Percentage, one department",
};

export function CommissionManager({
  csrfToken,
  rules,
  categories,
  sellers,
}: {
  csrfToken: string;
  rules: CommissionRule[];
  categories: { slug: string; name: string }[];
  sellers: { id: string; name: string; override?: number }[];
}) {
  const [editing, setEditing] = React.useState<CommissionRule | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [kind, setKind] = React.useState<CommissionKind>("category");
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

  const overrides = sellers.filter((seller) => seller.override !== undefined);
  const open = adding || editing !== null;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-4">
        <Card
          title={`${rules.length} rules`}
          bodyClassName="p-0"
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setKind("category");
                setAdding(true);
              }}
            >
              <Plus className="size-3.5" aria-hidden />
              New rule
            </Button>
          }
        >
          {rules.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Percent}
                title="No commission rules"
                description="Add a rule to start taking a cut."
              />
            </div>
          ) : (
            <ul className="divide-y">
              {rules.map((rule) => (
                <li key={rule.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{rule.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {KIND_LABEL[rule.kind]}
                      {rule.category ? ` · ${rule.category.replaceAll("-", " ")}` : ""}
                      {rule.sellerId ? " · one seller" : ""}
                    </p>
                  </div>

                  <span className="font-mono text-sm tabular-nums">
                    {rule.kind === "fixed" ? formatPrice(rule.value) : `${rule.value}%`}
                  </span>

                  <Pill tone="neutral">priority {rule.priority}</Pill>
                  <Pill tone={rule.active ? "positive" : "neutral"}>
                    {rule.active ? "active" : "paused"}
                  </Pill>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={pending}
                      onClick={() => post(toggleCommissionRuleAction, { id: rule.id })}
                    >
                      {rule.active ? "Pause" : "Activate"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${rule.label}`}
                      onClick={() => {
                        setAdding(false);
                        setKind(rule.kind);
                        setEditing(rule);
                      }}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    {rule.id === "marketplace-default" ? null : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${rule.label}`}
                        disabled={pending}
                        onClick={() => post(deleteCommissionRuleAction, { id: rule.id })}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Negotiated seller rates"
          description="A seller override replaces every rule for that seller"
          bodyClassName="p-0"
        >
          {overrides.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No seller has a negotiated rate. Set one from a seller&rsquo;s page.
            </p>
          ) : (
            <ul className="divide-y">
              {overrides.map((seller) => (
                <li key={seller.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Link
                    href={`/admin/sellers/${seller.id}`}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {seller.name}
                  </Link>
                  <Pill tone="gold">{seller.override}%</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        {open ? (
          <Card
            title={editing ? `Edit ${editing.label}` : "New rule"}
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
              key={editing?.id ?? "new-rule"}
              action={saveCommissionRuleAction}
              csrfToken={csrfToken}
              hidden={editing ? { id: editing.id } : {}}
              submitLabel={editing ? "Save rule" : "Create rule"}
            >
              <TextInput name="label" label="Rule name" defaultValue={editing?.label} required />

              <SelectInput
                name="kind"
                label="Type"
                value={kind}
                onValueChange={(value) => setKind(value as CommissionKind)}
                options={[
                  { value: "percentage", label: KIND_LABEL.percentage },
                  { value: "category", label: KIND_LABEL.category },
                  { value: "fixed", label: KIND_LABEL.fixed },
                ]}
              />

              <FormGrid>
                <TextInput
                  name="value"
                  label={kind === "fixed" ? "Fee (USDT)" : "Percent"}
                  inputMode="decimal"
                  defaultValue={
                    editing
                      ? editing.kind === "fixed"
                        ? toDecimal(editing.value)
                        : String(editing.value)
                      : ""
                  }
                />
                <TextInput
                  name="priority"
                  label="Priority"
                  type="number"
                  hint="Higher wins"
                  defaultValue={String(editing?.priority ?? 10)}
                />
              </FormGrid>

              {kind === "category" ? (
                <SelectInput
                  name="category"
                  label="Department"
                  defaultValue={editing?.category ?? categories[0]?.slug}
                  options={categories.map((category) => ({
                    value: category.slug,
                    label: category.name,
                  }))}
                />
              ) : null}

              <SelectInput
                name="sellerId"
                label="Restrict to a seller"
                defaultValue={editing?.sellerId ?? ""}
                options={[
                  { value: "", label: "All sellers" },
                  ...sellers.map((seller) => ({ value: seller.id, label: seller.name })),
                ]}
              />

              <CheckboxInput
                name="active"
                label="Active"
                defaultChecked={editing ? editing.active : true}
              />
            </AdminForm>
          </Card>
        ) : (
          <Card title="How rules resolve">
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1. Seller override.</span> A
                negotiated rate on the seller replaces everything else.
              </li>
              <li>
                <span className="font-medium text-foreground">2. Seller-scoped rule.</span> A rule
                restricted to one seller.
              </li>
              <li>
                <span className="font-medium text-foreground">3. Department rule.</span> Matched
                per line, so a mixed basket is charged correctly.
              </li>
              <li>
                <span className="font-medium text-foreground">4. Standard percentage.</span> The
                marketplace default.
              </li>
              <li>
                <span className="font-medium text-foreground">Plus any fixed fee</span>, charged
                once per order rather than per line.
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Commission is always taken on what the customer actually paid — after discounts, not
              before.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
