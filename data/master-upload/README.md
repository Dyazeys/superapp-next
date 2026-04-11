# Master Upload Dropzone

Taruh file CSV mentah untuk import master data di folder ini.

## Alur pakai

1. Upload file CSV ke `data/master-upload/`
2. Setelah upload, beri tahu saya nama file yang baru masuk.
3. Saya akan validasi struktur kolom lalu import ke sistem.
4. Setelah berhasil, file akan dipindahkan ke `data/master-upload/processed/`
5. Jika perlu arsip manual, gunakan `data/master-upload/archive/`

## Catatan

- Gunakan format template dari `docs/imports/master-data/templates/`
- Hindari spasi/karakter aneh di nama file
- Contoh nama aman: `product_2026-04-11.csv`
