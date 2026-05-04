import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  console.log("=== CLEANUP TRANSAKSI OPEX, OPEX BARTER & PAYOUT ===\n");

  try {
    await db.query("BEGIN");

    // --- PAYOUT ---
    console.log("[1/7] Menghapus journal entries PAYOUT (settlement, adjustment, transfer)...");
    const journalPayoutResult = await db.query(`
      DELETE FROM accounting.journal_entries
      WHERE reference_type IN ('PAYOUT_SETTLEMENT', 'PAYOUT_ADJUSTMENT', 'PAYOUT_BANK_TRANSFER')
    `);
    console.log(`      ${journalPayoutResult.rowCount} journal entries dihapus (lines cascade)`);

    console.log("[2/7] Menghapus payout_transfers...");
    const transferResult = await db.query(`DELETE FROM payout.payout_transfers`);
    console.log(`      ${transferResult.rowCount} transfer dihapus`);

    console.log("[3/7] Menghapus t_adjustments...");
    const adjustmentResult = await db.query(`DELETE FROM payout.t_adjustments`);
    console.log(`      ${adjustmentResult.rowCount} adjustment dihapus`);

    console.log("[4/7] Menghapus t_payout...");
    const payoutResult = await db.query(`DELETE FROM payout.t_payout`);
    console.log(`      ${payoutResult.rowCount} payout record dihapus`);

    // --- OPEX BARTER ---
    console.log("[5/7] Menghapus journal entries OPERATIONAL_EXPENSE_BARTER...");
    const journalBarterResult = await db.query(`
      DELETE FROM accounting.journal_entries
      WHERE reference_type = 'OPERATIONAL_EXPENSE_BARTER'
    `);
    console.log(`      ${journalBarterResult.rowCount} journal entries dihapus (lines cascade)`);

    console.log("[6/7] Menghapus stock_movements OPERATIONAL_EXPENSE_BARTER...");
    const stockMovementResult = await db.query(`
      DELETE FROM warehouse.stock_movements
      WHERE reference_type = 'OPERATIONAL_EXPENSE_BARTER'
    `);
    console.log(`      ${stockMovementResult.rowCount} stock movements dihapus`);

    console.log("[7/7] Menghapus operational_expense_barter (items cascade)...");
    const barterResult = await db.query(`DELETE FROM accounting.operational_expense_barter`);
    console.log(`      ${barterResult.rowCount} barter dihapus (items cascade)`);

    // --- OPEX ---
    console.log("\n[8/x] Menghapus journal entries OPERATIONAL_EXPENSE...");
    const journalOpexResult = await db.query(`
      DELETE FROM accounting.journal_entries
      WHERE reference_type = 'OPERATIONAL_EXPENSE'
    `);
    console.log(`      ${journalOpexResult.rowCount} journal entries dihapus (lines cascade)`);

    console.log("[9/9] Menghapus operational_expenses...");
    const opexResult = await db.query(`DELETE FROM accounting.operational_expenses`);
    console.log(`      ${opexResult.rowCount} opex dihapus`);

    await db.query("COMMIT");

    // --- RINGKASAN ---
    const totalJournal = journalPayoutResult.rowCount + journalBarterResult.rowCount + journalOpexResult.rowCount;
    const totalPayout = payoutResult.rowCount + adjustmentResult.rowCount + transferResult.rowCount;

    console.log("\n=== CLEANUP SELESAI ===");
    console.log(`Journal entries dihapus     : ${totalJournal}`);
    console.log(`Stock movements dihapus     : ${stockMovementResult.rowCount}`);
    console.log(`Payout records              : ${payoutResult.rowCount} payout, ${adjustmentResult.rowCount} adjustment, ${transferResult.rowCount} transfer`);
    console.log(`Opex records                : ${opexResult.rowCount} opex, ${barterResult.rowCount} barter`);

  } catch (error) {
    await db.query("ROLLBACK");
    console.error("\n=== CLEANUP GAGAL ===");
    console.error(error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
