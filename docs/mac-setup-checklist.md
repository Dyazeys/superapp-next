# Mac Setup Checklist

Gunakan checklist ini saat setup project `superapp-next` di Mac agar perilakunya sama seperti di PC Windows saat ini.

## Target setup

- Repo yang dipakai: `superapp-next`
- Environment yang dipakai: file `.env` yang sama seperti di PC Windows
- Database yang dipakai: database VPS yang sama, lewat SSH tunnel lokal `127.0.0.1:55432`

## Sebelum mulai

- [ ] Siapkan akses repo GitHub `superapp-next`
- [ ] Siapkan file `.env` yang dipakai di PC Windows
- [ ] Siapkan private key SSH untuk akses VPS
- [ ] Pastikan tahu user/host VPS yang dipakai untuk DB tunnel

## Checklist setup di Mac

- [ ] Clone repository `superapp-next`
- [ ] Pastikan Node.js 20+ sudah terinstall
- [ ] Pastikan Git tersedia
- [ ] Pastikan OpenSSH client tersedia di Mac
- [ ] Salin file `.env` dari PC Windows ke folder repo di Mac
- [ ] Pastikan private key SSH untuk akses VPS tersedia di `~/.ssh/id_ed25519`
- [ ] Jika path key berbeda, set environment variable berikut:

```bash
export DB_TUNNEL_KEY_PATH="$HOME/.ssh/nama_key_anda"
```

- [ ] Dari root project, jalankan:

```bash
npm install
npm run prisma:generate
```

- [ ] Buka tunnel database VPS:

```bash
npm run db:tunnel
```

- [ ] Biarkan terminal tunnel tetap hidup
- [ ] Di terminal kedua, jalankan app:

```bash
npm run dev
```

## Verifikasi setelah app jalan

- [ ] Halaman sales bisa terbuka
- [ ] Halaman payout bisa terbuka
- [ ] Halaman accounting bisa terbuka
- [ ] Tidak ada error koneksi database
- [ ] Data yang terlihat sama dengan data di PC Windows
- [ ] Perubahan data dari Mac masuk ke database yang sama

## Quick commands

```bash
npm install
npm run prisma:generate
npm run db:tunnel
npm run dev
```

## Jika tunnel tidak jalan

- [ ] Cek key SSH benar
- [ ] Cek user/host VPS masih benar
- [ ] Cek port lokal `55432` tidak dipakai proses lain
- [ ] Jika perlu, jalankan dengan override:

```bash
DB_TUNNEL_KEY_PATH="$HOME/.ssh/id_ed25519" \
DB_TUNNEL_LOCAL_PORT=55432 \
npm run db:tunnel
```

## Catatan

- Jangan commit file `.env`.
- Jangan pakai mode Docker lokal jika targetnya harus sama persis dengan setup Windows saat ini.
- Untuk setup yang identik dengan Windows, Mac harus memakai `.env` yang sama dan terhubung ke VPS database yang sama.
