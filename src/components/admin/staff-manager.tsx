"use client";

import { Pencil, Plus, UserCog, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { saveStaffAction } from "@/app/actions/admin";
import {
  AdminForm,
  CheckboxInput,
  FormGrid,
  SelectInput,
  TextInput,
} from "@/components/admin/form-shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/config/auth";
import type { AdminRole } from "@/config/admin";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastSeenAt?: string;
  avatarColor: string;
  isSelf: boolean;
}

const roleTone: Record<AdminRole, "gold" | "info" | "positive" | "neutral"> = {
  "super-admin": "gold",
  admin: "info",
  manager: "info",
  staff: "neutral",
  support: "positive",
};

export function StaffManager({
  csrfToken,
  staff,
  roles,
}: {
  csrfToken: string;
  staff: StaffRow[];
  roles: { id: AdminRole; label: string; description: string }[];
}) {
  const [editing, setEditing] = React.useState<StaffRow | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function setActive(row: StaffRow, active: boolean) {
    startTransition(async () => {
      const form = new FormData();
      form.set(CSRF_FIELD, csrfToken);
      form.set("id", row.id);
      form.set("name", row.name);
      form.set("email", row.email);
      form.set("role", row.role);
      if (active) form.set("active", "on");

      const result = await saveStaffAction(undefined as never, form);
      if (result.ok) toast.success(active ? "Account reactivated" : "Account suspended");
      else toast.error(result.message ?? "That did not work");
    });
  }

  const columns: Column<StaffRow>[] = [
    {
      id: "name",
      header: "Name",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: row.avatarColor }}
            aria-hidden
          >
            {row.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.name}
              {row.isSelf ? <span className="ml-1.5 text-xs text-muted-foreground">(you)</span> : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortValue: (row) => row.role,
      cell: (row) => <Pill tone={roleTone[row.role]}>{row.role.replaceAll("-", " ")}</Pill>,
    },
    {
      id: "lastSeen",
      header: "Last seen",
      sortValue: (row) => row.lastSeenAt ?? "",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.lastSeenAt ? row.lastSeenAt.slice(0, 10) : "never"}
        </span>
      ),
    },
    {
      id: "active",
      header: "Status",
      sortValue: (row) => (row.active ? "active" : "suspended"),
      cell: (row) => (
        <Pill tone={row.active ? "positive" : "neutral"}>
          {row.active ? "active" : "suspended"}
        </Pill>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${row.name}`}
            onClick={() => {
              setAdding(false);
              setEditing(row);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          {/* Suspending yourself would lock you out of the account you are using. */}
          {row.isSelf ? null : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pending}
              onClick={() => setActive(row, !row.active)}
            >
              {row.active ? "Suspend" : "Reactivate"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const open = adding || editing !== null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card
        bodyClassName="p-0"
        title={`${staff.length} accounts`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            New account
          </Button>
        }
      >
        <DataTable
          rows={staff}
          columns={columns}
          getRowId={(row) => row.id}
          searchPlaceholder="Search staff…"
          emptyIcon={UserCog}
          emptyTitle="No staff accounts"
          emptyDescription="Add someone to give them admin access."
        />
      </Card>

      <div className="space-y-4">
        {open ? (
          <Card
            title={editing ? `Edit ${editing.name}` : "New account"}
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
              key={editing?.id ?? "new-staff"}
              action={saveStaffAction}
              csrfToken={csrfToken}
              hidden={editing ? { id: editing.id } : {}}
              submitLabel={editing ? "Save account" : "Create account"}
            >
              <FormGrid>
                <TextInput name="name" label="Name" defaultValue={editing?.name} required />
                <TextInput
                  name="email"
                  label="Email"
                  type="email"
                  defaultValue={editing?.email}
                  required
                />
              </FormGrid>
              <SelectInput
                name="role"
                label="Role"
                defaultValue={editing?.role ?? "staff"}
                options={roles.map((role) => ({ value: role.id, label: role.label }))}
              />
              {editing ? null : (
                <TextInput
                  name="password"
                  label="Temporary password"
                  type="password"
                  hint="They can change it from the sign-in screen"
                  required
                />
              )}
              <CheckboxInput
                name="active"
                label="Account active"
                defaultChecked={editing ? editing.active : true}
              />
            </AdminForm>
          </Card>
        ) : null}

        <Card title="Roles">
          <ul className="space-y-3">
            {roles.map((role) => (
              <li key={role.id}>
                <div className="flex items-center gap-2">
                  <Pill tone={roleTone[role.id]}>{role.label}</Pill>
                  <span className="text-xs text-muted-foreground">
                    {staff.filter((member) => member.role === role.id).length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
