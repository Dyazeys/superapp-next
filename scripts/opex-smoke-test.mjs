import crypto from "crypto";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const DATABASE_URL = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL (or SMOKE_DATABASE_URL) for opex smoke test.");
  process.exit(1);
}

function deterministicReferenceId(namespace, id) {
  const hash = crypto.createHash("sha1").update(`${namespace}:${id}`).digest("hex").slice(0, 32).split("");

  hash[12] = "5";
  const variant = Number.parseInt(hash[16], 16);
  hash[16] = ((variant & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8).join(""),
    hash.slice(8, 12).join(""),
    hash.slice(12, 16).join(""),
    hash.slice(16, 20).join(""),
    hash.slice(20, 32).join(""),
  ].join("-");
}

function operationalExpenseReferenceId(expenseId) {
  return deterministicReferenceId("superapp:journal:operational-expense:v1", expenseId);
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function requestOrThrow(path, options = {}) {
  const result = await request(path, options);
  if (!result.ok) {
    throw new Error(`HTTP ${result.status} ${path}: ${typeof result.body === "string" ? result.body : JSON.stringify(result.body)}`);
  }

  return result.body;
}

async function fetchSingleRow(db, query, params = []) {
  const result = await db.query(query, params);
  return result.rows[0] ?? null;
}

async function fetchJournalSummary(db, referenceId) {
  return fetchSingleRow(
    db,
    `
      SELECT
        COUNT(DISTINCT je.id)::int AS journal_count,
        COUNT(jl.id)::int AS line_count,
        COALESCE(SUM(jl.debit), 0)::text AS total_debit,
        COALESCE(SUM(jl.credit), 0)::text AS total_credit
      FROM accounting.journal_entries je
      LEFT JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      WHERE je.reference_type = 'OPERATIONAL_EXPENSE'
        AND je.reference_id = $1
    `,
    [referenceId]
  );
}

async function fetchJournalLineCodes(db, referenceId) {
  const result = await db.query(
    `
      SELECT a.code, a.name, COALESCE(jl.debit, 0)::text AS debit, COALESCE(jl.credit, 0)::text AS credit, jl.memo
      FROM accounting.journal_entries je
      JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      JOIN accounting.accounts a
        ON a.id = jl.account_id
      WHERE je.reference_type = 'OPERATIONAL_EXPENSE'
        AND je.reference_id = $1
      ORDER BY a.code ASC, jl.id ASC
    `,
    [referenceId]
  );

  return result.rows;
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  let manualExpenseId = null;
  let operationalExpenseId = null;
  const failures = [];
  const checks = [];

  try {
    const marketingAccount = await fetchSingleRow(
      db,
      `SELECT id, code, name FROM accounting.accounts WHERE code = '61101' AND is_active = true LIMIT 1`
    );
    const operationalAccount = await fetchSingleRow(
      db,
      `SELECT id, code, name FROM accounting.accounts WHERE code = '62102' AND is_active = true LIMIT 1`
    );
    const paymentAccount = await fetchSingleRow(
      db,
      `SELECT id, code, name FROM accounting.accounts WHERE code LIKE '111%' AND is_active = true ORDER BY code ASC LIMIT 1`
    );
    if (!marketingAccount || !operationalAccount || !paymentAccount) {
      throw new Error("Seed data tidak cukup untuk opex smoke test.");
    }

    const today = new Date().toISOString().slice(0, 10);

    const createdManualExpense = await requestOrThrow("/api/accounting/operational-expenses", {
      method: "POST",
      body: JSON.stringify({
        expense_date: today,
        expense_account_id: marketingAccount.id,
        payment_account_id: paymentAccount.id,
        expense_label: "Iklan MP",
        is_product_barter: false,
        qty: 0,
        amount: "150000",
        description: "Smoke test manual opex",
        receipt_url: null,
        inv_code: null,
      }),
    });
    manualExpenseId = createdManualExpense.id;

    if (createdManualExpense.status !== "DRAFT") {
      failures.push("Manual opex baru harus tersimpan sebagai DRAFT.");
    }

    const updatedManualExpense = await requestOrThrow(`/api/accounting/operational-expenses/${manualExpenseId}`, {
      method: "PATCH",
      body: JSON.stringify({
        payment_account_id: paymentAccount.id,
        amount: "175000",
        description: "Smoke test manual opex updated",
      }),
    });

    const postedManualExpense = await requestOrThrow(`/api/accounting/operational-expenses/${manualExpenseId}/post`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    const createdOperationalExpense = await requestOrThrow("/api/accounting/operational-expenses", {
      method: "POST",
      body: JSON.stringify({
        expense_date: today,
        expense_account_id: operationalAccount.id,
        payment_account_id: paymentAccount.id,
        expense_label: "Wifi",
        is_product_barter: false,
        qty: 0,
        amount: "50000",
        description: "Smoke test operational opex",
        receipt_url: null,
        inv_code: null,
      }),
    });
    operationalExpenseId = createdOperationalExpense.id;

    if (createdOperationalExpense.status !== "DRAFT") {
      failures.push("Operational opex baru harus tersimpan sebagai DRAFT.");
    }

    const postedOperationalExpense = await requestOrThrow(`/api/accounting/operational-expenses/${operationalExpenseId}/post`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    const manualReferenceId = operationalExpenseReferenceId(manualExpenseId);
    const operationalReferenceId = operationalExpenseReferenceId(operationalExpenseId);

    const manualJournal = await fetchJournalSummary(db, manualReferenceId);
    const operationalJournal = await fetchJournalSummary(db, operationalReferenceId);
    const manualLines = await fetchJournalLineCodes(db, manualReferenceId);
    const operationalLines = await fetchJournalLineCodes(db, operationalReferenceId);

    checks.push({
      manual_expense_id: manualExpenseId,
      manual_amount_after_update: updatedManualExpense.amount,
      manual_status_after_post: postedManualExpense.status,
      manual_journal_count: manualJournal?.journal_count ?? 0,
      manual_line_count: manualJournal?.line_count ?? 0,
      manual_line_codes: manualLines.map((line) => line.code),
      operational_expense_id: operationalExpenseId,
      operational_status_after_post: postedOperationalExpense.status,
      operational_journal_count: operationalJournal?.journal_count ?? 0,
      operational_line_count: operationalJournal?.line_count ?? 0,
      operational_line_codes: operationalLines.map((line) => line.code),
    });

    if ((manualJournal?.journal_count ?? 0) < 1 || (manualJournal?.line_count ?? 0) !== 2) {
      failures.push("Manual opex journal tidak terbentuk tepat 2 baris.");
    }

    if ((operationalJournal?.journal_count ?? 0) < 1 || (operationalJournal?.line_count ?? 0) !== 2) {
      failures.push("Operational opex journal tidak terbentuk tepat 2 baris.");
    }

    if (!manualLines.some((line) => line.code === marketingAccount.code && Number(line.debit) > 0)) {
      failures.push("Manual opex tidak mendebit akun beban marketing yang dipilih.");
    }

    if (!manualLines.some((line) => line.code === paymentAccount.code && Number(line.credit) > 0)) {
      failures.push("Manual opex tidak mengkredit akun pembayaran yang dipilih.");
    }

    if (!operationalLines.some((line) => line.code === operationalAccount.code && Number(line.debit) > 0)) {
      failures.push("Operational opex tidak mendebit akun beban operasional yang dipilih.");
    }

    if (!operationalLines.some((line) => line.code === paymentAccount.code && Number(line.credit) > 0)) {
      failures.push("Operational opex tidak mengkredit akun pembayaran yang dipilih.");
    }

    const report = {
      ok: failures.length === 0,
      base_url: BASE_URL,
      failures,
      checks,
    };

    console.log(JSON.stringify(report, null, 2));

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (operationalExpenseId) {
      try {
        await requestOrThrow(`/api/accounting/operational-expenses/${operationalExpenseId}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_opex_operational_failed:${operationalExpenseId}:${String(error)}`);
      }
    }

    if (manualExpenseId) {
      try {
        await requestOrThrow(`/api/accounting/operational-expenses/${manualExpenseId}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_opex_manual_failed:${manualExpenseId}:${String(error)}`);
      }
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
