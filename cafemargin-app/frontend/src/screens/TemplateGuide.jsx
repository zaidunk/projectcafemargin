'use client'

import { useState } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Download, CheckCircle, AlertCircle, Info, FileSpreadsheet, Table2 } from 'lucide-react'

const MOKA_COLUMNS = [
  { col: 'Date', required: true, detected: true, desc: 'Tanggal transaksi. Format: DD/MM/YYYY atau YYYY-MM-DD', example: '15/01/2026' },
  { col: 'Time', required: false, detected: true, desc: 'Jam transaksi (0–23). Digunakan untuk Peak Hour Analysis', example: '09:30:00' },
  { col: 'Gross Sales', required: true, detected: true, desc: 'Total penjualan sebelum diskon', example: '50000' },
  { col: 'Net Sales', required: true, detected: true, desc: 'Total penjualan setelah diskon. Digunakan sebagai revenue utama', example: '45000' },
  { col: 'Discounts', required: false, detected: true, desc: 'Total diskon yang diberikan per transaksi', example: '5000' },
  { col: 'Items', required: true, detected: true, desc: 'Daftar item per transaksi. Format: "Kopi Susu x 2, Croissant"', example: 'Kopi Susu x 2, Croissant' },
  { col: 'Payment Method', required: false, detected: true, desc: 'Metode pembayaran (Cash, QRIS, GoPay, dll)', example: 'QRIS' },
  { col: 'Receipt Number', required: false, detected: true, desc: 'Nomor struk untuk grouping transaksi', example: 'RCP-001' },
  { col: 'Event Type', required: false, detected: true, desc: 'Tipe event — hanya baris "Payment" yang diproses', example: 'Payment' },
]

const SIMPLE_COLUMNS = [
  { col: 'date', required: true, detected: true, desc: 'Tanggal transaksi. Format: YYYY-MM-DD atau DD/MM/YYYY', example: '2026-01-15' },
  { col: 'item_name', required: true, detected: true, desc: 'Nama item/produk yang terjual', example: 'Kopi Susu' },
  { col: 'unit_price', required: true, detected: true, desc: 'Harga jual per unit (Rupiah)', example: '25000' },
  { col: 'quantity', required: false, detected: true, desc: 'Jumlah unit terjual. Default: 1 jika kosong', example: '2' },
  { col: 'hour', required: false, detected: true, desc: 'Jam transaksi (0–23). Untuk Peak Hour Analysis', example: '9' },
  { col: 'hpp', required: false, detected: true, desc: 'Harga Pokok Penjualan per unit. Isi untuk Margin Analysis', example: '8000' },
  { col: 'total_revenue', required: false, detected: true, desc: 'Total revenue. Jika kosong, dihitung: unit_price × quantity', example: '50000' },
  { col: 'category', required: false, detected: true, desc: 'Kategori item (Minuman, Makanan, dll). Default: Lainnya', example: 'Minuman' },
  { col: 'payment_method', required: false, detected: true, desc: 'Metode pembayaran', example: 'Cash' },
  { col: 'receipt_number', required: false, detected: true, desc: 'Nomor struk/invoice', example: 'RCP-001' },
  { col: 'discount', required: false, detected: true, desc: 'Diskon per baris transaksi', example: '0' },
]

const ANALYTICS_NEEDS = [
  { feature: 'Revenue & Sales Analytics', columns: ['date', 'item_name', 'unit_price', 'quantity / total_revenue'], note: 'Minimal untuk analisis dasar' },
  { feature: 'Margin Analysis', columns: ['hpp'], note: 'Tanpa HPP, margin tidak bisa dihitung' },
  { feature: 'Peak Hour Analysis', columns: ['hour / Time'], note: 'Tanpa jam, peak hour tidak bisa dideteksi' },
  { feature: 'Payment Insights', columns: ['payment_method / Payment Method'], note: 'Untuk breakdown per metode bayar' },
  { feature: 'Discount Analysis', columns: ['discount / Discounts'], note: 'Untuk analisis dampak diskon' },
  { feature: 'Menu Performance', columns: ['category'], note: 'Untuk grouping per kategori menu' },
  { feature: 'Basket Analysis', columns: ['receipt_number / Receipt Number', 'Items (Moka)'], note: 'Untuk analisis kombinasi item per struk' },
]

function Badge({ ok }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200"><CheckCircle size={10} />Required</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-500 border border-brand-200"><Info size={10} />Optional</span>
}

