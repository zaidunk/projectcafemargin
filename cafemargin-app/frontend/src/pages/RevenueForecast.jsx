import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import api from '../api/client'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function RevenueForecast() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)
  const [forecastDays, setForecastDays] = useState(7)

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/forecast?period_days=${period}&forecast_days=${forecastDays}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period, forecastDays])

  const chartData = [
    ...(data?.daily_actual || []).map(d => ({ ...d, type: 'actual' })),
    ...(data?.daily_forecast || []).map(d => ({ ...d, type: 'forecast' })),
  ]
  const s = data?.summary || {}

  return (
    <AppLayout title="Revenue Forecast">
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-brand-600">Data:</span>
          {[30, 90, 365, 9999].map(p => (
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

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Trend" value={s.trend_direction === 'naik' ? 'Naik' : 'Turun'}
                subvalue={`${formatIDR(Math.abs(s.daily_growth || 0))}/hari`}
                icon={s.trend_direction === 'naik' ? TrendingUp : TrendingDown}
                color={s.trend_direction === 'naik' ? 'green' : 'red'} />
              <MetricCard label={`Forecast ${forecastDays} Hari`} value={formatIDR(s.forecast_total || 0)}
                subvalue={`R² = ${(s.r_squared || 0).toFixed(2)}`} icon={Target} color="brand" />
              <MetricCard label="Confidence" value={`± ${formatIDR(s.confidence_std || 0)}`}
                subvalue="95% confidence interval" icon={TrendingUp} color="amber" />
            </div>

            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">Revenue Trend & Forecast</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={v => v?.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip formatter={v => formatIDR(v)} />
                  <Area dataKey="revenue" stroke="#5c3d2e" fill="url(#actualGrad)" strokeWidth={2} />
                  <Area dataKey="trend" stroke="#c8a882" fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
                  <Area dataKey="upper" stroke="none" fill="url(#confGrad)" />
                  <Area dataKey="lower" stroke="none" fill="none" />
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5c3d2e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5c3d2e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {(data?.daily_forecast || []).length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Detail Forecast</h3>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Tanggal</th><th>Prediksi Revenue</th><th>Range Bawah</th><th>Range Atas</th></tr></thead>
                    <tbody>
                      {data.daily_forecast.map(d => (
                        <tr key={d.date}>
                          <td className="font-medium">{d.date}</td>
                          <td className="text-green-700 font-semibold">{formatIDR(d.revenue)}</td>
                          <td className="text-brand-500">{formatIDR(d.lower)}</td>
                          <td className="text-brand-500">{formatIDR(d.upper)}</td>
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
