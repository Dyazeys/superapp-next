import "server-only";
import { pgPool } from "@/db/postgres";
import { payoutAdjustmentReferenceId } from "@/lib/payout-adjustment-journal";
import { payoutSettlementReferenceId } from "@/lib/payout-journal";
import type { PayoutReconciliationFilter } from "@/types/payout";

type PayoutReconciliationMismatch = {
  area: "PIUTANG_VS_PAYOUT" | "SALDO_VS_BANK_TRANSFER" | "MAPPING";
  category: "EXPECTED" | "ERROR";
  rule_code:
    | "PIUTANG_GT_PAYOUT_OUTSTANDING"
    | "PIUTANG_LT_PAYOUT_INCONSISTENT"
    | "SALDO_GT_TRANSFER_PENDING_WITHDRAWAL"
    | "SALDO_LT_TRANSFER_INCONSISTENT"
    | "MISSING_PIUTANG_ACCOUNT"
    | "MISSING_SALDO_ACCOUNT"
    | "NEGATIVE_PIUTANG"
    | "NEGATIVE_PAYOUT"
    | "NEGATIVE_SALDO"
    | "NEGATIVE_TRANSFER"
    | "CHANNEL_REQUIRES_PIUTANG"
    | "CHANNEL_REQUIRES_SALDO";
  message: string;
};

export type PayoutReconciliationRecord = {
  channel_id: number;
  channel_name: string;
  slug: string | null;
  is_marketplace: boolean;
  category_name: string | null;
  group_name: string | null;
  piutang_account_id: string | null;
  piutang_account_code: string | null;
  piutang_account_name: string | null;
  saldo_account_id: string | null;
  saldo_account_code: string | null;
  saldo_account_name: string | null;
  total_piutang: string;
  total_sales_receivable_posted: string;
  total_payout_settlement_posted: string;
  sales_receivable_vs_payout_settlement_diff: string;
  total_saldo: string;
  total_bank_transfer: string;
  saldo_vs_bank_transfer_diff: string;
  payout_count: number;
  transfer_count: number;
  mismatch_status: "MATCHED" | "EXPECTED" | "ERROR";
  mismatch_areas: string[];
  mismatches: PayoutReconciliationMismatch[];
  ref_breakdowns: PayoutReconciliationRefBreakdown[];
};

type PayoutReconciliationRefBreakdown = {
  ref: string;
  sales_posted: string;
  payout_posted: string;
  delta: string;
};

type PayoutReconciliationSummary = {
  channel_count: number;
  mismatched_channel_count: number;
  expected_channel_count: number;
  error_channel_count: number;
  payout_without_channel_count: number;
  payout_without_channel_amount: string;
  transfer_without_channel_count: number;
  transfer_without_channel_amount: string;
};

export type PayoutReconciliationReport = {
  rules: {
    area: "PIUTANG_VS_PAYOUT" | "SALDO_VS_BANK_TRANSFER" | "MAPPING";
    category: "EXPECTED" | "ERROR";
    rule_code: string;
    description: string;
  }[];
  summary: PayoutReconciliationSummary;
  channels: PayoutReconciliationRecord[];
};

type QueryRow = Omit<PayoutReconciliationRecord, "mismatch_status" | "mismatch_areas" | "mismatches" | "ref_breakdowns">;

type SummaryRow = {
  channel_count: string;
  payout_without_channel_count: string;
  payout_without_channel_amount: string;
  transfer_without_channel_count: string;
  transfer_without_channel_amount: string;
};

type BreakdownRow = {
  channel_id: number;
  ref: string;
  sales_posted?: string;
  payout_posted?: string;
};

type PayoutSettlementSourceRow = {
  payout_id: number;
  channel_id: number;
  ref: string;
  piutang_account_id: string | null;
};

type PayoutAdjustmentSourceRow = {
  adjustment_id: number;
  channel_id: number;
  ref: string;
  piutang_account_id: string | null;
};

type PostedJournalAmountRow = {
  reference_id: string;
  account_id: string;
  posted_amount: string;
};

type ReconciliationSqlFilters = {
  params: string[];
  journalDateFilterSql: string;
  payoutDateFilterSql: string;
  adjustmentDateFilterSql: string;
  transferDateFilterSql: string;
};

type PayoutReconciliationDateFilter = Pick<PayoutReconciliationFilter, "fromDate" | "toDate">;

