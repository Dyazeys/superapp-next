# Auth, Role, and RBAC Design Draft

Tanggal update: `2026-04-28`

Dokumen ini merangkum desain awal role dan permission untuk SuperApp berdasarkan modul yang saat ini sudah aktif di aplikasi.

Catatan struktur navigasi:

- modul auth diletakkan di menu `Team`
- area ini menjadi rumah untuk `Users` dan `Roles & Permissions`
- tujuannya agar kontrol akses tidak bercampur dengan modul transaksi ERP

## Daftar Role

Role inti yang dipakai:

- `OWNER` -> pemilik brand
- `DIREKTUR` -> pimpinan tim
- `LEADER` -> leader team
- `ADVERTISER` -> staff advertiser
- `SALES` -> staff sales
- `ACCOUNTING` -> staff accounting
- `PURCHASING` -> staff purchasing

## Prinsip Akses

- `OWNER` melihat hampir semua area dan boleh menyetujui keputusan penting.
- `DIREKTUR` mengelola hampir semua operasional harian, tetapi perubahan paling sensitif tetap bisa dibatasi.
- `LEADER` memimpin eksekusi tim lintas modul yang relevan, namun tidak otomatis boleh ubah master sensitif atau approval finansial besar.
- Role staf fokus pada domain kerjanya masing-masing.
- Report analytic sebaiknya bisa dibaca lintas role tertentu tanpa memberi hak ubah transaksi.

## Permission Model

Permission disarankan berbentuk string flat di JSON `auth.roles.permissions`, misalnya:

- `dashboard.view`
- `sales.order.create`
- `accounting.opex.post`

Alasan:
- mudah dicek di API dan UI
- mudah disimpan di kolom JSON yang sudah ada
- tidak mengunci kita ke struktur nested tertentu

## Daftar Permission Inti

### Dashboard & Analytic

- `dashboard.view`
- `analytics.report_pnl.view`
- `analytics.budget_meters.view`

### Sales

- `sales.order.view`
- `sales.order.create`
- `sales.order.update`
- `sales.order.delete`
- `sales.order.post`
- `sales.customer.view`
- `sales.customer.create`
- `sales.customer.update`
- `sales.customer.delete`

### Warehouse

- `warehouse.vendor.view`
- `warehouse.vendor.create`
- `warehouse.vendor.update`
- `warehouse.vendor.delete`
- `warehouse.purchase_order.view`
- `warehouse.purchase_order.create`
- `warehouse.purchase_order.update`
- `warehouse.purchase_order.delete`
- `warehouse.inbound.view`
- `warehouse.inbound.create`
- `warehouse.inbound.update`
- `warehouse.inbound.post`
- `warehouse.adjustment.view`
- `warehouse.adjustment.create`
- `warehouse.adjustment.update`
- `warehouse.adjustment.post`
- `warehouse.stock.view`

### Product

- `product.category.view`
- `product.category.create`
- `product.category.update`
- `product.category.delete`
- `product.inventory.view`
- `product.inventory.create`
- `product.inventory.update`
- `product.inventory.delete`
- `product.master.view`
- `product.master.create`
- `product.master.update`
- `product.master.delete`
- `product.bom.view`
- `product.bom.create`
- `product.bom.update`
- `product.bom.delete`

### Channel

- `channel.group.view`
- `channel.group.create`
- `channel.group.update`
- `channel.group.delete`
- `channel.category.view`
- `channel.category.create`
- `channel.category.update`
- `channel.category.delete`
- `channel.master.view`
- `channel.master.create`
- `channel.master.update`
- `channel.master.delete`

### Payout

- `payout.record.view`
- `payout.record.create`
- `payout.record.update`
- `payout.record.delete`
- `payout.adjustment.view`
- `payout.adjustment.create`
- `payout.adjustment.update`
- `payout.adjustment.delete`
- `payout.transfer.view`
- `payout.transfer.create`
- `payout.transfer.update`
- `payout.transfer.delete`
- `payout.reconciliation.view`

### Accounting

