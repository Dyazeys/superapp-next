"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { DataTable } from "@/components/data/data-table";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FOUNDATION_TABLE_ROWS } from "@/lib/foundation-data";
import { useModalState } from "@/hooks/use-modal-state";
import { workspaceTemplateSchema, type WorkspaceTemplateInput } from "@/schemas/workspace-template";
import type { FoundationRow } from "@/types/foundation";

const columnHelper = createColumnHelper<FoundationRow>();

const columns = [
  columnHelper.accessor("area", {
    header: "Foundation area",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("detail", {
    header: "What exists",
  }),
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => <StatusBadge label={info.getValue()} tone="success" />,
  }),
];

export function FoundationWorkspace() {
  const modal = useModalState(false);
  const form = useForm<WorkspaceTemplateInput>({
    resolver: zodResolver(workspaceTemplateSchema),
    defaultValues: {
      name: "",
      code: "",
      notes: "",
    },
  });

  const rows = useMemo(() => FOUNDATION_TABLE_ROWS, []);

  const submit = form.handleSubmit((values) => {
    toast.success(`Template "${values.name}" captured for migration planning`);
    modal.closeModal();
    form.reset();
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <WorkspacePanel
        title="Workspace foundations"
        description="The generic patterns below are intended to receive future module schemas, actions, and views."
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div>
              <p className="font-medium">Modal-ready workspace</p>
              <p className="text-sm text-muted-foreground">
                Shared table and form primitives are already connected for future module migration.
              </p>
            </div>
            <Button onClick={modal.openModal}>Open wrapper</Button>
          </div>

          <DataTable columns={columns} data={rows} />
        </div>
      </WorkspacePanel>

      <div className="space-y-6">
        <WorkspacePanel
          title="Empty-state foundation"
          description="Use this when a module has not been migrated or has no records yet."
        >
          <EmptyState
            title="No migrated modules yet"
            description="Finance, CRM, inventory, procurement, and HR should move onto the new shell module by module."
            actionLabel="Plan migration"
          />
        </WorkspacePanel>

        <WorkspacePanel
          title="Form foundation"
          description="Consistent labels, helper text, and validation messaging for modal and inline workflows."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>`FormField` standardizes label, helper, and error placement.</p>
            <p>`ModalFormShell` standardizes dialog spacing, footer actions, and submit states.</p>
            <p>`workspaceTemplateSchema` is a generic example schema under `schemas/`.</p>
          </div>
        </WorkspacePanel>
      </div>

      <ModalFormShell
        open={modal.open}
        onOpenChange={modal.setOpen}
        title="Module migration template"
        description="Capture a module placeholder before wiring real business logic, tables, and actions."
        submitLabel="Save placeholder"
        onSubmit={submit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Template name"
            htmlFor="name"
            helperText="Use a neutral module name such as Sales, Procurement, or Inventory."
            error={form.formState.errors.name?.message}
          >
            <Input id="name" {...form.register("name")} />
          </FormField>
          <FormField
            label="Template code"
            htmlFor="code"
            helperText="Short code used in route names or internal identifiers."
            error={form.formState.errors.code?.message}
          >
            <Input id="code" {...form.register("code")} />
          </FormField>
        </div>

        <FormField
          label="Notes"
          htmlFor="notes"
          helperText="Optional migration notes, ownership, or data dependencies."
          error={form.formState.errors.notes?.message}
        >
          <Textarea id="notes" {...form.register("notes")} />
        </FormField>
      </ModalFormShell>
    </div>
  );
}