function buildSqlFilters(filter?: PayoutReconciliationDateFilter): ReconciliationSqlFilters {
  if (!filter?.fromDate || !filter?.toDate) {
    return {
      params: [],
      journalDateFilterSql: "TRUE",
      payoutDateFilterSql: "TRUE",
      adjustmentDateFilterSql: "TRUE",
      transferDateFilterSql: "TRUE",
    };
  }

  return {
    params: [filter.fromDate, filter.toDate],
    journalDateFilterSql: "je.transaction_date::date BETWEEN $1::date AND $2::date",
    payoutDateFilterSql: "p.payout_date::date BETWEEN $1::date AND $2::date",
    adjustmentDateFilterSql: "a.payout_date::date BETWEEN $1::date AND $2::date",
    transferDateFilterSql: "pt.transfer_date::date BETWEEN $1::date AND $2::date",
  };
}

function applySqlFilters(query: string, filters: ReconciliationSqlFilters) {
  return query
    .replace(/__JOURNAL_DATE_FILTER__/g, filters.journalDateFilterSql)
    .replace(/__PAYOUT_DATE_FILTER__/g, filters.payoutDateFilterSql)
    .replace(/__ADJUSTMENT_DATE_FILTER__/g, filters.adjustmentDateFilterSql)
    .replace(/__TRANSFER_DATE_FILTER__/g, filters.transferDateFilterSql);
}

