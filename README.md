# Kelola Kambing

Aplikasi web untuk mencatat stok, timbang, kesehatan, biaya, penjualan, dan bagi hasil kambing.

- Pengelola: `/kelola` (ringkasan, kambing, biaya bersama, investor, bagi hasil)
- Investor: `/portal` (hanya melihat kambing miliknya)

Aturan bagi hasil: keuntungan = harga jual - harga beli - biaya. Investor mendapat 50% (jalur Idul Adha) atau 30% (jalur resto/cafe), dibagi sesuai porsi modal bila patungan.

Akun pertama yang mendaftar otomatis menjadi pengelola. Investor mendaftar dengan email yang dicatat pengelola.

## Menjalankan

```
cp .env.example .env.local
npm install
npm run dev
```

Variabel lingkungan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
