import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AppLayout from '../components/Layout/AppLayout'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function PeakHourAnalysis() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(9999)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/peak-hours?period_days=${period}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const revenueByHour = data?.revenue_by_hour || []
  const goldenHours = data?.golden_hours || []
  const deadHours = data?.dead_hours || []
  const revenueByDow = data?.revenue_by_day_of_week || []

  const getBarColor = (hour) => {
    if (goldenHours.includes(hour)) return '#5c3d2e'
    if (deadHours.includes(hour)) return '#e8d5bc'
    return '#c8a882'
  }

  return (
    <AppLayout title={t('nav.peak_hours')}>
      <div className="space-y-5">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-600">Periode:</span>
          {[7, 30, 90, 365, 9999].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
        </div>

        <TipsCard
          titleKey="tips.title"
          color="amber"
          tips={(t('tips.peak_hours', { returnObjects: true }) || []).map((text, i) => ({ icon: ['⚡','😴','📈','🎯','📋'][i] || '💡', text }))}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Golden & Dead Hours Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card border-2 border-brand-600">
                <h3 className="font-semibold text-brand-800 mb-2">
                  ⚡ {t('peak_hours.golden_hours')}
                </h3>
                {goldenHours.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {goldenHours.map((h) => (
                        <span key={h} className="bg-brand-700 text-brand-50 text-sm font-bold px-3 py-1.5 rounded-lg">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-brand-600 bg-brand-50 p-2 rounded-lg">
                      💡 {t('peak_hours.golden_desc')}
                    </p>
                  </>
                ) : (
                  <p className="text-brand-400 text-sm">Belum ada data yang cukup</p>
                )}
              </div>

              <div className="card border-2 border-brand-200">
                <h3 className="font-semibold text-brand-700 mb-2">
                  😴 {t('peak_hours.dead_hours')}
                </h3>
                {deadHours.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {deadHours.map((h) => (
                        <span key={h} className="bg-brand-100 text-brand-600 text-sm font-medium px-3 py-1.5 rounded-lg border border-brand-200">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-brand-600 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                      💡 {t('peak_hours.dead_desc')}
                    </p>
                  </>
                ) : (
                  <p className="text-brand-400 text-sm">Tidak ada jam sepi terdeteksi</p>
                )}
              </div>
            </div>

            {/* Revenue by Hour Chart */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-1">{t('peak_hours.avg_revenue_title')}</h3>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-700 inline-block" /> Golden Hours</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-400 inline-block" /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-200 inline-block" /> Dead Hours</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByHour} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8b5e3c' }}
                    tickFormatter={(v) => `${String(v).padStart(2, '0')}`} />
                  <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v) => [formatIDR(v), 'Revenue']}
                    labelFormatter={(l) => `Jam ${String(l).padStart(2, '0')}:00`}
                    contentStyle={{ background: '#fff', border: '1px solid #c8a882', borderRadius: 8 }} />
                  <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                    {revenueByHour.map((entry) => (
                      <Cell key={entry.hour} fill={getBarColor(entry.hour)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Day of Week */}
            {revenueByDow.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Revenue per Hari dalam Seminggu</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByDow} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8b5e3c' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => [formatIDR(v), 'Revenue']}
                      contentStyle={{ background: '#fff', border: '1px solid #c8a882', borderRadius: 8 }} />
                    <Bar dataKey="revenue" fill="#c8a882" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Heatmap grid: hour × label */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">{t('peak_hours.heatmap_title')}</h3>
              <div className="grid grid-cols-12 gap-1">
                {revenueByHour.filter(h => h.revenue > 0).map((h) => {
                  const maxRev = Math.max(...revenueByHour.map(x => x.revenue))
                  const intensity = maxRev > 0 ? h.revenue / maxRev : 0
                  return (
                    <div
                      key={h.hour}
                      title={`${String(h.hour).padStart(2, '0')}:00 — ${formatIDR(h.revenue)}`}
                      className="aspect-square rounded flex flex-col items-center justify-center text-[var(--text-xxs)] font-bold cursor-help"
                      style={{
                        background: `rgba(92, 61, 46, ${0.1 + intensity * 0.9})`,
                        color: intensity > 0.5 ? '#f5efe6' : '#5c3d2e',
                      }}
                    >
                      {String(h.hour).padStart(2, '0')}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-brand-400 mt-2">Warna lebih gelap = revenue lebih tinggi</p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
