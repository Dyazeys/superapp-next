"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { accountingApi } from "@/features/accounting/api";
import { productApi } from "@/features/product/api";
import { useModalState } from "@/hooks/use-modal-state";
import {
  operationalExpenseBarterItemSchema,
  operationalExpenseBarterSchema,
  operationalExpenseSchema,
  type OperationalExpenseBarterInput,
  type OperationalExpenseBarterItemInput,
  type OperationalExpenseInput,
} from "@/schemas/accounting-module";
import type {
  AccountingAccountRecord,
  AccountingJournalEntryLineRecord,
  AccountingJournalRecord,
  AccountingOperationalExpenseBarterItemRecord,
  AccountingOperationalExpenseBarterRecord,
  AccountingOperationalExpenseRecord,
  AccountMutationResponse,
} from "@/types/accounting";
import type { MasterInventoryRecord } from "@/types/product";

type OperationalExpenseFormValues = z.input<typeof operationalExpenseSchema>;
type OperationalExpenseBarterFormValues = z.input<typeof operationalExpenseBarterSchema>;
type OperationalExpenseBarterItemFormValues = z.input<typeof operationalExpenseBarterItemSchema>;

const ACCOUNTING_OPERATIONAL_EXPENSE_KEY = ["accounting-operational-expenses"] as const;
const ACCOUNTING_OPERATIONAL_EXPENSE_BARTER_KEY = ["accounting-operational-expense-barter"] as const;
const ACCOUNTING_INVENTORY_LOOKUP_KEY = ["accounting-operational-expense-inventory"] as const;

export function useAccountingAccounts() {
  return useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: accountingApi.accounts.list,
  }) as UseQueryResult<AccountingAccountRecord[]>;
}

export function useAccountingJournals() {
  return useQuery({
    queryKey: ["accounting-journals"],
    queryFn: accountingApi.journals.list,
  }) as UseQueryResult<AccountingJournalRecord[]>;
}

export function useAccountingJournalSelection(journals: AccountingJournalRecord[] | undefined) {
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const currentJournalId = useMemo(
    () => selectedJournalId ?? journals?.[0]?.id ?? null,
    [journals, selectedJournalId]
  );

  return { selectedJournalId, currentJournalId, setSelectedJournalId };
}

export function useAccountMutation(accountCode: string, startDate: string, endDate: string, openingBalance: number) {
  return useQuery({
    queryKey: ["account-mutations", accountCode, startDate, endDate, openingBalance],
    queryFn: () => accountingApi.accountMutations.list(accountCode, startDate, endDate, openingBalance),
    enabled: !!accountCode && !!startDate && !!endDate,
  }) as UseQueryResult<AccountMutationResponse>;
}

export function useAccountingJournalEntries(journalId?: string) {
  return useQuery({
    queryKey: ["accounting-journal-entries", journalId ?? "all"],
    queryFn: () => accountingApi.journalEntries.list(journalId),
    enabled: Boolean(journalId),
  }) as UseQueryResult<AccountingJournalEntryLineRecord[]>;
}

export function useAccountingOperationalExpenses() {
  return useQuery({
    queryKey: ACCOUNTING_OPERATIONAL_EXPENSE_KEY,
    queryFn: accountingApi.operationalExpenses.list,
  }) as UseQueryResult<AccountingOperationalExpenseRecord[]>;
}

export function useAccountingInventoryLookup() {
  return useQuery({
    queryKey: ACCOUNTING_INVENTORY_LOOKUP_KEY,
    queryFn: productApi.inventory.list,
  }) as UseQueryResult<MasterInventoryRecord[]>;
}

export function useAccountingOperationalExpenseBarter() {
  return useQuery({
    queryKey: ACCOUNTING_OPERATIONAL_EXPENSE_BARTER_KEY,
    queryFn: accountingApi.operationalExpenseBarter.list,
  }) as UseQueryResult<AccountingOperationalExpenseBarterRecord[]>;
}

