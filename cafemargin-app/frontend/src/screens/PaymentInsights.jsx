import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CreditCard, Smartphone, Banknote } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`
const COLORS = ['#5c3d2e', '#c8a882', '#8b5e3c', '#d4a574', '#a0522d', '#deb887', '#6b4226', '#e8c8a0']

export default function PaymentInsights() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.get(`/advanced/payments?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => setError(true)).finally(() => setLoading(false))
  }, [period])

  const s = data?.summary || {}
  const breakdown = data?.breakdown || []

  return (
    <AppLayout title="Payment Insights">
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
          color="brand"
          tips={(t('tips.payments', { returnObjects: true }) || []).map((text, i) => ({ icon: ['💳','📱','⚠️'][i] || '💡', text }))}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Total Metode" value={s.total_methods || 0} icon={CreditCard} color="brand" />
              <MetricCard label="Digital Payment" value={`${(s.digital_pct || 0).toFixed(1)}%`} icon={Smartphone} color="green" />
              <MetricCard label="Cash" value={`${(s.cash_pct || 0).toFixed(1)}%`} icon={Banknote} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {breakdown.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-4">Revenue per Metode</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={breakdown} dataKey="revenue" nameKey="method" cx="50%" cy="50%"
                        outerRadius={100} label={({ method, pct }) => `${method} (${pct.toFixed(0)}%)`}>
                        {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatIDR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {breakdown.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-4">Avg Transaction per Metode</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={breakdown} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                      <YAxis dataKey="method" type="category" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip formatter={v => formatIDR(v)} />
                      <Bar dataKey="avg_value" fill="#c8a882" radius={[0, 4, 4, 0]} name="Avg Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {breakdown.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Detail Metode Pembayaran</h3>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Metode</th><th>Revenue</th><th>Transaksi</th><th>Avg Value</th><th>%</th></tr></thead>
                    <tbody>
                      {breakdown.map(b => (
                        <tr key={b.method}>
                          <td className="font-medium text-brand-800">{b.method}</td>
                          <td className="font-semibold text-green-700">{formatIDR(b.revenue)}</td>
                          <td>{b.count.toLocaleString()}</td>
                          <td>{formatIDR(b.avg_value)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-brand-100 rounded-full">
                                <div className="h-1.5 bg-brand-600 rounded-full" style={{ width: `${b.pct}%` }} />
                              </div>
                              <span className="text-xs">{b.pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
