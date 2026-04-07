# Mac Setup Checklist

Gunakan checklist ini saat setup project `superapp-next` di Mac agar perilakunya sama seperti di PC Windows saat ini.

## Target setup

- Repo yang dipakai: `superapp-next`
- Environment yang dipakai: file `.env` yang sama seperti di PC Windows
- Database yang dipakai: database VPS yang sama, lewat SSH tunnel lokal `127.0.0.1:55432`

## Checklist

1. Clone repository `superapp-next`.
2. Pastikan Node.js 20+ sudah terinstall.
3. Pastikan Git dan OpenSSH client tersedia di Mac.
4. Salin file `.env` dari PC Windows ke folder repo di Mac.
5. Pastikan private key SSH untuk akses VPS tersedia di `~/.ssh/id_ed25519`.
6. Jika path key berbeda, set:

```bash
export DB_TUNNEL_KEY_PATH="$HOME/.ssh/nama_key_anda"
```

7. Dari root project, jalankan:

```bash
npm install
npm run prisma:generate
```

8. Buka tunnel database VPS:

```bash
npm run db:tunnel
```

9. Biarkan terminal tunnel tetap hidup.
10. Di terminal kedua, jalankan app:

```bash
npm run dev
```

11. Verifikasi app bisa akses database:
- halaman data sales/payout/accounting bisa terbuka
- tidak ada error koneksi database
- perubahan data dari Mac terlihat sama dengan data di PC Windows

## Jika tunnel tidak jalan

1. Cek key SSH benar.
2. Cek user/host VPS masih benar.
3. Cek port lokal `55432` tidak dipakai proses lain.
4. Jika perlu override:

```bash
DB_TUNNEL_KEY_PATH="$HOME/.ssh/id_ed25519" \
DB_TUNNEL_LOCAL_PORT=55432 \
npm run db:tunnel
```

## Catatan

- Jangan commit file `.env`.
- Jangan pakai mode Docker lokal jika targetnya harus sama persis dengan setup Windows saat ini.
- Untuk setup yang identik dengan Windows, Mac harus memakai `.env` yang sama dan terhubung ke VPS database yang sama.
