import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Award, TrendingUp } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function StaffPerformance() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.get(`/advanced/staff?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => setError(true)).finally(() => setLoading(false))
  }, [period])

  const s = data?.summary || {}
  const ranking = data?.staff_ranking || []

  return (
    <AppLayout title="Staff Performance">
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
          tips={(t('tips.staff', { returnObjects: true }) || []).map((text, i) => ({ icon: ['👤','🏆','🎯'][i] || '💡', text }))}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Total Staff" value={s.total_staff || 0} icon={Users} color="brand" />
              <MetricCard label="Top Performer" value={s.top_performer || '-'} icon={Award} color="green" />
              <MetricCard label="Avg Revenue/Staff" value={formatIDR(s.avg_revenue_per_staff || 0)} icon={TrendingUp} color="amber" />
            </div>

            {ranking.length > 0 && (
              <>
                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-4">Revenue per Staff</h3>
                  <ResponsiveContainer width="100%" height={Math.max(200, ranking.length * 40)}>
                    <BarChart data={ranking} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                      <YAxis dataKey="staff" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={v => formatIDR(v)} />
                      <Bar dataKey="total_revenue" fill="#5c3d2e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-3">Detail Staff</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>#</th><th>Staff</th><th>Revenue</th><th>Transaksi</th><th>Qty</th><th>Avg/Tx</th></tr></thead>
                      <tbody>
                        {ranking.map((r, i) => (
                          <tr key={r.staff}>
                            <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                            <td className="font-medium text-brand-800">{r.staff}</td>
                            <td className="font-semibold text-green-700">{formatIDR(r.total_revenue)}</td>
                            <td>{r.total_transactions.toLocaleString()}</td>
                            <td>{r.total_qty.toLocaleString()}</td>
                            <td>{formatIDR(r.avg_transaction)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {ranking.length === 0 && (
              <div className="card text-center py-12">
                <Users size={36} className="text-brand-200 mx-auto mb-3" />
                <p className="text-brand-400">Data staff belum tersedia dari file yang diupload</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