const RECONCILIATION_QUERY_TEMPLATE = `
  WITH channel_base AS (
    SELECT
      c.channel_id,
      c.channel_name,
      c.slug,
      c.is_marketplace,
      cat.category_name,
      grp.group_name,
      c.piutang_account_id,
      piu.code AS piutang_account_code,
      piu.name AS piutang_account_name,
      piu.normal_balance AS piutang_normal_balance,
      c.saldo_account_id,
      sal.code AS saldo_account_code,
      sal.name AS saldo_account_name,
      sal.normal_balance AS saldo_normal_balance
    FROM channel.m_channel c
    LEFT JOIN channel.m_channel_category cat
      ON cat.category_id = c.category_id
    LEFT JOIN channel.m_channel_group grp
      ON grp.group_id = cat.group_id
    LEFT JOIN accounting.accounts piu
      ON piu.id = c.piutang_account_id
    LEFT JOIN accounting.accounts sal
      ON sal.id = c.saldo_account_id
  ),
  piutang_ledger AS (
    SELECT
      cb.channel_id,
      COALESCE(
        SUM(
          CASE
            WHEN __JOURNAL_DATE_FILTER__ THEN
              CASE
                WHEN UPPER(COALESCE(cb.piutang_normal_balance, 'DEBIT')) IN ('CREDIT', 'KREDIT')
                  THEN COALESCE(jl.credit, 0) - COALESCE(jl.debit, 0)
                ELSE COALESCE(jl.debit, 0) - COALESCE(jl.credit, 0)
              END
            ELSE 0
          END
        ),
        0
      )::numeric(18,2) AS total_piutang
    FROM channel_base cb
    LEFT JOIN accounting.journal_lines jl
      ON jl.account_id = cb.piutang_account_id
    LEFT JOIN accounting.journal_entries je
      ON je.id = jl.journal_entry_id
    GROUP BY cb.channel_id
  ),
  saldo_ledger AS (
    SELECT
      cb.channel_id,
      COALESCE(
        SUM(
          CASE
            WHEN __JOURNAL_DATE_FILTER__ THEN
              CASE
                WHEN UPPER(COALESCE(cb.saldo_normal_balance, 'DEBIT')) IN ('CREDIT', 'KREDIT')
                  THEN COALESCE(jl.credit, 0) - COALESCE(jl.debit, 0)
                ELSE COALESCE(jl.debit, 0) - COALESCE(jl.credit, 0)
              END
            ELSE 0
          END
        ),
        0
      )::numeric(18,2) AS total_saldo
    FROM channel_base cb
    LEFT JOIN accounting.journal_lines jl
      ON jl.account_id = cb.saldo_account_id
    LEFT JOIN accounting.journal_entries je
      ON je.id = jl.journal_entry_id
    GROUP BY cb.channel_id
  ),
  payout_totals AS (
    SELECT
      o.channel_id,
      COUNT(*)::int AS payout_count,
      COALESCE(SUM(p.omset), 0)::numeric(18,2) AS total_payout
    FROM payout.t_payout p
    JOIN sales.t_order o
      ON o.ref_no = p.ref
    WHERE o.channel_id IS NOT NULL
      AND COALESCE(UPPER(p.payout_status), 'SETTLED') NOT IN ('FAILED', 'CANCELLED')
      AND (__PAYOUT_DATE_FILTER__)
    GROUP BY o.channel_id
  ),
  adjustment_totals AS (
    SELECT
      COALESCE(a.channel_id, o.channel_id) AS channel_id,
      COUNT(*)::int AS adjustment_count,
      COALESCE(SUM(a.amount), 0)::numeric(18,2) AS total_adjustment
    FROM payout.t_adjustments a
    LEFT JOIN sales.t_order o
      ON o.ref_no = a.ref
    WHERE COALESCE(a.channel_id, o.channel_id) IS NOT NULL
      AND (__ADJUSTMENT_DATE_FILTER__)
    GROUP BY COALESCE(a.channel_id, o.channel_id)
  ),
  transfer_totals AS (
    SELECT
      o.channel_id,
      COUNT(*)::int AS transfer_count,
      COALESCE(SUM(pt.amount), 0)::numeric(18,2) AS total_bank_transfer
    FROM payout.payout_transfers pt
    JOIN payout.t_payout p
      ON p.payout_id = pt.payout_id
    JOIN sales.t_order o
      ON o.ref_no = p.ref
    WHERE o.channel_id IS NOT NULL
      AND COALESCE(UPPER(p.payout_status), 'SETTLED') NOT IN ('FAILED', 'CANCELLED')
      AND (__TRANSFER_DATE_FILTER__)
    GROUP BY o.channel_id
  )
  SELECT
    cb.channel_id,
    cb.channel_name,
    cb.slug,
    cb.is_marketplace,
    cb.category_name,
    cb.group_name,
    cb.piutang_account_id,
    cb.piutang_account_code,
    cb.piutang_account_name,
    cb.saldo_account_id,
    cb.saldo_account_code,
    cb.saldo_account_name,
    COALESCE(pl.total_piutang, 0)::text AS total_piutang,
    '0.00'::text AS total_sales_receivable_posted,
    '0.00'::text AS total_payout_settlement_posted,
    '0.00'::text AS sales_receivable_vs_payout_settlement_diff,
    COALESCE(sl.total_saldo, 0)::text AS total_saldo,
    COALESCE(tt.total_bank_transfer, 0)::text AS total_bank_transfer,
    (COALESCE(sl.total_saldo, 0) - COALESCE(tt.total_bank_transfer, 0))::numeric(18,2)::text AS saldo_vs_bank_transfer_diff,
    (COALESCE(pt.payout_count, 0) + COALESCE(at.adjustment_count, 0))::int AS payout_count,
    COALESCE(tt.transfer_count, 0)::int AS transfer_count
  FROM channel_base cb
  LEFT JOIN piutang_ledger pl
    ON pl.channel_id = cb.channel_id
  LEFT JOIN saldo_ledger sl
    ON sl.channel_id = cb.channel_id
  LEFT JOIN payout_totals pt
    ON pt.channel_id = cb.channel_id
  LEFT JOIN adjustment_totals at
    ON at.channel_id = cb.channel_id
  LEFT JOIN transfer_totals tt
    ON tt.channel_id = cb.channel_id
  ORDER BY cb.channel_name ASC, cb.channel_id ASC;
`;

