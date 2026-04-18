# BOM TXT Updated Guide (Untuk AI Model Ringan)

Tujuan dokumen ini: bikin AI model murah bisa edit/generate file BOM TXT dengan format yang valid dan aman diimport.

## 1) Format Wajib File

Setiap file harus pakai format multiline seperti ini:

```txt
product_name: <NAMA PRODUK>
deduplicate_key: sku,component_group,component_type,inv_code,sequence_no

row_begin
when: <KONDISI>
sequence_no: <ANGKA>
component_group: <MAIN|ACCESSORY|PACKING|BRANDING|...>
component_type: <INVENTORY|NON_INVENTORY>
inv_code: <kode inventory atau kosong>
component_name: <nama komponen>
qty: <angka>
unit_cost_source: <NOMINAL ANGKA>
is_stock_tracked: <true|false>
is_active: true
notes: <catatan atau kosong>
row_end
```

## 2) Nilai `when` yang Didukung

Gunakan salah satu nilai berikut:

1. `when: always`
2. `when: inv_main:not_null`
3. `when: inv_acc:not_null`
4. `when: inv_acc:eq:<INV_CODE>`

Catatan penting:

1. Kalau harga/accessory beda per nilai `inv_acc`, wajib pakai `inv_acc:eq:<INV_CODE>`.
2. Jangan pakai `inv_acc:not_null` untuk kasus harga beda per kode, karena itu akan kena semua SKU yang punya `inv_acc`.

## 3) Marker yang Didukung

Boleh pakai marker ini:

1. `{{INV_MAIN}}`
2. `{{INV_ACC}}`

Contoh:

1. `inv_code: {{INV_MAIN}}`
2. `inv_code: {{INV_ACC}}`
3. `component_name: Main - {{INV_MAIN}}`

## 4) Aturan Nominal (Paling Penting)

1. Isi `unit_cost_source` dengan angka nominal langsung. Contoh: `70000`.
2. Jangan isi `unit_cost_source: inventory_unit_price` untuk file `updated` ini.
3. `unit_cost_source` boleh `0`, tapi hanya kalau memang sengaja nol.

## 5) Aturan `component_type` dan `inv_code`

1. Kalau `component_type: INVENTORY`, `inv_code` wajib terisi (boleh marker).
2. Kalau `component_type: NON_INVENTORY`, `inv_code` boleh kosong.
3. Untuk komponen non stok (dring, sempri, packing, sticker), set `is_stock_tracked: false`.

## 6) Pola Aman Untuk Produk yang Ada `inv_acc`

Gunakan pola ini:

1. Satu row `inv_main:not_null` untuk komponen main.
2. Satu row per setiap `inv_acc` value, pakai `inv_acc:eq:<INV_CODE>`.
3. Row tambahan `always` untuk non-inventory (packing/branding/dll).

## 7) Checklist Sebelum Simpan

1. `product_name` persis sama dengan master product (case/spasi harus cocok).
2. Semua blok pakai pasangan `row_begin` dan `row_end`.
3. Semua `sequence_no` angka valid.
4. Tidak ada typo key (harus pakai key baku).
5. Semua nominal terisi angka.
6. Semua varian `inv_acc` sudah punya row sendiri jika nominalnya beda.

## 8) Prompt Siap Pakai Untuk AI Murah

Pakai prompt ini apa adanya:

```txt
Kamu editor template BOM TXT. Ikuti format multiline row_begin/row_end secara ketat.
Jangan ubah nama key.
Gunakan kondisi when hanya: always, inv_main:not_null, inv_acc:not_null, inv_acc:eq:<INV_CODE>.
Kalau nilai inv_acc berbeda-beda, wajib buat row terpisah per inv_acc:eq:<INV_CODE>.
Isi unit_cost_source dengan nominal angka langsung (bukan inventory_unit_price).
Untuk component_type NON_INVENTORY, inv_code boleh kosong dan is_stock_tracked harus false.
Kembalikan output hanya isi file TXT final tanpa penjelasan.
```

## 9) Referensi Contoh Valid

Lihat file contoh yang sudah valid:

`data/master-upload/bom-templates-per-product/updated/bom-template-doja-x.txt`

