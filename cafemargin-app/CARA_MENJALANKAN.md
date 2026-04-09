# CafeMargin Web App — Cara Menjalankan

## Prasyarat
- Python 3.12+
- Node.js 20+
- pip & npm

---

## Cara Cepat (Tanpa Docker)

### 1. Backend (FastAPI)

```bash
cd cafemargin-app/backend
pip install -r requirements.txt
python seed.py          # buat data demo
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

Frontend berjalan di: http://localhost:5173

---

## Akun Demo (setelah seed.py)

| Role | Email | Password | Cafe |
|---|---|---|---|
| Superadmin | admin@cafemargin.id | admin123 | Semua |
| Owner (Level GROWTH) | budi@kopinusantara.id | demo123 | Kopi Nusantara |
| Staff | staff@kopinusantara.id | demo123 | Kopi Nusantara |
| Owner (Level DIAGNOSTIC) | siti@rumahkopi.id | demo123 | Rumah Kopi Bandung |

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