const RECONCILIATION_SUMMARY_QUERY_TEMPLATE = `
  WITH channels AS (
    __RECONCILIATION_QUERY__
  ),
  payout_without_channel AS (
    SELECT
      COUNT(*)::int AS payout_without_channel_count,
      COALESCE(SUM(p.omset), 0)::numeric(18,2)::text AS payout_without_channel_amount
    FROM payout.t_payout p
    LEFT JOIN sales.t_order o
      ON o.ref_no = p.ref
    WHERE o.channel_id IS NULL
      AND COALESCE(UPPER(p.payout_status), 'SETTLED') NOT IN ('FAILED', 'CANCELLED')
      AND (__PAYOUT_DATE_FILTER__)
  ),
  adjustment_without_channel AS (
    SELECT
      COUNT(*)::int AS adjustment_without_channel_count,
      COALESCE(SUM(a.amount), 0)::numeric(18,2)::text AS adjustment_without_channel_amount
    FROM payout.t_adjustments a
    LEFT JOIN sales.t_order o
      ON o.ref_no = a.ref
    WHERE COALESCE(a.channel_id, o.channel_id) IS NULL
      AND (__ADJUSTMENT_DATE_FILTER__)
  ),
  transfer_without_channel AS (
    SELECT
      COUNT(*)::int AS transfer_without_channel_count,
      COALESCE(SUM(pt.amount), 0)::numeric(18,2)::text AS transfer_without_channel_amount
    FROM payout.payout_transfers pt
    JOIN payout.t_payout p
      ON p.payout_id = pt.payout_id
    LEFT JOIN sales.t_order o
      ON o.ref_no = p.ref
    WHERE o.channel_id IS NULL
      AND (__TRANSFER_DATE_FILTER__)
  )
  SELECT
    COUNT(*)::text AS channel_count,
    (MAX(pwc.payout_without_channel_count) + MAX(awc.adjustment_without_channel_count))::text AS payout_without_channel_count,
    (MAX(pwc.payout_without_channel_amount)::numeric + MAX(awc.adjustment_without_channel_amount)::numeric)::numeric(18,2)::text AS payout_without_channel_amount,
    MAX(twc.transfer_without_channel_count)::text AS transfer_without_channel_count,
    MAX(twc.transfer_without_channel_amount) AS transfer_without_channel_amount
  FROM channels
  CROSS JOIN payout_without_channel pwc
  CROSS JOIN adjustment_without_channel awc
  CROSS JOIN transfer_without_channel twc;
`;

const SALES_POSTED_BREAKDOWN_QUERY_TEMPLATE = `
  SELECT
    o.channel_id,
    o.ref_no AS ref,
    COALESCE(SUM(jl.debit - jl.credit), 0)::numeric(18,2)::text AS sales_posted
  FROM sales.t_order o
  JOIN sales.t_order_item i
    ON i.order_no = o.order_no
  JOIN channel.m_channel c
    ON c.channel_id = o.channel_id
  JOIN accounting.journal_entries je
    ON je.reference_type = 'SALES_ORDER_ITEM'
   AND je.description LIKE ('SALES posting for order ' || o.order_no || ' item ' || i.id || ' %')
  JOIN accounting.journal_lines jl
    ON jl.journal_entry_id = je.id
   AND jl.account_id = c.piutang_account_id
  WHERE o.channel_id IS NOT NULL
    AND o.ref_no IS NOT NULL
    AND (__JOURNAL_DATE_FILTER__)
  GROUP BY o.channel_id, o.ref_no
  ORDER BY o.channel_id, o.ref_no;
`;

const PAYOUT_SETTLEMENT_SOURCE_QUERY_TEMPLATE = `
  SELECT
    p.payout_id,
    o.channel_id,
    p.ref,
    c.piutang_account_id
  FROM payout.t_payout p
  JOIN sales.t_order o
    ON o.ref_no = p.ref
  JOIN channel.m_channel c
    ON c.channel_id = o.channel_id
  WHERE o.channel_id IS NOT NULL
    AND p.ref IS NOT NULL
    AND COALESCE(UPPER(p.payout_status), 'SETTLED') NOT IN ('FAILED', 'CANCELLED')
    AND (__PAYOUT_DATE_FILTER__)
  ORDER BY o.channel_id, p.ref, p.payout_id;
`;

const ADJUSTMENT_SOURCE_QUERY_TEMPLATE = `
  SELECT
    a.adjustment_id,
    COALESCE(a.channel_id, o.channel_id) AS channel_id,
    COALESCE(a.ref, 'ADJ#' || a.adjustment_id::text) AS ref,
    c.piutang_account_id
  FROM payout.t_adjustments a
  LEFT JOIN sales.t_order o
    ON o.ref_no = a.ref
  JOIN channel.m_channel c
    ON c.channel_id = COALESCE(a.channel_id, o.channel_id)
  WHERE COALESCE(a.channel_id, o.channel_id) IS NOT NULL
    AND (__ADJUSTMENT_DATE_FILTER__)
  ORDER BY COALESCE(a.channel_id, o.channel_id), COALESCE(a.ref, 'ADJ#' || a.adjustment_id::text), a.adjustment_id;
`;

