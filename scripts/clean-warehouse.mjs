#!/usr/bin/env node
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.PRISMA_DATABASE_URL;
if (!connectionString) {
  console.error("PRISMA_DATABASE_URL is not set in .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("🧹 Cleaning warehouse data...\n");

  const steps = [
    { name: "stock_movements", action: () => prisma.stock_movements.deleteMany() },
    { name: "stock_balances", action: () => prisma.stock_balances.deleteMany() },
    { name: "adjustments", action: () => prisma.adjustments.deleteMany() },
    { name: "inbound_items", action: () => prisma.inbound_items.deleteMany() },
    { name: "returns (old)", action: () => prisma.returns.deleteMany() },
    { name: "warehouse_return_items", action: () => prisma.warehouse_return_items.deleteMany() },
    { name: "warehouse_returns", action: () => prisma.warehouse_returns.deleteMany() },
    { name: "purchase_order_items", action: () => prisma.purchase_order_items.deleteMany() },
    { name: "inbound_deliveries", action: () => prisma.inbound_deliveries.deleteMany() },
    { name: "purchase_orders", action: () => prisma.purchase_orders.deleteMany() },
    { name: "master_vendor", action: () => prisma.master_vendor.deleteMany() },
  ];

  for (const step of steps) {
    const result = await step.action();
    console.log(`  ${step.name}: ${result.count} rows deleted`);
  }

  console.log("\n✅ Warehouse data cleaned successfully!");
}

main().catch((error) => {
  console.error("\n❌ Failed to clean warehouse data:", error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
