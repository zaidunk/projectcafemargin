import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, ShoppingCart, DollarSign } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`
const COLORS = ['#5c3d2e', '#c8a882', '#8b5e3c', '#d4a574']

const SEG_STYLES = {
  VIP: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  Regular: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  'Quick Buyer': { bg: 'bg-green-50 border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
  Casual: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-600' },
}

export default function CustomerInsights() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.get(`/advanced/customers?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => setError(true)).finally(() => setLoading(false))
  }, [period])

  const stats = data?.stats || {}
  const segments = data?.segments || []
  const hourly = data?.hourly_pattern || []

  return (
    <AppLayout title="Customer Insights">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          {[7, 30, 90, 365, 9999].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
        </div>

        <TipsCard
          titleKey="tips.title"
          color="blue"
          tips={(t('tips.customers', { returnObjects: true }) || []).map((text, i) => ({ icon: ['🧾','🛒','💰'][i] || '💡', text }))}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Total Transaksi" value={(stats.total_receipts || 0).toLocaleString()} icon={Users} color="brand" />
              <MetricCard label="Avg Basket Value" value={formatIDR(stats.avg_basket_value || 0)} icon={DollarSign} color="green" />
              <MetricCard label="Avg Items/Basket" value={(stats.avg_items_per_basket || 0).toFixed(1)} icon={ShoppingCart} color="amber" />
            </div>

            {segments.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-4">Segmentasi Pelanggan</h3>
                  <div className="space-y-3">
                    {segments.map(seg => {
                      const style = SEG_STYLES[seg.segment] || SEG_STYLES.Casual
                      return (
                        <div key={seg.segment} className={clsx('p-4 rounded-xl border-2', style.bg)}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={clsx('text-sm font-bold px-3 py-1 rounded-full', style.badge)}>{seg.segment}</span>
                            <span className="text-lg font-bold text-brand-800">{seg.count.toLocaleString()}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><p className="text-brand-400">Persentase</p><p className="font-semibold">{seg.pct.toFixed(1)}%</p></div>
                            <div><p className="text-brand-400">Avg Revenue</p><p className="font-semibold">{formatIDR(seg.avg_revenue)}</p></div>
                            <div><p className="text-brand-400">Avg Items</p><p className="font-semibold">{seg.avg_items.toFixed(1)}</p></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-4">Distribusi Segmen</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={segments} dataKey="count" nameKey="segment" cx="50%" cy="50%"
                        outerRadius={90} label={({ segment, pct }) => `${segment} (${pct.toFixed(0)}%)`}>
                        {segments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {hourly.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Pola Transaksi per Jam</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={v => `${v}:00`} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#5c3d2e" radius={[4, 4, 0, 0]} name="Jumlah Transaksi" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
