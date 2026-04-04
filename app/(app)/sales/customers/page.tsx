"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  parseSalesBooleanInput,
  SALES_BOOLEAN_OPTIONS,
  useSalesCustomerMaster,
} from "@/features/sales/use-sales-module";
import type { SalesCustomerInput } from "@/schemas/sales-module";
import type { SalesCustomerRecord } from "@/types/sales";

const columnHelper = createColumnHelper<SalesCustomerRecord>();

function formatMoney(value: number) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function SalesCustomersPage() {
  const hooks = useSalesCustomerMaster();
  const { customersQuery, customerForm, customerModal, editingCustomer } = hooks;
  const customerRows = customersQuery.data ?? [];
  const totalCustomers = customerRows.length;
  const activeCustomers = customerRows.filter((customer) => customer.is_active).length;
  const totalOrders = customerRows.reduce((sum, customer) => sum + (customer._count?.t_order ?? 0), 0);
  const totalRevenue = customerRows.reduce((sum, customer) => sum + Number(customer.metrics?.total_revenue ?? 0), 0);

  const columns = [
    columnHelper.accessor("customer_id", {
      header: "Customer ID",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("customer_name", {
      header: "Customer",
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "orders",
      header: "Orders",
      cell: ({ row }) => (
        <StatusBadge label={`${row.original._count?.t_order ?? 0} linked`} tone="info" />
      ),
    }),
    columnHelper.display({
      id: "revenue",
      header: "Revenue",
      cell: ({ row }) => formatMoney(Number(row.original.metrics?.total_revenue ?? 0)),
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openCustomerModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteCustomer(row.original.customer_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Sales"
      title="Customers"
      description="Kelola customer master minimal untuk operasional internal. Data order yang memakai customer akan terhubung ke tabel ini tanpa mengubah alur Sales yang sudah berjalan."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total customers"
            value={String(totalCustomers)}
            subtitle="Jumlah customer master yang terlihat."
          />
          <MetricCard
            title="Active customers"
            value={String(activeCustomers)}
            subtitle="Customer yang bisa dipilih untuk sales order baru."
          />
          <MetricCard
            title="Linked sales"
            value={formatMoney(totalRevenue)}
            subtitle={`${totalOrders.toLocaleString("id-ID")} order terhubung ke customer master.`}
          />
        </div>

        <section className="rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Minimal Customer Master</p>
            <h2 className="text-xl font-semibold tracking-tight">Customer records for practical sales use</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Modul ini sekarang memakai tabel customer master minimal di schema Sales. Ringkasan order dan revenue di bawah
              tetap dihitung dari `sales.t_order`, jadi daftar customer tetap berguna untuk operasional tanpa menambah desain
              schema yang lebih besar.
            </p>
          </div>
        </section>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openCustomerModal()}>
            <Plus className="size-4" />
            Add customer
          </Button>
        </div>

        {customersQuery.isError ? (
          <EmptyState
            title="Customers could not be loaded"
            description={customersQuery.error instanceof Error ? customersQuery.error.message : "Failed to load customers."}
          />
        ) : customerRows.length ? (
          <DataTable columns={columns} data={customerRows} emptyMessage="No customers found." />
        ) : (
          <EmptyState
            title="No customers yet"
            description="Belum ada customer master yang dibuat. Tambahkan customer minimal agar sales order bisa memakai referensi customer yang nyata."
          />
        )}

        <ModalFormShell
          open={customerModal.open}
          onOpenChange={customerModal.setOpen}
          title={editingCustomer ? "Edit customer" : "Create customer"}
          description="Minimal customer master for Sales."
          submitLabel={editingCustomer ? "Save changes" : "Create customer"}
          isSubmitting={customerForm.formState.isSubmitting}
          onSubmit={() => customerForm.handleSubmit((values: SalesCustomerInput) => hooks.saveCustomer(values))()}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Customer name"
              htmlFor="customer_name"
              error={customerForm.formState.errors.customer_name?.message}
            >
              <Input id="customer_name" {...customerForm.register("customer_name")} />
            </FormField>
            <FormField label="Active" htmlFor="customer_active">
              <Input
                id="customer_active"
                list="sales-customer-boolean-options"
                value={String(customerForm.watch("is_active"))}
                onChange={(event) => customerForm.setValue("is_active", parseSalesBooleanInput(event.target.value))}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Phone" htmlFor="customer_phone">
              <Input id="customer_phone" {...customerForm.register("phone")} />
            </FormField>
            <FormField label="Email" htmlFor="customer_email" error={customerForm.formState.errors.email?.message}>
              <Input id="customer_email" type="email" {...customerForm.register("email")} />
            </FormField>
          </div>
          <datalist id="sales-customer-boolean-options">
            {SALES_BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </datalist>
        </ModalFormShell>
      </div>
    </PageShell>
  );
}
