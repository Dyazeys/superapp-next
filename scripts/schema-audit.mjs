#!/usr/bin/env node
/**
 * Schema Audit Script
 * Membandingkan schema Prisma (schema.prisma) dengan database production
 * untuk mendeteksi drift: kolom/index yang ada di Prisma tapi tidak di DB.
 *
 * Usage:
 *   node scripts/schema-audit.mjs
 *
 * Prerequisites:
 *   DB tunnel harus sudah berjalan (node scripts/db-tunnel.mjs)
 *   Environment variables DATABASE_URL atau PRISMA_DATABASE_URL harus diset
 */

import "dotenv/config";
import pg from "pg";
import { readFileSync } from "node:fs";

const { Client } = pg;

// ---- Parse schema.prisma untuk ekstrak model/column/index ----

function parseSchema(schemaPath) {
  const content = readFileSync(schemaPath, "utf-8");
  const models = [];

  // Regex: match model blocks
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];

    const schemaMatch = body.match(/@@schema\("(\w+)"\)/);
    const mappedName = body.match(/@@map\("(\w+)"\)/);
    const tableName = mappedName ? mappedName[1] : modelName;
    const schemaName = schemaMatch ? schemaMatch[1] : "public";

    const columns = [];
    const indexes = [];

    const lines = body.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();

      // Column: name Type [modifiers]
      const colMatch = trimmed.match(/^(\w+)\s+\w+/);
      if (colMatch && !trimmed.startsWith("@@") && !trimmed.startsWith("//")) {
        const colName = colMatch[1];
        // Check for @map
        const mapMatch = trimmed.match(/@map\("(\w+)"\)/);
        const dbColName = mapMatch ? mapMatch[1] : colName;
        if (!columns.find((c) => c.dbName === dbColName)) {
          columns.push({ prismaName: colName, dbName: dbColName });
        }
      }

      // Index: @@index([fields], map: "name")
      const indexMatch = trimmed.match(/@@index\(\[([^\]]+)\],\s*map:\s*"(\w+)"/);
      if (indexMatch) {
        indexes.push({ fields: indexMatch[1], name: indexMatch[2] });
      }
    }

    models.push({ modelName, tableName, schemaName, columns, indexes });
  }

  return models;
}

// ---- Query database untuk kolom dan index yang ada ----

async function getDbColumns(client, schema, table) {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
    [schema, table]
  );
  return new Set(res.rows.map((r) => r.column_name));
}

async function getDbIndexes(client, schema, table) {
  const res = await client.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND tablename=$2`,
    [schema, table]
  );
  return new Set(res.rows.map((r) => r.indexname));
}

// ---- Main ----

async function main() {
  const connectionString =
    process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL or PRISMA_DATABASE_URL not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  console.log("🔍 Schema Audit: Comparing prisma/schema.prisma vs Database\n");

  const models = parseSchema("prisma/schema.prisma");
  let totalDrifts = 0;
  let totalTables = 0;

  for (const model of models) {
    totalTables++;
    const dbColumns = await getDbColumns(client, model.schemaName, model.tableName);
    const dbIndexes = await getDbIndexes(client, model.schemaName, model.tableName);

    const missingCols = model.columns.filter((c) => !dbColumns.has(c.dbName));
    const missingIdxs = model.indexes.filter((i) => !dbIndexes.has(i.name));

    if (missingCols.length > 0 || missingIdxs.length > 0) {
      console.log(`❌ ${model.schemaName}.${model.tableName} (model: ${model.modelName})`);
      for (const col of missingCols) {
        console.log(`   ⚠️  Missing column: ${col.dbName} (Prisma: ${col.prismaName})`);
        totalDrifts++;
      }
      for (const idx of missingIdxs) {
        console.log(`   ⚠️  Missing index: ${idx.name} (fields: ${idx.fields})`);
        totalDrifts++;
      }
      console.log();
    }
  }

  if (totalDrifts === 0) {
    console.log(`✅ All ${totalTables} tables match schema.prisma — no drift detected.\n`);
  } else {
    console.log(`🚨 Found ${totalDrifts} drift(s) across ${totalTables} tables.\n`);
  }

  await client.end();
  process.exit(totalDrifts > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(2);
});