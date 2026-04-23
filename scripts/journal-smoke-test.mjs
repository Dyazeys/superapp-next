import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;
const JOURNAL_SAMPLE_SIZE = Number.parseInt(process.env.JOURNAL_SMOKE_LIMIT || "200", 10);

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL (or SMOKE_DATABASE_URL) for journal smoke test.");
  process.exit(1);
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  const failures = [];

  try {
    const recentJournals = await db.query(
      `
      WITH recent_entries AS (
        SELECT
          je.id,
          je.transaction_date,
          je.reference_type,
          je.description,
          je.created_at
        FROM accounting.journal_entries je
        ORDER BY je.transaction_date DESC, je.created_at DESC, je.id DESC
        LIMIT $1
      )
      SELECT
        re.id,
        re.transaction_date::text AS transaction_date,
        re.reference_type,
        re.description,
        COUNT(jl.id)::int AS line_count,
        COALESCE(SUM(jl.debit), 0)::numeric(18,2)::text AS total_debit,
        COALESCE(SUM(jl.credit), 0)::numeric(18,2)::text AS total_credit
      FROM recent_entries re
      LEFT JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = re.id
      GROUP BY re.id, re.transaction_date, re.reference_type, re.description, re.created_at
      ORDER BY re.transaction_date DESC, re.created_at DESC, re.id DESC
      `,
      [JOURNAL_SAMPLE_SIZE]
    );

    const journals = recentJournals.rows.map((row) => {
      const totalDebit = Number(row.total_debit || 0);
      const totalCredit = Number(row.total_credit || 0);
      return {
        ...row,
        line_count: Number(row.line_count || 0),
        total_debit: totalDebit,
        total_credit: totalCredit,
        balanced: totalDebit === totalCredit,
        balance_gap: Math.abs(totalDebit - totalCredit),
      };
    });

    const byReferenceType = new Map();
    for (const journal of journals) {
      const current = byReferenceType.get(journal.reference_type) ?? {
        count: 0,
        balanced: 0,
        unbalanced: 0,
      };
      current.count += 1;
      if (journal.balanced) {
        current.balanced += 1;
      } else {
        current.unbalanced += 1;
      }
      byReferenceType.set(journal.reference_type, current);
    }

    const unbalancedJournals = journals.filter((journal) => !journal.balanced);
    const sparseLineJournals = journals.filter((journal) => journal.line_count < 2);

    if (journals.length === 0) {
      failures.push("Tidak ada journal_entries yang bisa diuji.");
    }

    if (unbalancedJournals.length > 0) {
      failures.push(`${unbalancedJournals.length} jurnal tidak seimbang pada sampel terbaru.`);
    }

    if (sparseLineJournals.length > 0) {
      failures.push(`${sparseLineJournals.length} jurnal memiliki line_count < 2 pada sampel terbaru.`);
    }

    const report = {
      ok: failures.length === 0,
      sample_size: JOURNAL_SAMPLE_SIZE,
      totals: {
        journals_checked: journals.length,
        unbalanced_count: unbalancedJournals.length,
        sparse_line_count: sparseLineJournals.length,
      },
      by_reference_type: Object.fromEntries(
        [...byReferenceType.entries()].sort(([left], [right]) => left.localeCompare(right))
      ),
      samples: {
        unbalanced: unbalancedJournals.slice(0, 10).map((journal) => ({
          id: journal.id,
          transaction_date: journal.transaction_date,
          reference_type: journal.reference_type,
          description: journal.description,
          line_count: journal.line_count,
          total_debit: journal.total_debit.toFixed(2),
          total_credit: journal.total_credit.toFixed(2),
          balance_gap: journal.balance_gap.toFixed(2),
        })),
        sparse_lines: sparseLineJournals.slice(0, 10).map((journal) => ({
          id: journal.id,
          transaction_date: journal.transaction_date,
          reference_type: journal.reference_type,
          description: journal.description,
          line_count: journal.line_count,
        })),
      },
      failures,
    };

    console.log(JSON.stringify(report, null, 2));

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
