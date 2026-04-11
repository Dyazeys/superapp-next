# Rollback SOP (SuperApp Next ERP)

Tanggal: `2026-04-11`

## Tujuan

Panduan rollback cepat jika setelah deploy ditemukan error kritikal yang berdampak ke operasional.

## Trigger Rollback

- Error 5xx masif pada endpoint inti (`product`, `warehouse`, `sales`, `payout`) > 5 menit.
- Data transaksi gagal tersimpan atau inkonsisten.
- UI/UX gagal dipakai operasional (blokir proses harian).

## Langkah Rollback

1. Freeze perubahan:
- Nonaktifkan akses write (maintenance mode / hentikan traffic write jika tersedia).
- Informasikan status incident ke PIC operasional.

2. Validasi backup terakhir:
- Pastikan file backup terakhir tersedia (`backups/office-superapp-latest.sql` atau file timestamp terbaru).
- Pastikan ukuran file masuk akal (bukan 0 byte).

3. Restore database:
- Untuk environment target, restore ke DB aktif sesuai SOP:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\db-restore.ps1 -InputFile backups\office-superapp-latest.sql
```
- Jika perlu DB terpisah untuk validasi dulu:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\db-restore.ps1 -InputFile backups\office-superapp-latest.sql -Database <db_uji>
```

4. Verifikasi pasca-restore:
- Cek endpoint utama kembali 200.
- Cek count data kunci (inventory, product, sales order, payout).
- Jalankan smoke test minimal: login, buka dashboard, buka modul product/warehouse/sales/payout.

5. Re-open traffic:
- Aktifkan kembali akses write.
- Monitor 30-60 menit pertama untuk error rate.

## Komando Validasi Cepat

```powershell
npm run lint
npm run build
```

## PIC & Eskalasi

- PIC teknis: Tim Dev/Ops
- PIC bisnis: Tim Operasional
- Keputusan final rollback/re-open dilakukan bersama (teknis + bisnis).
