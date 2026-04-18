import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Percent, Tag, TrendingDown } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function DiscountAnalysis() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/discounts?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const s = data?.summary || {}

  return (
    <AppLayout title="Discount Analysis">
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
          color="amber"
          tips={(t('tips.discounts', { returnObjects: true }) || []).map((text, i) => ({ icon: ['📊','⚖️','⚠️','🎯'][i] || '💡', text }))}
        />
            </button>
          ))}
        </div>

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <MetricCard label="Total Diskon" value={formatIDR(s.total_discount || 0)} icon={Tag} color="red" />
              <MetricCard label="Diskon %" value={`${(s.discount_pct || 0).toFixed(1)}%`} subvalue="dari gross sales" icon={Percent} color="amber" />
              <MetricCard label="Avg dengan Diskon" value={formatIDR(s.avg_revenue_with_discount || 0)} icon={TrendingDown} color="brand" />
              <MetricCard label="Avg tanpa Diskon" value={formatIDR(s.avg_revenue_without_discount || 0)} icon={TrendingDown} color="green" />
            </div>

            {(data?.by_date || []).length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Trend Diskon per Hari</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.by_date}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={v => v?.slice(5)} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => formatIDR(v)} />
                    <Line dataKey="discount" stroke="#ef4444" strokeWidth={2} dot={false} name="Diskon" />
                    <Line dataKey="revenue" stroke="#5c3d2e" strokeWidth={2} dot={false} name="Net Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {(data?.by_hour || []).length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Diskon per Jam</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.by_hour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={v => `${v}:00`} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => formatIDR(v)} />
                    <Bar dataKey="discount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-2">Insight</h3>
              <p className="text-sm text-amber-700">
                {s.discount_pct > 20
                  ? `Diskon terlalu tinggi (${(s.discount_pct).toFixed(1)}%). Pertimbangkan kurangi diskon untuk meningkatkan margin.`
                  : s.discount_pct > 10
                  ? `Diskon moderat (${(s.discount_pct).toFixed(1)}%). Pantau apakah diskon efektif mendatangkan volume.`
                  : `Diskon terkontrol (${(s.discount_pct || 0).toFixed(1)}%). Strategi pricing cukup baik.`
                }
              </p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