- `accounting.account.view`
- `accounting.account.create`
- `accounting.account.update`
- `accounting.account.delete`
- `accounting.journal.view`
- `accounting.journal.create`
- `accounting.journal.update`
- `accounting.journal.delete`
- `accounting.opex.view`
- `accounting.opex.create`
- `accounting.opex.update`
- `accounting.opex.delete`
- `accounting.opex.post`
- `accounting.opex.void`
- `accounting.opex.barter.view`
- `accounting.opex.barter.create`
- `accounting.opex.barter.update`
- `accounting.opex.barter.delete`
- `accounting.opex.barter.post`
- `accounting.opex.barter.void`

### Marketing Workspace

- `marketing.workspace.view`
- `marketing.product_performance.view`
- `marketing.traffic.view`
- `marketing.mp_ads.view`
- `marketing.live_streaming.view`

### Content Workspace

- `content.workspace.view`
- `content.tiktok.view`
- `content.instagram.view`
- `content.daily_report.view`
- `content.daily_report.create`
- `content.daily_report.update`
- `content.daily_report.delete`
- `content.daily_report.approve`

### Admin & Security

- `auth.user.view`
- `auth.user.create`
- `auth.user.update`
- `auth.user.reset_password`
- `auth.role.view`
- `auth.role.create`
- `auth.role.update`

## Rekomendasi Matrix Role

### 1. OWNER

Hak akses:
- semua permission `view`
- semua permission `create/update/delete`
- semua permission `post/void/approve`
- `auth.user.*`
- `auth.role.*`

Catatan:
- role paling tinggi
- dipakai untuk pemilik brand dan supervisi penuh

### 2. DIREKTUR

Hak akses:
- semua permission `view`
- hampir semua permission `create/update`
- boleh `post/void/approve` untuk finance dan operasional
- boleh kelola user
- tidak wajib boleh edit role matrix inti, tergantung keputusan final

Batas yang disarankan:
- `auth.role.update` bisa tetap hanya untuk `OWNER`

### 3. LEADER

Hak akses:
- `dashboard.view`
- semua report analytic `view`
- view lintas domain operasional
- create/update transaksi pada domain timnya
- approval terbatas sesuai domain

Default aman:
- `sales.order.*` selain delete massal
- `warehouse.purchase_order.*`
- `warehouse.inbound.view/create/update/post`
- `warehouse.adjustment.view/create/update/post`
- `payout.*.view`
- `marketing.*.view`
- `content.*.view`
- `content.daily_report.*`
- `accounting.opex.view/create/update`

Batas:
- tidak pegang `auth.role.*`
- tidak pegang `accounting.account.*`
- tidak pegang `accounting.journal.delete`

### 4. ADVERTISER

Hak akses:
- `dashboard.view`
- `analytics.report_pnl.view`
- `analytics.budget_meters.view`
- `marketing.workspace.view`
- `marketing.product_performance.view`
- `marketing.traffic.view`
- `marketing.mp_ads.view`
- `marketing.live_streaming.view`
- `content.workspace.view`
- `content.tiktok.view`
- `content.instagram.view`
- `content.daily_report.view/create/update`

Batas:
- tidak boleh ubah finance, warehouse, sales, product master, atau channel master

### 5. SALES

Hak akses:
- `dashboard.view`
- `sales.order.view/create/update`
- `sales.customer.view/create/update`
- `channel.master.view`
- `payout.record.view`
- `payout.adjustment.view`
- `payout.reconciliation.view`

Batas:
- tidak boleh approval warehouse
- tidak boleh ubah accounting
- delete transaksi bisa dibatasi hanya ke leader ke atas

### 6. ACCOUNTING

Hak akses:
- `dashboard.view`
- `analytics.report_pnl.view`
- `analytics.budget_meters.view`
- `accounting.account.view`
- `accounting.journal.view/create/update`
- `accounting.opex.view/create/update/post/void`
- `accounting.opex.barter.view/create/update/post/void`
- `payout.record.view`
- `payout.adjustment.view`
- `payout.transfer.view/create/update`
- `payout.reconciliation.view`
- `channel.master.view`