export default function TemplateGuide() {
  const [tab, setTab] = useState('moka')

  async function downloadTemplate(format) {
    try {
      const res = await api.get(`/transactions/template?format=${format}`)
      const blob = new Blob([res.data.template], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = res.data.filename; a.click()
      URL.revokeObjectURL(url)
      toast.success('Template berhasil didownload!')
    } catch {
      toast.error('Gagal mendownload template')
    }
  }

  const columns = tab === 'moka' ? MOKA_COLUMNS : SIMPLE_COLUMNS

  return (
    <AppLayout title="Panduan Template & Kolom Data">
      <div className="space-y-5 max-w-4xl">

        {/* Header */}
        <div className="card border-2 border-brand-200 bg-brand-50/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-700 rounded-xl flex-shrink-0">
              <Table2 size={22} className="text-brand-50" />
            </div>
            <div>
              <h2 className="font-bold text-brand-800 text-lg">Kolom yang Dideteksi Otomatis</h2>
              <p className="text-brand-500 text-sm mt-1">
                CafeMargin mendukung dua format file: <strong>Export Moka POS</strong> dan <strong>Template CafeMargin (Simple)</strong>.
                Format dideteksi otomatis saat upload. Lihat kolom yang dibutuhkan di bawah.
              </p>
            </div>
          </div>
        </div>

        {/* Format tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('moka')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'moka' ? 'bg-brand-700 text-white shadow-md' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'
            }`}
          >
            <FileSpreadsheet size={16} />
            Moka POS Export
          </button>
          <button
            onClick={() => setTab('simple')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'simple' ? 'bg-brand-700 text-white shadow-md' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'
            }`}
          >
            <Table2 size={16} />
            Template CafeMargin
          </button>
        </div>

        {/* Detection logic */}
        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-brand-800">
              {tab === 'moka' ? 'Format Moka POS — Kolom yang Dideteksi' : 'Format CafeMargin Simple — Kolom yang Dideteksi'}
            </h3>
            <button
              onClick={() => downloadTemplate(tab === 'moka' ? 'moka' : 'cafemargin')}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Download size={13} />
              Download Template
            </button>
          </div>
          <p className="text-xs text-brand-400 mb-4">
            {tab === 'moka'
              ? 'Deteksi: sistem mencari kolom "Items" + ("Gross Sales" atau "Net Sales"). Case-insensitive, spasi di-trim otomatis.'
              : 'Deteksi: sistem mencari kolom "item_name" + "unit_price". Nama kolom lowercase dengan underscore.'}
          </p>

          <div className="table-container">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th className="w-36">Kolom</th>
                  <th className="w-24">Status</th>
                  <th>Deskripsi</th>
                  <th className="w-32">Contoh nilai</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((c) => (
                  <tr key={c.col}>
                    <td>
                      <code className="bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-brand-700">{c.col}</code>
                    </td>
                    <td><Badge ok={c.required} /></td>
                    <td className="text-brand-600">{c.desc}</td>
                    <td className="font-mono text-[11px] text-brand-500">{c.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics needs */}
        <div className="card">
          <h3 className="font-semibold text-brand-800 mb-1">Kolom yang Dibutuhkan per Fitur Analitik</h3>
          <p className="text-xs text-brand-400 mb-4">Semakin lengkap kolom yang diisi, semakin akurat hasil analisis.</p>
          <div className="space-y-2">
            {ANALYTICS_NEEDS.map((item) => (
              <div key={item.feature} className="flex items-start gap-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                <CheckCircle size={15} className="text-brand-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-800 text-sm">{item.feature}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {item.columns.map((col) => (
                      <code key={col} className="bg-white border border-brand-200 px-1.5 py-0.5 rounded text-[11px] font-mono text-brand-600">{col}</code>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-brand-400 flex-shrink-0 max-w-[180px] text-right">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">Tips untuk Moka POS</span>
            </div>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Export dari Moka: Laporan → Penjualan → Export CSV</li>
              <li>Pastikan kolom <code className="bg-amber-100 px-1 rounded">Items</code> tidak kosong</li>
              <li>HPP bisa diinput manual di Settings → Menu setelah upload</li>
              <li>Item yang tidak ada di daftar menu akan dibuat otomatis</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-blue-600" />
              <span className="font-semibold text-blue-800 text-sm">Tips untuk Template Simple</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Download template → isi data → upload</li>
              <li>Kolom <code className="bg-blue-100 px-1 rounded">hpp</code> wajib diisi untuk Margin Analysis</li>
              <li>Format tanggal: <code className="bg-blue-100 px-1 rounded">YYYY-MM-DD</code> lebih aman</li>
              <li>Kolom <code className="bg-blue-100 px-1 rounded">category</code> default ke "Lainnya" jika kosong</li>
            </ul>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
