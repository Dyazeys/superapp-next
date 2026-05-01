import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL });
await client.connect();

try {
  // 1. Preview SKU target
  const skuRes = await client.query(`
    select sku, product_name, total_hpp::text 
    from product.master_product 
    where product_name ILIKE '%doja%' 
    order by sku
  `);
  console.log('=== SKU Target (product_name mengandung Doja) ===');
  console.table(skuRes.rows);
  console.log('Total SKU match:', skuRes.rowCount);

  // 2. Cek columns product_bom
  const colRes = await client.query(`
    select column_name, data_type, is_nullable 
    from information_schema.columns 
    where table_schema = 'product' and table_name = 'product_bom'
    order by ordinal_position
  `);
  console.log('=== Columns product.product_bom ===');
  console.table(colRes.rows);

  // 3. Cek existing BOM untuk SKU Doja
  const bomRes = await client.query(`
    select sku, component_group, component_type, component_name, qty, unit_cost::text, 
           line_cost::text, is_active, sequence_no, inv_code
    from product.product_bom 
    where sku in (select sku from product.master_product where product_name ILIKE '%doja%')
    order by sku, sequence_no
  `);
  console.log('=== Existing BOM untuk Doja ===');
  console.table(bomRes.rows);
  console.log('Total BOM rows:', bomRes.rowCount);

  // 4. Ringkasan coverage
  const skuTarget = skuRes.rows.length;
  const skuWithBom = new Set(bomRes.rows.map(r => r.sku)).size;
  const skuWithOngkir = new Set(
    bomRes.rows.filter(r => r.component_name === 'ongkir barang masuk').map(r => r.sku)
  ).size;

  console.log('\n=== Ringkasan Coverage ===');
  console.log(`Jumlah SKU target:        ${skuTarget}`);
  console.log(`SKU dengan BOM row:       ${skuWithBom}`);
  console.log(`SKU dengan ongkir:        ${skuWithOngkir}`);
  console.log(`Total BOM rows:           ${bomRes.rowCount}`);
  console.log(`Rata-rata komponen/SKU:   ${bomRes.rowCount > 0 ? (bomRes.rowCount / skuTarget).toFixed(1) : 0}`);
  if (skuWithOngkir === 0) {
    console.log('⚠️  PERINGATAN: Belum ada komponen ongkir barang masuk.');
  } else if (skuWithOngkir < skuTarget) {
    console.log(`⚠️  PERINGATAN: ${skuTarget - skuWithOngkir} SKU belum punya ongkir.`);
  } else {
    console.log('✅ Semua SKU sudah memiliki komponen ongkir barang masuk.');
  }

} catch (err) {
  console.error('Error:', err);
} finally {
  await client.end();
}