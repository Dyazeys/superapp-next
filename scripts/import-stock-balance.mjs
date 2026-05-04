#!/usr/bin/env node
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

const connectionString = process.env.PRISMA_DATABASE_URL;
if (!connectionString) {
  console.error("PRISMA_DATABASE_URL is not set in .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("📦 Importing stock balances from CSV...\n");

  const csvPath = process.argv[2] || "data/master-upload/data-stock-balance.csv";
  const rawCsv = readFileSync(csvPath, "utf-8");
  const rows = parse(rawCsv, { columns: true, skip_empty_lines: true, trim: true });

  const balances = rows.map((row) => {
    let qty = parseInt(row.qty_on_hand, 10);
    if (isNaN(qty)) qty = 0;
    if (qty < 0) {
      console.log(`  ⚠️  ${row.inv_code}: qty ${qty} clamped to 0`);
      qty = 0;
    }
    return { inv_code: row.inv_code, qty_on_hand: qty };
  });

  console.log(`  CSV rows: ${rows.length}`);
  console.log(`  Non-zero qty: ${balances.filter((b) => b.qty_on_hand > 0).length}\n`);

  const existingInventory = await prisma.master_inventory.findMany({
    select: { inv_code: true },
  });
  const validCodes = new Set(existingInventory.map((i) => i.inv_code));

  const validBalances = balances.filter((b) => {
    if (!validCodes.has(b.inv_code)) {
      console.log(`  ⚠️  Skipping ${b.inv_code}: not found in master_inventory`);
      return false;
    }
    return true;
  });
  const skippedCount = balances.length - validBalances.length;
  console.log(`  Valid inv_codes: ${validBalances.length}`);
  if (skippedCount > 0) {
    console.log(`  Skipped (not in master_inventory): ${skippedCount}`);
  }

  let balanceCount = 0;
  for (const balance of validBalances) {
    await prisma.stock_balances.upsert({
      where: { inv_code: balance.inv_code },
      update: { qty_on_hand: balance.qty_on_hand, last_updated: new Date() },
      create: { inv_code: balance.inv_code, qty_on_hand: balance.qty_on_hand },
    });
    balanceCount++;
  }
  console.log(`\n  ✅ stock_balances: ${balanceCount} rows upserted`);

  const movementRows = validBalances.filter((b) => b.qty_on_hand > 0);
  console.log(`\n📦 Creating stock_movements for ${movementRows.length} non-zero items...`);

  const now = new Date();
  const movementDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let movementCount = 0;
  for (const row of movementRows) {
    await prisma.stock_movements.create({
      data: {
        movement_date: movementDate,
        inv_code: row.inv_code,
        reference_type: "ADJUSTMENT",
        reference_id: `OPENING-${row.inv_code}`,
        qty_change: row.qty_on_hand,
        running_balance: row.qty_on_hand,
        notes: "Saldo awal (opening stock balance)",
      },
    });
    movementCount++;
  }
  console.log(`  ✅ stock_movements: ${movementCount} rows created`);

  const finalBalanceCount = await prisma.stock_balances.count();
  const finalMovementCount = await prisma.stock_movements.count();
  console.log(`\n📊 Totals in DB:`);
  console.log(`  stock_balances: ${finalBalanceCount} rows`);
  console.log(`  stock_movements: ${finalMovementCount} rows`);
  console.log("\n✅ Import complete!");
}

main().catch((error) => {
  console.error("\n❌ Failed to import stock balances:", error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
