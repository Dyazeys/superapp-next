export type AccountingAccountRecord = {
  id: string;
  category_id: number | null;
  parent_id: string | null;
  code: string;
  name: string;
  normal_balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  account_categories?: {
    id: number;
    name: string;
    report_type: string;
  } | null;
  accounts?: {
    id: string;
    code: string;
    name: string;
  } | null;
  _count?: {
    journal_lines?: number;
    other_accounts?: number;
  };
};

export type AccountingJournalRecord = {
  id: string;
  transaction_date: string;
  reference_type: string;
  reference_id: string | null;
  description: string;
  created_at: string;
  updated_at: string | null;
  line_count: number;
  total_debit: string;
  total_credit: string;
};

export type AccountingJournalEntryLineRecord = {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: string;
  credit: string;
  memo: string | null;
  accounts: {
    id: string;
    code: string;
    name: string;
    normal_balance: string;
  };
  journal_entries: {
    id: string;
    transaction_date: string;
    reference_type: string;
    reference_id: string | null;
    description: string;
    created_at: string;
  };
};

export type AccountingOperationalExpenseRecord = {
  id: string;
  expense_date: string;
  expense_account_id: string;
  payment_account_id: string | null;
  expense_label: string | null;
  status: string;
  is_product_barter: boolean;
  qty: number;
  amount: string;
  description: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string | null;
  posted_at: string | null;
  voided_at: string | null;
  inv_code: string | null;
  accounts_operational_expenses_expense_account_idToaccounts: {
    id: string;
    code: string;
    name: string;
  };
  accounts_operational_expenses_payment_account_idToaccounts: {
    id: string;
    code: string;
    name: string;
  } | null;
  master_inventory: {
    inv_code: string;
    inv_name: string;
  } | null;
};

export type AccountingOperationalExpenseBarterItemRecord = {
  id: string;
  barter_id: string;
  inv_code: string;
  qty: number;
  unit_amount: string;
  line_amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  master_inventory: {
    inv_code: string;
    inv_name: string;
    is_active: boolean;
  };
};

export type AccountingOperationalExpenseBarterRecord = {
  id: string;
  barter_date: string;
  expense_account_id: string;
  expense_label: string | null;
  description: string;
  status: string;
  total_amount: string;
  reference_no: string | null;
  notes_internal: string | null;
  created_at: string;
  updated_at: string | null;
  posted_at: string | null;
  voided_at: string | null;
  accounts_operational_expense_barter_expense_account_idToaccounts: {
    id: string;
    code: string;
    name: string;
  };
  operational_expense_barter_items: AccountingOperationalExpenseBarterItemRecord[];
};
