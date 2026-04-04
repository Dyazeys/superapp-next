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