function buildReconciliationQueries(filter?: PayoutReconciliationDateFilter) {
  const filters = buildSqlFilters(filter);
  const reconciliationQuery = applySqlFilters(RECONCILIATION_QUERY_TEMPLATE, filters);
  const summaryQuery = applySqlFilters(
    RECONCILIATION_SUMMARY_QUERY_TEMPLATE.replace(
      "__RECONCILIATION_QUERY__",
      reconciliationQuery.trim().replace(/;$/, "")
    ),
    filters
  );
  const salesBreakdownQuery = applySqlFilters(SALES_POSTED_BREAKDOWN_QUERY_TEMPLATE, filters);
  const payoutSettlementSourceQuery = applySqlFilters(PAYOUT_SETTLEMENT_SOURCE_QUERY_TEMPLATE, filters);
  const adjustmentSourceQuery = applySqlFilters(ADJUSTMENT_SOURCE_QUERY_TEMPLATE, filters);

  return {
    reconciliationQuery,
    summaryQuery,
    salesBreakdownQuery,
    payoutSettlementSourceQuery,
    adjustmentSourceQuery,
    filters,
    params: filters.params,
  };
}

async function loadPostedJournalAmounts(
  referenceType: "PAYOUT_SETTLEMENT" | "PAYOUT_ADJUSTMENT",
  referenceIds: string[],
  filters: ReconciliationSqlFilters
) {
  if (referenceIds.length === 0) {
    return new Map<string, number>();
  }

  const referenceIdsParamIndex = filters.params.length + 1;
  const referenceTypeParamIndex = filters.params.length + 2;
  const query = `
    SELECT
      je.reference_id,
      jl.account_id,
      COALESCE(SUM(jl.credit - jl.debit), 0)::numeric(18,2)::text AS posted_amount
    FROM accounting.journal_entries je
    JOIN accounting.journal_lines jl
      ON jl.journal_entry_id = je.id
    WHERE je.reference_id::text = ANY($${referenceIdsParamIndex}::text[])
      AND je.reference_type = $${referenceTypeParamIndex}
      AND (${filters.journalDateFilterSql})
    GROUP BY je.reference_id, jl.account_id
  `;

  const result = await pgPool.query<PostedJournalAmountRow>(query, [
    ...filters.params,
    referenceIds,
    referenceType,
  ]);

  return new Map(
    result.rows.map((row) => [`${row.reference_id}:${row.account_id}`, Number(row.posted_amount ?? "0")])
  );
}

async function loadPayoutSettlementBreakdowns(
  query: string,
  params: string[],
  filters: ReconciliationSqlFilters
) {
  const result = await pgPool.query<PayoutSettlementSourceRow>(query, params);
  const referenceIds = result.rows.map((row) => payoutSettlementReferenceId(row.payout_id));
  const postedByReferenceAndAccount = await loadPostedJournalAmounts("PAYOUT_SETTLEMENT", referenceIds, filters);

  return result.rows.map<BreakdownRow>((row) => ({
    channel_id: row.channel_id,
    ref: row.ref,
    payout_posted: (
      postedByReferenceAndAccount.get(
        `${payoutSettlementReferenceId(row.payout_id)}:${row.piutang_account_id ?? "__missing__"}`
      ) ?? 0
    ).toFixed(2),
  }));
}

async function loadPayoutAdjustmentBreakdowns(
  query: string,
  params: string[],
  filters: ReconciliationSqlFilters
) {
  const result = await pgPool.query<PayoutAdjustmentSourceRow>(query, params);
  const referenceIds = result.rows.map((row) => payoutAdjustmentReferenceId(row.adjustment_id));
  const postedByReferenceAndAccount = await loadPostedJournalAmounts("PAYOUT_ADJUSTMENT", referenceIds, filters);

  return result.rows.map<BreakdownRow>((row) => ({
    channel_id: row.channel_id,
    ref: row.ref,
    payout_posted: (
      postedByReferenceAndAccount.get(
        `${payoutAdjustmentReferenceId(row.adjustment_id)}:${row.piutang_account_id ?? "__missing__"}`
      ) ?? 0
    ).toFixed(2),
  }));
}

