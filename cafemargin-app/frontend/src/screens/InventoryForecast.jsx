import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Package, Zap, AlertCircle, TrendingUp } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

export default function InventoryForecast() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState(9999)
  const [forecastDays, setForecastDays] = useState(7)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.get(`/advanced/inventory?period_days=${period}&forecast_days=${forecastDays}`)
      .then(r => setData(r.data)).catch(() => setError(true)).finally(() => setLoading(false))
  }, [period, forecastDays])

  const s = data?.summary || {}
  const items = data?.items || []
  const VEL_STYLE = {
    fast: { bg: 'bg-green-100 text-green-700', label: 'Fast Mover' },
    medium: { bg: 'bg-amber-100 text-amber-700', label: 'Medium' },
    slow: { bg: 'bg-red-100 text-red-700', label: 'Slow Mover' },
  }

  return (
    <AppLayout title="Inventory Forecast">
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-brand-600">Data:</span>
          {[7, 30, 90, 365, 9999].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
          <span className="text-sm text-brand-600 ml-4">Forecast:</span>
          {[7, 14, 30].map(f => (
            <button key={f} onClick={() => setForecastDays(f)}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${forecastDays === f ? 'bg-green-600 text-white' : 'bg-white border border-green-200 text-green-600'}`}>
              {f} Hari
            </button>
          ))}
        </div>

        <TipsCard
          titleKey="tips.title"
          color="green"
          tips={(t('tips.inventory', { returnObjects: true }) || []).map((text, i) => ({ icon: ['📦','🛡️','📊'][i] || '💡', text }))}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <MetricCard label="Total Item" value={s.total_items || 0} icon={Package} color="brand" />
              <MetricCard label="Fast Movers" value={s.fast_movers || 0} icon={Zap} color="green" />
              <MetricCard label="Slow Movers" value={s.slow_movers || 0} icon={AlertCircle} color="red" />
              <MetricCard label="Data Range" value={`${s.data_days || 0} hari`} icon={TrendingUp} color="amber" />
            </div>

            {items.length > 0 && (
              <>
                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-4">Top 15 — Forecast Kebutuhan Stok</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={items.slice(0, 15)} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="item_name" type="category" tick={{ fontSize: 9 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="forecast_qty" fill="#5c3d2e" radius={[0, 4, 4, 0]} name={`Forecast ${forecastDays} hari`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-brand-800 mb-3">Detail Inventory Forecast</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Item</th><th>Total Terjual</th><th>Avg/Hari</th><th>Forecast {forecastDays}d</th><th>Velocity</th><th>Konsistensi</th></tr></thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.item_name}>
                            <td className="font-medium text-brand-800 text-xs max-w-[180px] truncate">{item.item_name}</td>
                            <td>{item.total_qty.toLocaleString()}</td>
                            <td>{item.daily_avg}</td>
                            <td className="font-bold text-green-700">{item.forecast_qty.toLocaleString()}</td>
                            <td>
                              <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', VEL_STYLE[item.velocity]?.bg)}>
                                {VEL_STYLE[item.velocity]?.label}
                              </span>
                            </td>
                            <td>{item.days_active} hari</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
