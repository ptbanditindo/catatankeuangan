# 🏦 Dhaniar Finance PWA

**Aplikasi Manajemen Keuangan, Portofolio & Perencanaan Finansial Keluarga**

![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![DeepSeek](https://img.shields.io/badge/DeepSeek-AI-orange)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

---

## 📋 Fitur Lengkap

| Fitur | Keterangan |
|-------|------------|
| 🔐 **PIN Auth** | Autentikasi suami/istri via PIN 6 digit (sessionStorage) |
| 🌙 **Dark/Light Theme** | Toggle theme biru-hitam elegan |
| 📊 **Dashboard** | Ringkasan finansial: pemasukan, pengeluaran, net worth |
| 💰 **Pemasukan** | Catat & kelola pemasukan (pribadi/toko) |
| 💸 **Pengeluaran** | Catat & kelola pengeluaran dengan kategori |
| 📈 **Aset & Portofolio** | Saham, forex, emas, dll. dengan metadata JSON |
| 📋 **Hutang & Piutang** | Tracking hutang dengan status lunas/belum |
| 🎯 **Budget & Saving Goals** | Progress bar budget & target tabungan |
| ⏰ **Pengingat** | Reminder tagihan, hutang, piutang |
| 🤖 **AI Chat Asisten** | Chat dengan DeepSeek AI + Function Calling |
| 📱 **PWA Installable** | Bisa diinstall ke HP sebagai app |
| 🗑️ **Riwayat** | Hapus & restore transaksi dalam 30 hari |
| ⚙️ **Pengaturan** | Ganti nama panggilan suami/istri |
| 💾 **Backup Google Sheets** | Auto-backup data ke spreadsheet |

---

## 🚀 Cara Deploy ke Vercel

### Langkah 1: Upload ke GitHub

Buka terminal/CMD di folder ini:

```bash
# Init git
git init
git add .
git commit -m "Initial commit - Dhaniar Finance"

# Buat repo di github.com, lalu:
git remote add origin https://github.com/username/dhaniar-finance.git
git branch -M main
git push -u origin main
```

### Langkah 2: Deploy ke Vercel

1. Buka **https://vercel.com**
2. Login dengan GitHub
3. Klik **Add New** → **Project**
4. Pilih repository `dhaniar-finance`
5. Di halaman **Configure Project**:

### Langkah 3: Set Environment Variables

Di bagian **Environment Variables**, tambahkan SEMUA ini:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_PIN_SUAMI` | `123456` |
| `NEXT_PUBLIC_PIN_ISTRI` | `654321` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oikofuiiuabmxtswtldu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_i4gF5hGUIHx24Na36QN5sQ_uI7fCuy8` |
| `DEEPSEEK_API_KEY` | (isi dengan API key dari platform.deepseek.com) |
| `DEEPSEEK_MODEL` | `deepseek-chat` |
| `GOOGLE_SHEETS_CREDENTIALS` | (biarkan kosong jika tidak pakai) |

### Langkah 4: Deploy

Klik **Deploy** → tunggu ~2 menit
- ✅ Selesai! Dapat URL: `https://dhaniar-finance.vercel.app`

---

## 🛠️ Cara Pengembangan Lokal

```bash
npm install
npm run dev
# Buka http://localhost:3000
```

---

## 📁 Struktur Project

```
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── src/
│   ├── app/
│   │   ├── page.tsx      # Dashboard
│   │   ├── pemasukan/    # Halaman pemasukan
│   │   ├── pengeluaran/  # Halaman pengeluaran
│   │   ├── aset/         # Halaman aset
│   │   ├── hutang/       # Halaman hutang
│   │   ├── budget/       # Budget & tabungan
│   │   ├── reminder/     # Pengingat
│   │   ├── riwayat/      # Riwayat transaksi
│   │   ├── chat/         # AI Asisten
│   │   ├── pengaturan/   # Pengaturan nama
│   │   └── api/
│   │       ├── auth/     # API autentikasi
│   │       ├── chat/     # API DeepSeek AI
│   │       └── backup/   # API Google Sheets
│   ├── components/       # Komponen UI
│   ├── context/          # AuthContext
│   ├── lib/              # Utility library
│   └── types/            # TypeScript types
├── schema.sql           # Database schema Supabase
├── .env.example         # Contoh environment
└── package.json         # Dependencies
```

---

## 📊 Database (Supabase)

Jalankan `schema.sql` di Supabase SQL Editor untuk membuat:
- 7 tabel: `stores`, `transactions`, `debts`, `assets`, `reminders`, `budgets`, `saving_goals`
- 1 view: `financial_health`
- Row Level Security (sudah di-disable untuk kemudahan akses)

---

## 🔑 Login

| Role | PIN |
|------|-----|
| 👨 Suami | `123456` |
| 👩 Istri | `654321` |

---

## 🧠 AI Chat Commands

| Perintah | Aksi |
|----------|------|
| `gaji 5jt` | Catat pemasukan Rp5.000.000 |
| `token 50rb` | Catat pengeluaran token listrik |
| `hutang ica 50rb` | Catat hutang |
| `lunas hutang ica` | Update status hutang |
| `beli saham BCA 1jt` | Catat aset saham |
| `ingatkan bayar listrik tgl 25 300rb` | Buat pengingat |
| `cek ringkasan keuangan` | Tampilkan ringkasan |
| `cari transaksi token` | Cari transaksi |

---

## LICENSE

© 2026 Dhaniar Finance. All rights reserved.