const RECONCILIATION_RULES: PayoutReconciliationReport["rules"] = [
  {
    area: "PIUTANG_VS_PAYOUT",
    category: "EXPECTED",
    rule_code: "PIUTANG_GT_PAYOUT_OUTSTANDING",
    description: "Jika total sales receivable posted > total payout settlement posted, selisih dianggap outstanding dan termasuk EXPECTED.",
  },
  {
    area: "SALDO_VS_BANK_TRANSFER",
    category: "EXPECTED",
    rule_code: "SALDO_GT_TRANSFER_PENDING_WITHDRAWAL",
    description: "Jika saldo > transfer bank, selisih dianggap belum ditarik dan termasuk EXPECTED.",
  },
  {
    area: "MAPPING",
    category: "ERROR",
    rule_code: "MISSING_PIUTANG_ACCOUNT",
    description: "Jika channel memang wajib punya akun piutang tetapi mapping piutang hilang, channel ditandai ERROR.",
  },
  {
    area: "MAPPING",
    category: "ERROR",
    rule_code: "MISSING_SALDO_ACCOUNT",
    description: "Jika channel memang wajib punya akun saldo tetapi mapping saldo hilang, channel ditandai ERROR.",
  },
  {
    area: "MAPPING",
    category: "ERROR",
    rule_code: "CHANNEL_REQUIRES_PIUTANG",
    description: "Marketplace dan web wajib punya akun piutang, kecuali event cash yang tidak wajib piutang maupun saldo.",
  },
  {
    area: "MAPPING",
    category: "ERROR",
    rule_code: "CHANNEL_REQUIRES_SALDO",
    description: "Marketplace dan web wajib punya akun saldo. Reseller, dropship, konsinyasi, manual, dan event cash tidak wajib saldo.",
  },
  {
    area: "PIUTANG_VS_PAYOUT",
    category: "ERROR",
    rule_code: "PIUTANG_LT_PAYOUT_INCONSISTENT",
    description: "Jika total payout settlement posted > total sales receivable posted, data dianggap tidak konsisten dan termasuk ERROR.",
  },
  {
    area: "SALDO_VS_BANK_TRANSFER",
    category: "ERROR",
    rule_code: "SALDO_LT_TRANSFER_INCONSISTENT",
    description: "Jika transfer bank > saldo, data dianggap tidak konsisten dan termasuk ERROR.",
  },
  {
    area: "PIUTANG_VS_PAYOUT",
    category: "ERROR",
    rule_code: "NEGATIVE_PIUTANG",
    description: "Jika total sales receivable posted bernilai negatif, nilai dianggap tidak masuk akal dan termasuk ERROR.",
  },
  {
    area: "PIUTANG_VS_PAYOUT",
    category: "ERROR",
    rule_code: "NEGATIVE_PAYOUT",
    description: "Jika total payout settlement posted bernilai negatif, nilai dianggap tidak masuk akal dan termasuk ERROR.",
  },
  {
    area: "SALDO_VS_BANK_TRANSFER",
    category: "ERROR",
    rule_code: "NEGATIVE_SALDO",
    description: "Jika total saldo bernilai negatif, nilai dianggap tidak masuk akal dan termasuk ERROR.",
  },
  {
    area: "SALDO_VS_BANK_TRANSFER",
    category: "ERROR",
    rule_code: "NEGATIVE_TRANSFER",
    description: "Jika total transfer bank bernilai negatif, nilai dianggap tidak masuk akal dan termasuk ERROR.",
  },
];

function almostZero(value: number) {
  return Math.abs(value) <= 0.009;
}

function toAmount(value: string | undefined) {
  return Number(value ?? "0");
}

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function inferAccountRequirement(
  row: Pick<PayoutReconciliationRecord, "is_marketplace" | "channel_name" | "slug" | "category_name" | "group_name">
) {
  const category = normalizeLabel(row.category_name);
  const group = normalizeLabel(row.group_name);
  const channelName = normalizeLabel(row.channel_name);
  const slug = normalizeLabel(row.slug);
  const combined = [category, group, channelName, slug].filter(Boolean).join(" ");

  const isEvent = category === "event";
  const isEventCash = isEvent && (combined.includes("cash") || combined.includes("tunai"));
  const isWeb = channelName.includes("web") || slug.includes("web");
  const isMarketplace = row.is_marketplace || category === "marketplace";
  const isSaldoOptional =
    category === "reseller" ||
    category === "dropship" ||
    category === "konsinyasi" ||
    channelName.includes("manual") ||
    slug.includes("manual");

  return {
    requirePiutang: !isEventCash && (isMarketplace || isWeb),
    requireSaldo: !isEventCash && !isSaldoOptional && (isMarketplace || isWeb),
  };
}

