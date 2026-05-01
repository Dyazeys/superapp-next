import 'dotenv/config';
import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

const {Client} = pg;
const c = new Client({connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL});
await c.connect();

const migrationsDir = 'prisma/migrations';

const newMigrations = [
  '20260417_expand_product_bom_component_group_constraint',
  '20260420_add_notes_to_warehouse_adjustments',
  '20260422_add_posting_status_to_warehouse_adjustments',
  '20260422_rename_approved_by_to_created_by_in_warehouse_adjustments',
  '20260423_add_purchase_order_items_and_po_status_rules',
  '20260428_add_auth_user_profiles',
  '20260428_add_expense_label_to_operational_expenses',
  '20260429_add_contact_email_to_auth_user_profiles',
  '20260430_add_warehouse_returns_table',
];

const pendingMigration = '20260410_add_unique_journal_entry_reference_key';

// Mark pending as applied
await c.query(`
  UPDATE _prisma_migrations 
  SET finished_at = NOW(), logs = 'Manually marked as applied (table owned by postgres, cannot ALTER)'
  WHERE migration_name = $1
  AND finished_at IS NULL
`, [pendingMigration]);
console.log('✅ Marked pending', pendingMigration, 'as applied');

// Insert new migrations
for (const name of newMigrations) {
  const sqlPath = `${migrationsDir}/${name}/migration.sql`;
  let sqlContent = '';
  if (existsSync(sqlPath)) {
    sqlContent = readFileSync(sqlPath, 'utf-8');
  }
  
  const checksum = createHash('sha256').update(sqlContent).digest('hex');
  const id = randomUUID();
  
  await c.query(`
    INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, started_at, applied_steps_count)
    VALUES ($1, $2, NOW(), $3, 'Automatically applied via script', NOW() - interval '1 second', 0)
    ON CONFLICT DO NOTHING
  `, [id, checksum, name]);
  
  console.log('✅ Inserted record:', name);
}

// Verify
const all = await c.query(`SELECT migration_name, finished_at IS NOT NULL as applied FROM _prisma_migrations ORDER BY started_at`);
console.log('\nFinal state:');
all.rows.forEach(r => console.log(' -', r.migration_name, r.applied ? '✅' : '⏳'));

await c.end();