Batas:
- tidak perlu edit master product/warehouse/sales
- `accounting.account.update` bisa ditahan ke `OWNER` atau `DIREKTUR`

### 7. PURCHASING

Hak akses:
- `dashboard.view`
- `product.category.view`
- `product.inventory.view`
- `product.master.view`
- `product.bom.view`
- `warehouse.vendor.view/create/update`
- `warehouse.purchase_order.view/create/update`
- `warehouse.inbound.view`
- `warehouse.stock.view`

Batas:
- tidak pegang accounting
- tidak pegang payout
- tidak pegang auth admin

## Mapping Cepat Role ke Fokus Modul

| Role | Fokus utama |
|---|---|
| `OWNER` | semua modul + approval + admin user/role |
| `DIREKTUR` | semua modul operasional + approval lintas fungsi |
| `LEADER` | koordinasi operasional + approval terbatas |
| `ADVERTISER` | analytic, marketing, content |
| `SALES` | sales, customer, payout read |
| `ACCOUNTING` | accounting, payout, analytic read |
| `PURCHASING` | vendor, PO, inbound read, product read |

## Rekomendasi Implementasi Teknis

### 1. Session Payload

Session/JWT minimal harus membawa:

- `user.id`
- `user.username`
- `user.full_name`
- `user.role_code`
- `user.permissions`

### 2. Guard Server

Buat helper terpusat:

- `requireAuth()`
- `requirePermission(permission)`
- `requireAnyPermission([...])`

Target pemakaian:
- semua `app/api/*`
- server action jika nanti ada
- page yang sensitif bila perlu pembatasan lebih detail dari sekadar login

### 3. UI Guard

Di sidebar dan halaman:

- menu disembunyikan jika role tidak punya permission view
- tombol create/edit/post/void disembunyikan jika tidak punya permission

Catatan:
- UI guard hanya untuk UX
- enforcement utama tetap wajib di server/API

### 4. Audit Trail

Untuk transaksi penting, mulai siapkan field:

- `created_by`
- `updated_by`
- `posted_by`
- `voided_by`

Karena saat ini session belum membawa user DB riil, implementasi audit trail sebaiknya dilakukan bersamaan dengan refactor auth login ke `auth.users`.

## Fase Implementasi yang Disarankan

1. finalisasi role code + permission key
2. login pakai `auth.users` dan `auth.roles`
3. session/JWT memuat role + permissions
4. helper guard untuk API
5. proteksi route write terlebih dulu
6. proteksi route read sensitif
7. rapikan sidebar dan tombol action berdasar permission

## Bootstrap Auth Saat Ini

Implementasi auth saat ini memakai mode transisi:

- jika `auth.users` masih kosong, login demo dari `.env` tetap aktif
- jika sudah ada user aktif di `auth.users`, login pindah ke database
- session membawa `user.id`, `username`, `roleName`, dan `permissions`

Untuk membuat hash password awal, gunakan:

```bash
npm run auth:hash -- 'PasswordKuatKamu'
```

Output script ini bisa dimasukkan ke kolom `auth.users.password_hash`.

Untuk seed bootstrap role + owner pertama dari `.env`, gunakan:

```bash
npm run auth:seed:bootstrap
```

Script ini akan:

- meng-upsert role default ke `auth.roles`
- mengisi permission template awal
- membuat atau meng-update user owner bootstrap dari `DEMO_ADMIN_EMAIL`
- meng-hash `DEMO_ADMIN_PASSWORD` ke format `scrypt$...`

## Keputusan Awal yang Disarankan

Kalau ingin aman tapi tetap cepat, baseline awal yang saya sarankan:

- `OWNER` = superuser penuh
- `DIREKTUR` = hampir penuh kecuali edit role matrix inti
- `LEADER` = operational power user tanpa admin auth
- `ADVERTISER` = marketing + content
- `SALES` = sales + customer + payout read
- `ACCOUNTING` = accounting + payout + analytic read
- `PURCHASING` = vendor + PO + inbound read + product read

Ini sudah cukup kuat untuk mulai implementasi guard malam ini tanpa terlalu banyak diskusi tambahan.