function buildRefBreakdowns(
  channelId: number,
  salesRows: BreakdownRow[],
  payoutRows: BreakdownRow[]
): {
  totalSalesReceivablePosted: string;
  totalPayoutSettlementPosted: string;
  salesReceivableVsPayoutSettlementDiff: string;
  refBreakdowns: PayoutReconciliationRefBreakdown[];
} {
  const refs = new Map<string, { salesPosted: number; payoutPosted: number }>();

  for (const row of salesRows.filter((item) => item.channel_id === channelId)) {
    const current = refs.get(row.ref) ?? { salesPosted: 0, payoutPosted: 0 };
    current.salesPosted += toAmount(row.sales_posted);
    refs.set(row.ref, current);
  }

  for (const row of payoutRows.filter((item) => item.channel_id === channelId)) {
    const current = refs.get(row.ref) ?? { salesPosted: 0, payoutPosted: 0 };
    current.payoutPosted += toAmount(row.payout_posted);
    refs.set(row.ref, current);
  }

  const refBreakdowns = [...refs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ref, value]) => ({
      ref,
      sales_posted: value.salesPosted.toFixed(2),
      payout_posted: value.payoutPosted.toFixed(2),
      delta: (value.salesPosted - value.payoutPosted).toFixed(2),
    }));

  const totalSalesReceivablePosted = refBreakdowns.reduce((sum, item) => sum + Number(item.sales_posted), 0);
  const totalPayoutSettlementPosted = refBreakdowns.reduce((sum, item) => sum + Number(item.payout_posted), 0);

  return {
    totalSalesReceivablePosted: totalSalesReceivablePosted.toFixed(2),
    totalPayoutSettlementPosted: totalPayoutSettlementPosted.toFixed(2),
    salesReceivableVsPayoutSettlementDiff: (totalSalesReceivablePosted - totalPayoutSettlementPosted).toFixed(2),
    refBreakdowns,
  };
}

function classifyMismatch(row: QueryRow & { ref_breakdowns: PayoutReconciliationRefBreakdown[] }): PayoutReconciliationRecord {
  const totalSalesReceivablePosted = Number(row.total_sales_receivable_posted);
  const totalPayoutSettlementPosted = Number(row.total_payout_settlement_posted);
  const totalSaldo = Number(row.total_saldo);
  const totalBankTransfer = Number(row.total_bank_transfer);
  const piutangDiff = Number(row.sales_receivable_vs_payout_settlement_diff);
  const saldoDiff = Number(row.saldo_vs_bank_transfer_diff);
  const mismatches: PayoutReconciliationMismatch[] = [];
  const accountRequirement = inferAccountRequirement(row);

  if (accountRequirement.requirePiutang && !row.piutang_account_id) {
    mismatches.push({
      area: "MAPPING",
      category: "ERROR",
      rule_code: "MISSING_PIUTANG_ACCOUNT",
      message: "Mapping akun piutang belum diisi.",
    });
  }

  if (accountRequirement.requireSaldo && !row.saldo_account_id) {
    mismatches.push({
      area: "MAPPING",
      category: "ERROR",
      rule_code: "MISSING_SALDO_ACCOUNT",
      message: "Mapping akun saldo belum diisi.",
    });
  }

  if (totalSalesReceivablePosted < 0) {
    mismatches.push({
      area: "PIUTANG_VS_PAYOUT",
      category: "ERROR",
      rule_code: "NEGATIVE_PIUTANG",
      message: "Total sales receivable posted bernilai negatif.",
    });
  }

  if (totalPayoutSettlementPosted < 0) {
    mismatches.push({
      area: "PIUTANG_VS_PAYOUT",
      category: "ERROR",
      rule_code: "NEGATIVE_PAYOUT",
      message: "Total payout settlement posted bernilai negatif.",
    });
  }

  if (totalSaldo < 0) {
    mismatches.push({
      area: "SALDO_VS_BANK_TRANSFER",
      category: "ERROR",
      rule_code: "NEGATIVE_SALDO",
      message: "Total saldo bernilai negatif.",
    });
  }

  if (totalBankTransfer < 0) {
    mismatches.push({
      area: "SALDO_VS_BANK_TRANSFER",
      category: "ERROR",
      rule_code: "NEGATIVE_TRANSFER",
      message: "Total transfer bank bernilai negatif.",
    });
  }

  if (!almostZero(piutangDiff)) {
    mismatches.push(
      piutangDiff > 0
        ? {
            area: "PIUTANG_VS_PAYOUT",
            category: "EXPECTED",
            rule_code: "PIUTANG_GT_PAYOUT_OUTSTANDING",
            message: "Sales receivable posted lebih besar dari payout settlement posted, masih outstanding.",
          }
        : {
            area: "PIUTANG_VS_PAYOUT",
            category: "ERROR",
            rule_code: "PIUTANG_LT_PAYOUT_INCONSISTENT",
            message: "Payout settlement posted lebih besar dari sales receivable posted, data tidak konsisten.",
          }
    );
  }

  if (!almostZero(saldoDiff)) {
    mismatches.push(
      saldoDiff > 0
        ? {
            area: "SALDO_VS_BANK_TRANSFER",
            category: "EXPECTED",
            rule_code: "SALDO_GT_TRANSFER_PENDING_WITHDRAWAL",
            message: "Saldo lebih besar dari transfer bank, masih belum ditarik.",
          }
        : {
            area: "SALDO_VS_BANK_TRANSFER",
            category: "ERROR",
            rule_code: "SALDO_LT_TRANSFER_INCONSISTENT",
            message: "Transfer bank lebih besar dari saldo, data tidak konsisten.",
          }
    );
  }

  const mismatchStatus = mismatches.some((item) => item.category === "ERROR")
    ? "ERROR"
    : mismatches.some((item) => item.category === "EXPECTED")
      ? "EXPECTED"
      : "MATCHED";

  return {
    ...row,
    mismatch_status: mismatchStatus,
    mismatch_areas: [...new Set(mismatches.map((item) => item.area))],
    mismatches,
  };
}

