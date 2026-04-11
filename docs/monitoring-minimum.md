# Monitoring Minimum (SuperApp Next ERP)

Tanggal: `2026-04-11`

## Tujuan

Monitoring minimum agar error kritikal cepat terdeteksi setelah deploy.

## 1) Health Check Berkala

Jalankan command berikut tiap 5 menit:

```powershell
npm run go-live:check
```

Jika exit code `1`, anggap sebagai alert dan eskalasi ke PIC teknis.

## 2) Endpoint Kritis yang Harus Dipantau

- `/api/product/inventory`
- `/api/warehouse/stock-balances`
- `/api/sales/orders`
- `/api/payout/records`
- `/api/accounting/journals`

## 3) Log yang Harus Dipantau

- Aplikasi: file `.uat-live.out.log` atau log process `next start`.
- Tunnel DB: log `.db-tunnel*.log` dan process `ssh`.
- Error kritikal: HTTP 5xx berulang, timeout koneksi DB, query gagal.

## 4) Ambang Eskalasi

- Endpoint kritis gagal 2 kali berturut-turut.
- Error 5xx berulang > 5 menit.
- Operasional melaporkan transaksi tidak tersimpan.

## 5) Tindakan Saat Alert

1. Freeze perubahan rilis baru.
2. Cek koneksi DB/tunnel.
3. Jalankan smoke check `npm run go-live:check`.
4. Jika belum pulih, jalankan prosedur rollback di `docs/rollback-sop.md`.
