# CafeMargin Web App — Cara Menjalankan

## Prasyarat
- Python 3.12+
- Node.js 20+
- pip & npm

---

## Cara Cepat (Tanpa Docker)

### 0. Supabase (Wajib untuk Reports & Storage)

Jika ingin memakai fitur laporan PDF dan storage, siapkan Supabase lebih dulu.

1) Buat file `.env` di folder `cafemargin-app` (sejajar dengan `backend/` dan `frontend/`).
	Salin isi dari `.env.example`, lalu isi minimal:
	- `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY` (service role key, bukan anon key)

2) Inisialisasi bucket (sekali saja):

```bash
cd cafemargin-app/backend
python app/scripts/init_supabase_buckets.py
```

> Catatan: Tanpa Supabase, backend tetap bisa jalan, tetapi endpoint laporan/storage akan gagal.

### 1. Backend (FastAPI)

```bash
cd cafemargin-app/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend berjalan di: http://localhost:8000
API Docs: http://localhost:8000/docs

### 2. Frontend (React + Vite)

```bash
cd cafemargin-app/frontend
npm install
npm run dev
```

Frontend berjalan di: http://localhost:3000

---

## Setup Akun

Tidak ada akun default. Buat superadmin pertama lewat endpoint:

```
POST /api/admin/users
```

Kemudian buat akun cafe owner dan staff lewat panel superadmin atau API yang sama.

---

## Cara Docker (Opsional)

```bash
cd cafemargin-app
docker-compose up --build
```

---

## Upload Data Transaksi

Format CSV yang dibutuhkan (download template dari halaman Transaksi):

| Kolom | Deskripsi | Contoh |
|---|---|---|
| date | Tanggal transaksi | 2026-01-15 |
| hour | Jam (0-23) | 8 |
| item_name | Nama menu | Kopi Susu |
| category | Kategori | Minuman |
| quantity | Jumlah | 2 |
| unit_price | Harga per unit (Rp) | 25000 |
| hpp | HPP / COGS per unit (Rp) | 8000 |
| total_revenue | Total revenue (opsional, auto-hitung) | 50000 |

---

## Struktur Fitur per Level

| Level | Nama | Fitur |
|---|---|---|
| 1 | DIAGNOSTIC | Dashboard, Transaksi, Margin & HPP, Peak Hour, Reports |
| 2 | GROWTH | + Menu Performance, KPI & Action Plan |
| 3 | CONTROL | + semua Level 2 |
| 4 | SCALE | + semua fitur penuh |

---

*CafeMargin — PT Xolvon Kehidupan Cerdas Abadi*