export async function getPayoutReconciliationReport(
  filter?: PayoutReconciliationDateFilter
): Promise<PayoutReconciliationReport> {
  const queries = buildReconciliationQueries(filter);
  const [channelsResult, summaryResult, salesBreakdownResult, payoutBreakdownRows, adjustmentBreakdownRows] = await Promise.all([
    pgPool.query<QueryRow>(queries.reconciliationQuery, queries.params),
    pgPool.query<SummaryRow>(queries.summaryQuery, queries.params),
    pgPool.query<BreakdownRow>(queries.salesBreakdownQuery, queries.params),
    loadPayoutSettlementBreakdowns(queries.payoutSettlementSourceQuery, queries.params, queries.filters),
    loadPayoutAdjustmentBreakdowns(queries.adjustmentSourceQuery, queries.params, queries.filters),
  ]);

  const summary = summaryResult.rows[0];
  const combinedPayoutBreakdowns = [...payoutBreakdownRows, ...adjustmentBreakdownRows];
  const channels = channelsResult.rows.map((row) => {
    const breakdown = buildRefBreakdowns(row.channel_id, salesBreakdownResult.rows, combinedPayoutBreakdowns);

    return classifyMismatch({
      ...row,
      total_sales_receivable_posted: breakdown.totalSalesReceivablePosted,
      total_payout_settlement_posted: breakdown.totalPayoutSettlementPosted,
      sales_receivable_vs_payout_settlement_diff: breakdown.salesReceivableVsPayoutSettlementDiff,
      ref_breakdowns: breakdown.refBreakdowns,
    });
  });
  const mismatchedChannelCount = channels.filter((row) => row.mismatch_status !== "MATCHED").length;
  const expectedChannelCount = channels.filter((row) => row.mismatch_status === "EXPECTED").length;
  const errorChannelCount = channels.filter((row) => row.mismatch_status === "ERROR").length;

  return {
    rules: RECONCILIATION_RULES,
    summary: {
      channel_count: Number(summary?.channel_count ?? 0),
      mismatched_channel_count: mismatchedChannelCount,
      expected_channel_count: expectedChannelCount,
      error_channel_count: errorChannelCount,
      payout_without_channel_count: Number(summary?.payout_without_channel_count ?? 0),
      payout_without_channel_amount: summary?.payout_without_channel_amount ?? "0.00",
      transfer_without_channel_count: Number(summary?.transfer_without_channel_count ?? 0),
      transfer_without_channel_amount: summary?.transfer_without_channel_amount ?? "0.00",
    },
    channels,
  };
}