export function useAccountingOperationalExpenseManager() {
  const queryClient = useQueryClient();
  const [editingExpense, setEditingExpense] = useState<AccountingOperationalExpenseRecord | null>(null);
  const expenseModal = useModalState();
  const expensesQuery = useAccountingOperationalExpenses();
  const expenseForm = useForm<OperationalExpenseFormValues, unknown, OperationalExpenseInput>({
    resolver: zodResolver(operationalExpenseSchema),
    defaultValues: {
      expense_date: "",
      expense_account_id: "",
      payment_account_id: null,
      expense_label: null,
      is_product_barter: false,
      qty: 0,
      amount: "0",
      description: "",
      receipt_url: null,
      inv_code: null,
    },
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_OPERATIONAL_EXPENSE_KEY }),
      queryClient.invalidateQueries({ queryKey: ["accounting-journals"] }),
      queryClient.invalidateQueries({ queryKey: ["accounting-journal-entries", "all"] }),
    ]);

  const saveExpense = async (values: OperationalExpenseInput) => {
    try {
      const expense = editingExpense
        ? await accountingApi.operationalExpenses.update(editingExpense.id, values)
        : await accountingApi.operationalExpenses.create(values);

      toast.success(`Opex ${editingExpense ? "updated" : "created"}`);
      await invalidate();
      setEditingExpense(null);
      expenseModal.closeModal();
      expenseForm.reset({
        expense_date: "",
        expense_account_id: "",
        payment_account_id: null,
        expense_label: null,
        is_product_barter: false,
        qty: 0,
        amount: "0",
        description: "",
        receipt_url: null,
        inv_code: null,
      });
      return expense;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save operational expense");
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await accountingApi.operationalExpenses.remove(id);
      toast.success("Opex deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete operational expense");
      throw error;
    }
  };

  const postExpense = async (id: string) => {
    try {
      const expense = await accountingApi.operationalExpenses.post(id);
      toast.success("Opex posted");
      await invalidate();
      return expense;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post operational expense");
      throw error;
    }
  };

  const voidExpense = async (id: string) => {
    try {
      const expense = await accountingApi.operationalExpenses.void(id);
      toast.success("Opex voided");
      await invalidate();
      return expense;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to void operational expense");
      throw error;
    }
  };

  const openExpenseModal = (expense?: AccountingOperationalExpenseRecord) => {
    setEditingExpense(expense ?? null);
    expenseForm.reset({
      expense_date: expense?.expense_date?.slice(0, 10) ?? "",
      expense_account_id: expense?.expense_account_id ?? "",
      payment_account_id: expense?.payment_account_id ?? null,
      expense_label: expense?.expense_label ?? null,
      is_product_barter: expense?.is_product_barter ?? false,
      qty: expense?.qty ?? 0,
      amount: expense?.amount ?? "0",
      description: expense?.description ?? "",
      receipt_url: expense?.receipt_url ?? null,
      inv_code: expense?.inv_code ?? null,
    });
    expenseModal.openModal();
  };

  return {
    expensesQuery,
    expenseForm,
    expenseModal,
    editingExpense,
    openExpenseModal,
    saveExpense,
    postExpense,
    voidExpense,
    deleteExpense,
  };
}

