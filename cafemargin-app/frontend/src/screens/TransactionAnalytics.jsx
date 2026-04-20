import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Trash2, FileSpreadsheet, AlertCircle, CheckCircle, Info, BookOpen } from 'lucide-react'
import Link from 'next/link'
import AppLayout from '../components/Layout/AppLayout'
import UploadZone from '../components/UploadZone'
import MetricCard from '../components/Cards/MetricCard'
import api from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import toast from 'react-hot-toast'
import { TrendingUp, Hash, CreditCard } from 'lucide-react'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`
const PERIOD_OPTIONS = [7, 30, 90, 365, 9999]

export default function TransactionAnalytics() {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [batches, setBatches] = useState([])
  const [summary, setSummary] = useState(null)
  const [revenueByDate, setRevenueByDate] = useState([])
  const [period, setPeriod] = useState(9999)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [paymentBreakdown, setPaymentBreakdown] = useState([])

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(false)
    Promise.all([
      api.get(`/transactions?period_days=${period}`),
      api.get(`/analytics/revenue?period_days=${period}`),
      api.get('/transactions/batches'),
    ]).then(([txRes, analyticsRes, batchRes]) => {
      setTransactions(txRes.data.transactions || [])
      setSummary(analyticsRes.data.summary)
      setRevenueByDate(analyticsRes.data.revenue_by_date || [])
      setPaymentBreakdown(analyticsRes.data.payment_method_breakdown || [])
      setBatches(batchRes.data || [])
    }).catch(() => setError(true)).finally(() => setLoading(false))
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])
  const paymentTotal = useMemo(
    () => paymentBreakdown.reduce((sum, p) => sum + (p.total_revenue || 0), 0),
    [paymentBreakdown]
  )

  async function handleFile(file) {
    if (uploading) return
    setUploading(true)
    setUploadResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/transactions/upload', form, { timeout: 180000 })
      setUploadResult(res.data)
      toast.success(res.data.message)
      fetchData()
    } catch (err) {
      const detail = formatApiError(err, 'Gagal mengupload file')
      toast.error(detail)
      setUploadResult({ error: detail })
    } finally {
      setUploading(false)
    }
  }

  async function downloadTemplate() {
    const res = await api.get('/transactions/template')
    const blob = new Blob([res.data.template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = res.data.filename; a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteBatch(batchId) {
    if (!confirm('Hapus semua data dari batch ini?')) return
    await api.delete(`/transactions/batch/${batchId}`)
    toast.success('Batch dihapus')
    fetchData()
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-brand-200 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-brand-700 mb-1">{label}</p>
        <p className="text-brand-800">{formatIDR(payload[0].value)}</p>
      </div>
    )
  }

  return (
    <AppLayout title={t('nav.upload_transaction')}>
      <div className="space-y-5 animate-fade-in">
        {/* Upload */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-brand-800">{t('transactions.upload_title')}</h3>
              <p className="text-xs text-brand-400 mt-0.5">Mendukung export Moka POS atau template CafeMargin</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/template-guide" className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-brand-500 hover:text-brand-700">
                <BookOpen size={13} />
                Panduan Kolom
              </Link>
              <button onClick={downloadTemplate} className="btn-secondary text-xs py-1.5 px-3">
                <Download size={13} />
                {t('transactions.download_template')}
              </button>
            </div>
          </div>
          <UploadZone onFile={handleFile} loading={uploading} />

          {/* Upload result */}
          {uploadResult && !uploadResult.error && (
            <div className="mt-3 rounded-xl border overflow-hidden">
              <div className="flex items-start gap-3 p-4 bg-green-50 border-b border-green-100">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">{uploadResult.message}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Format terdeteksi: <strong>{uploadResult.format_detected}</strong> · Batch: {uploadResult.batch_id}
                  </p>
                </div>
              </div>
              {uploadResult.info && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border-b border-blue-100">
                  <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">{uploadResult.info}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Batch History */}
        {batches.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-brand-800 mb-3 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-brand-500" />
              Riwayat Upload ({batches.length})
            </h3>
            <div className="space-y-2">
              {batches.map((b) => (
                <div key={b.batch_id} className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-lg">{b.batch_id}</span>
                      <span className="text-xs bg-white border border-brand-200 text-brand-600 px-2 py-0.5 rounded-full">
                        {b.source_format === 'moka' ? '📋 Moka POS' : '📄 Simple'}
                      </span>
                    </div>
                    <p className="text-xs text-brand-500 mt-1">{b.date_range} · {b.count.toLocaleString('id-ID')} records</p>
                  </div>
                  <button onClick={() => deleteBatch(b.batch_id)} className="btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Period tabs */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-wide">Periode:</span>
          <div className="period-tabs">
            {PERIOD_OPTIONS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={p === period ? 'period-tab-active' : 'period-tab-inactive'}>
                {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label={t('transactions.summary_total')} value={summary.total_transactions?.toLocaleString('id-ID')} subvalue={`${summary.unique_items} item unik`} icon={Hash} color="brand" />
                <MetricCard label={t('transactions.summary_revenue')} value={formatIDR(summary.total_revenue)} subvalue={`${summary.date_range_start} — ${summary.date_range_end}`} icon={TrendingUp} color="green" />
                <MetricCard label={t('transactions.summary_avg')} value={formatIDR(summary.avg_transaction_value)} subvalue={`Total qty: ${summary.total_qty?.toLocaleString('id-ID')}`} icon={CreditCard} color="amber" />
              </div>
            )}

            {/* Revenue Chart + Payment Breakdown */}
            {revenueByDate.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2">
                  <h3 className="font-semibold text-brand-800 mb-4 text-sm">Revenue per Hari</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueByDate} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b5e3c' }}
                        tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5c3d2e" />
                          <stop offset="100%" stopColor="#c8a882" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Payment method */}
                {paymentBreakdown.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-brand-800 mb-4 text-sm">Metode Pembayaran</h3>
                    <div className="space-y-2.5">
                      {paymentBreakdown.slice(0, 6).map((pm) => {
                        const pct = paymentTotal > 0 ? pm.total_revenue / paymentTotal * 100 : 0
                        return (
                          <div key={pm.payment_method}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-brand-700 truncate max-w-[120px]" title={pm.payment_method}>
                                {pm.payment_method || 'Lainnya'}
                              </span>
                              <span className="text-brand-500 flex-shrink-0">{pct.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-brand-100 rounded-full">
                              <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-brand-800 text-sm">
                  Data Transaksi <span className="text-brand-400 font-normal">({transactions.length})</span>
                </h3>
                {transactions.some(t => t.hpp === 0) && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <Info size={12} />
                    Beberapa item HPP = 0. Tambahkan di Settings → Menu.
                  </div>
                )}
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <FileSpreadsheet size={36} className="text-brand-200 mx-auto mb-3" />
                  <p className="text-brand-400 text-sm">{t('transactions.no_transactions')}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        {['Tanggal', 'Jam', 'Item', 'Kategori', 'Qty', 'Harga', 'HPP', 'Revenue', 'Pembayaran'].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 100).map((tx) => (
                        <tr key={tx.id}>
                          <td className="text-brand-500">{tx.date}</td>
                          <td>{String(tx.hour).padStart(2, '0')}:00</td>
                          <td className="font-medium text-brand-800 max-w-[180px] truncate">{tx.item_name}</td>
                          <td>
                            <span className="text-xs bg-brand-50 border border-brand-100 text-brand-600 px-2 py-0.5 rounded-full">
                              {tx.category}
                            </span>
                          </td>
                          <td className="text-center">{tx.quantity}</td>
                          <td>{formatIDR(tx.unit_price)}</td>
                          <td className={tx.hpp === 0 ? 'text-amber-500' : 'text-brand-500'}>{formatIDR(tx.hpp)}</td>
                          <td className="font-semibold text-green-700">{formatIDR(tx.total_revenue)}</td>
                          <td className="text-brand-500 text-xs max-w-[100px] truncate">{tx.payment_method || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length > 100 && (
                    <p className="text-xs text-brand-400 text-center py-3">Menampilkan 100 dari {transactions.length.toLocaleString('id-ID')} records</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
