import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // 1. Find fallback user (first active OWNER/DIREKTUR)
    const { rows: [fallbackUser] } = await client.query(`
      SELECT u.id, u.username
      FROM auth.users u
      JOIN auth.roles r ON r.id = u.role_id
      WHERE r.role_name IN ('OWNER', 'DIREKTUR')
        AND u.is_active = true
      ORDER BY r.role_name = 'OWNER' DESC
      LIMIT 1
    `);

    if (!fallbackUser) {
      console.error("No OWNER/DIREKTUR user found. Run auth:seed:bootstrap first.");
      process.exit(1);
    }

    console.log(`Fallback requester: ${fallbackUser.username} (${fallbackUser.id})\n`);

    const id = fallbackUser.id;
    let total = 0;

    // ── Opex Regular ──
    console.log("Backfilling Opex DRAFT...");
    const { rows: opexList } = await client.query(`
      SELECT o.id, o.expense_label, o.amount::numeric
      FROM accounting.operational_expenses o
      WHERE o.status = 'DRAFT'
        AND o.is_product_barter = false
        AND NOT EXISTS (
          SELECT 1 FROM team.approvals a WHERE a.type = 'opex' AND a.source_id = o.id::text
        )
    `);

    for (const row of opexList) {
      const amount = Number(row.amount).toLocaleString("id-ID");
      const title = `Opex — ${row.expense_label ?? "Tanpa Label"} (Rp ${amount})`;
      await client.query(`
        INSERT INTO team.approvals (type, source_id, requester_id, title, status)
        VALUES ('opex', $1, $2, $3, 'pending')
      `, [row.id, id, title]);
      total++;
    }
    console.log(`  ${opexList.length} inserted\n`);

    // ── Opex Barter ──
    console.log("Backfilling Opex Barter DRAFT...");
    const { rows: barterList } = await client.query(`
      SELECT o.id, o.expense_label, o.reference_no
      FROM accounting.operational_expense_barter o
      WHERE o.status = 'DRAFT'
        AND NOT EXISTS (
          SELECT 1 FROM team.approvals a WHERE a.type = 'opex_barter' AND a.source_id = o.id::text
        )
    `);

    for (const row of barterList) {
      const ref = row.reference_no ? ` (${row.reference_no})` : "";
      const title = `Opex Barter — ${row.expense_label ?? "Tanpa Label"}${ref}`;
      await client.query(`
        INSERT INTO team.approvals (type, source_id, requester_id, title, status)
        VALUES ('opex_barter', $1, $2, $3, 'pending')
      `, [row.id, id, title]);
      total++;
    }
    console.log(`  ${barterList.length} inserted\n`);

    // ── Sales Order ──
    console.log("Backfilling Sales Order (non-historical)...");
    const { rows: soList } = await client.query(`
      SELECT o.order_no, o.ref_no
      FROM sales.t_order o
      WHERE o.is_historical = false
        AND NOT EXISTS (
          SELECT 1 FROM team.approvals a WHERE a.type = 'sales_order' AND a.source_id = o.order_no
        )
    `);

    for (const row of soList) {
      const ref = row.ref_no ? ` — ${row.ref_no}` : "";
      const title = `SO ${row.order_no}${ref}`;
      await client.query(`
        INSERT INTO team.approvals (type, source_id, requester_id, title, status)
        VALUES ('sales_order', $1, $2, $3, 'pending')
      `, [row.order_no, id, title]);
      total++;
    }
    console.log(`  ${soList.length} inserted\n`);

    // ── Inbound ──
    console.log("Backfilling Inbound PENDING...");
    const { rows: inboundList } = await client.query(`
      SELECT i.id, i.surat_jalan_vendor, i.receive_date::text
      FROM warehouse.inbound_deliveries i
      WHERE i.qc_status = 'PENDING'
        AND NOT EXISTS (
          SELECT 1 FROM team.approvals a WHERE a.type = 'inbound' AND a.source_id = i.id::text
        )
    `);

    for (const row of inboundList) {
      const sj = row.surat_jalan_vendor ? ` — ${row.surat_jalan_vendor}` : "";
      const date = new Date(row.receive_date).toLocaleDateString("id-ID");
      const title = `Inbound${sj} (${date})`;
      await client.query(`
        INSERT INTO team.approvals (type, source_id, requester_id, title, status)
        VALUES ('inbound', $1, $2, $3, 'pending')
      `, [row.id, id, title]);
      total++;
    }
    console.log(`  ${inboundList.length} inserted\n`);

    // ── Warehouse Adjustment ──
    console.log("Backfilling Warehouse Adjustment DRAFT...");
    const { rows: adjList } = await client.query(`
      SELECT a.id, a.inv_code, a.adj_type, a.reason, a.qty
      FROM warehouse.adjustments a
      WHERE a.post_status = 'DRAFT'
        AND NOT EXISTS (
          SELECT 1 FROM team.approvals ap WHERE ap.type = 'warehouse_adjustment' AND ap.source_id = a.id::text
        )
    `);

    for (const row of adjList) {
      const title = `Adjustment ${row.adj_type} — ${row.inv_code} (${row.reason}, Qty: ${row.qty})`;
      await client.query(`
        INSERT INTO team.approvals (type, source_id, requester_id, title, status)
        VALUES ('warehouse_adjustment', $1, $2, $3, 'pending')
      `, [row.id, id, title]);
      total++;
    }
    console.log(`  ${adjList.length} inserted\n`);

    console.log(`Done. ${total} approval records backfilled.`);
    console.log("Script is idempotent — safe to re-run.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