export function useAccountingOperationalExpenseBarterManager() {
  const queryClient = useQueryClient();
  const barterQuery = useAccountingOperationalExpenseBarter();
  const [editingBarter, setEditingBarter] = useState<AccountingOperationalExpenseBarterRecord | null>(null);
  const [selectedBarterId, setSelectedBarterId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AccountingOperationalExpenseBarterItemRecord | null>(null);
  const barterModal = useModalState();
  const itemModal = useModalState();

  const barterForm = useForm<OperationalExpenseBarterFormValues, unknown, OperationalExpenseBarterInput>({
    resolver: zodResolver(operationalExpenseBarterSchema),
    defaultValues: {
      barter_date: "",
      expense_account_id: "",
      expense_label: null,
      description: "",
      reference_no: null,
      notes_internal: null,
    },
  });

  const itemForm = useForm<OperationalExpenseBarterItemFormValues, unknown, OperationalExpenseBarterItemInput>({
    resolver: zodResolver(operationalExpenseBarterItemSchema),
    defaultValues: {
      inv_code: "",
      qty: 1,
      unit_amount: "0",
      notes: null,
    },
  });

  const barterRows = useMemo(() => barterQuery.data ?? [], [barterQuery.data]);
  const selectedBarter = useMemo(
    () => barterRows.find((row) => row.id === selectedBarterId) ?? null,
    [barterRows, selectedBarterId]
  );

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_OPERATIONAL_EXPENSE_BARTER_KEY }),
      queryClient.invalidateQueries({ queryKey: ["accounting-journals"] }),
      queryClient.invalidateQueries({ queryKey: ["accounting-journal-entries", "all"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock-movements"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock-balances"] }),
    ]);

  const resetBarterForm = () =>
    barterForm.reset({
      barter_date: "",
      expense_account_id: "",
      expense_label: null,
      description: "",
      reference_no: null,
      notes_internal: null,
    });

  const resetItemForm = () =>
    itemForm.reset({
      inv_code: "",
      qty: 1,
      unit_amount: "0",
      notes: null,
    });

  const loadBarterIntoForm = (barter?: AccountingOperationalExpenseBarterRecord | null) => {
    setSelectedBarterId(barter?.id ?? null);
    setEditingBarter(barter ?? null);
    barterForm.reset({
      barter_date: barter?.barter_date?.slice(0, 10) ?? "",
      expense_account_id: barter?.expense_account_id ?? "",
      expense_label: barter?.expense_label ?? null,
      description: barter?.description ?? "",
      reference_no: barter?.reference_no ?? null,
      notes_internal: barter?.notes_internal ?? null,
    });
    setEditingItem(null);
    resetItemForm();
  };

  const beginNewBarter = () => {
    setSelectedBarterId(null);
    setEditingBarter(null);
    resetBarterForm();
    setEditingItem(null);
    resetItemForm();
  };

  const openBarterModal = (barter?: AccountingOperationalExpenseBarterRecord | null) => {
    if (barter) {
      loadBarterIntoForm(barter);
    } else {
      beginNewBarter();
    }
    barterModal.openModal();
  };

  const startItemForm = (item?: AccountingOperationalExpenseBarterItemRecord) => {
    setEditingItem(item ?? null);
    itemForm.reset({
      inv_code: item?.inv_code ?? "",
      qty: item?.qty ?? 1,
      unit_amount: item?.unit_amount ?? "0",
      notes: item?.notes ?? null,
    });
  };

  const openItemModal = (item?: AccountingOperationalExpenseBarterItemRecord) => {
    startItemForm(item);
    itemModal.openModal();
  };

  const cancelBarterForm = () => {
    if (selectedBarter) {
      loadBarterIntoForm(selectedBarter);
      return;
    }

    beginNewBarter();
  };

  const cancelItemForm = () => {
    setEditingItem(null);
    resetItemForm();
  };

  const saveBarter = async (values: OperationalExpenseBarterInput) => {
    try {
      const barter = editingBarter
        ? await accountingApi.operationalExpenseBarter.update(editingBarter.id, values)
        : await accountingApi.operationalExpenseBarter.create(values);
      toast.success(`Barter ${editingBarter ? "updated" : "created"}`);
      await invalidate();
      setSelectedBarterId(barter.id);
      setEditingBarter(null);
      loadBarterIntoForm(barter);
      barterModal.closeModal();
      return barter;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save barter");
      throw error;
    }
  };

  const deleteBarter = async (id: string) => {
    try {
      await accountingApi.operationalExpenseBarter.remove(id);
      toast.success("Barter deleted");
      await invalidate();
      setSelectedBarterId((current) => (current === id ? null : current));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete barter");
      throw error;
    }
  };

  const postBarter = async (id: string) => {
    try {
      const barter = await accountingApi.operationalExpenseBarter.post(id);
      toast.success("Barter posted");
      await invalidate();
      setSelectedBarterId(barter.id);
      return barter;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post barter");
      throw error;
    }
  };

  const voidBarter = async (id: string) => {
    try {
      const barter = await accountingApi.operationalExpenseBarter.void(id);
      toast.success("Barter voided");
      await invalidate();
      setSelectedBarterId(barter.id);
      return barter;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to void barter");
      throw error;
    }
  };

  const saveItem = async (values: OperationalExpenseBarterItemInput) => {
    const barterId = selectedBarter?.id;
    if (!barterId) {
      throw new Error("Select a barter record first.");
    }

    try {
      const barter = editingItem
        ? await accountingApi.operationalExpenseBarter.updateItem(barterId, editingItem.id, values)
        : await accountingApi.operationalExpenseBarter.createItem(barterId, values);
      toast.success(`Barter item ${editingItem ? "updated" : "created"}`);
      await invalidate();
      setSelectedBarterId(barter.id);
      setEditingItem(null);
      resetItemForm();
      itemModal.closeModal();
      return barter;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save barter item");
      throw error;
    }
  };

  const deleteItem = async (barterId: string, itemId: string) => {
    try {
      const barter = await accountingApi.operationalExpenseBarter.removeItem(barterId, itemId);
      toast.success("Barter item deleted");
      await invalidate();
      setSelectedBarterId(barter.id);
      return barter;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete barter item");
      throw error;
    }
  };

  return {
    barterQuery,
    barterRows,
    selectedBarter,
    selectedBarterId,
    setSelectedBarterId,
    editingBarter,
    editingItem,
    barterForm,
    itemForm,
    barterModal,
    itemModal,
    loadBarterIntoForm,
    beginNewBarter,
    openBarterModal,
    startItemForm,
    openItemModal,
    cancelBarterForm,
    cancelItemForm,
    saveBarter,
    deleteBarter,
    postBarter,
    voidBarter,
    saveItem,
    deleteItem,
  };
}
