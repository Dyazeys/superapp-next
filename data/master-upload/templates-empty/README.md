# Empty Tables Mass-Edit Templates

Template ini dibuat otomatis dari tabel yang saat ini masih kosong di database lokal.
Isi file CSV sesuai kebutuhan lalu gunakan pipeline import/manual load sesuai modul.

Generated at: 2026-04-13T08:26:40.125Z
Total empty tables: 12

## Files
- accounting/operational_expenses.csv
- auth/roles.csv
- auth/users.csv
- payout/t_adjustments.csv
- product/hpp_history.csv
- sales/master_customer.csv
- warehouse/adjustments.csv
- warehouse/inbound_deliveries.csv
- warehouse/inbound_items.csv
- warehouse/master_vendor.csv
- warehouse/purchase_orders.csv
- warehouse/returns.csv

## Notes
- Kolom auto-generated (id serial/uuid) dan timestamp audit (`created_at`, `updated_at`) sengaja tidak dimasukkan.
- Beberapa tabel butuh referensi FK yang harus sudah ada terlebih dahulu.
- Untuk `auth.users`, pastikan `password_hash` sudah dalam format hash (bukan plain password).
- Untuk `accounting/operational_expenses.csv`, kolom `expense_label` dipakai untuk detail subkategori tanpa membuat akun baru.
