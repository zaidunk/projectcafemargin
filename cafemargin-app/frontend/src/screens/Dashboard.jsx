import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Cell } from 'recharts'
import { TrendingUp, Percent, Clock, AlertTriangle, ArrowRight, Upload } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`
const PERIOD_OPTIONS = [7, 30, 90, 365, 9999]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-brand-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-brand-600 mb-1">{label}</p>
      <p className="text-brand-900 font-bold">{formatIDR(payload[0]?.value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [period, setPeriod] = useState(9999)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/overview?period_days=${period}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [period])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 640px)')
    const handleChange = (event) => setIsMobile(event.matches)
    setIsMobile(media.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const summary = data?.summary || {}
  const revenueByDate = data?.revenue_by_date || []
  const revenueByHour = useMemo(
    () => (data?.revenue_by_hour || []).filter(h => h.revenue > 0),
    [data?.revenue_by_hour]
  )
  const leakages = data?.top_leakages || []
  const goldenHours = data?.golden_hours || []
  const snapshot = data?.margin_snapshot || {}
  const axisFont = isMobile ? 10 : 12
  const axisFontSmall = isMobile ? 9 : 11
  const peakHour = useMemo(() => (
    (data?.revenue_by_hour || []).reduce(
      (best, h) => (h.revenue > (best?.revenue || 0) ? h : best),
      null
    )
  ), [data?.revenue_by_hour])

  const hasData = summary.total_revenue > 0

  return (
    <AppLayout title={t('nav.dashboard')}>
      <div className="space-y-5 animate-fade-in">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-900">
              {t('dashboard.welcome')}, <span className="text-brand-600">{user?.full_name?.split(' ')[0]}</span> 👋
            </h2>
            <p className="text-brand-400 text-sm mt-0.5">{user?.cafe_name}</p>
          </div>
          <div className="period-tabs">
            {PERIOD_OPTIONS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={p === period ? 'period-tab-active' : 'period-tab-inactive'}>
                {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : t(`dashboard.period_${p}d`)}
              </button>
            ))}
          </div>
        </div>

        <TipsCard
          titleKey="tips.title"
          color="amber"
          defaultOpen={false}
          tips={(t('tips.dashboard', { returnObjects: true }) || []).map((text, i) => ({ icon: ['📊','💰','⏰','🔍'][i] || '💡', text }))}
        />

        {/* Leakage Alert */}
        {hasData && leakages.length > 0 && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3.5 animate-slide-up">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-amber-600 icon-sm" />
            </div>
            <p className="text-amber-800 text-sm flex-1">
              <strong>{leakages.length} {t('dashboard.leakage_alert')}</strong>
              {': '}
              {leakages.slice(0, 2).map(l => l.item_name).join(', ')}
              {leakages.length > 2 && ` +${leakages.length - 2} lainnya`}
            </p>
            <Link
              href="/margin"
              className="btn-ghost text-amber-700 hover:text-amber-900 hover:bg-amber-100 text-xs px-3 py-1.5 flex-shrink-0 inline-flex items-center gap-1"
            >
              {t('dashboard.view_details')} <ArrowRight className="icon-sm" />
            </Link>
          </div>
        )}
        {/* Loading skeletons */}
        {loading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="skeleton h-64 rounded-2xl lg:col-span-2" />
              <div className="skeleton h-64 rounded-2xl" />
            </div>
          </>
        ) : !hasData ? (
          /* Empty state */
          <div className="card flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="text-brand-400 icon-lg" />
            </div>
            <h3 className="font-semibold text-brand-700 text-lg mb-2">Belum Ada Data</h3>
            <p className="text-brand-400 text-sm max-w-xs mb-6">{t('dashboard.no_data')}</p>
            <Link href="/transactions" className="btn-primary">
              Upload Data Transaksi <ArrowRight className="icon-sm" />
            </Link>
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label={t('dashboard.total_revenue')}
                value={formatIDR(summary.total_revenue)}
                subvalue={`${summary.total_transactions?.toLocaleString('id-ID')} transaksi`}
                icon={TrendingUp}
                color="brand"
              />
              <MetricCard
                label={t('dashboard.avg_margin')}
                value={`${(snapshot.margin_pct || 0).toFixed(1)}%`}
                subvalue={`Gross profit: ${formatIDR(snapshot.gross_profit || 0)}`}
                icon={Percent}
                color={snapshot.margin_pct >= 40 ? 'green' : snapshot.margin_pct >= 25 ? 'amber' : 'red'}
              />
              <MetricCard
                label={t('dashboard.peak_hour')}
                value={peakHour ? `${String(peakHour.hour).padStart(2, '0')}:00` : '-'}
                subvalue={peakHour ? formatIDR(peakHour.revenue) : ''}
                icon={Clock}
                color="blue"
              />
              <MetricCard
                label={t('dashboard.leakages_found')}
                value={String(leakages.length)}
                subvalue={leakages.length > 0 ? leakages[0]?.item_name : 'Margin sehat ✓'}
                icon={AlertTriangle}
                color={leakages.length > 2 ? 'red' : leakages.length > 0 ? 'amber' : 'green'}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Revenue Trend */}
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-brand-800 text-sm">{t('dashboard.revenue_trend')}</h3>
                  {goldenHours.length > 0 && (
                    <span className="text-xs text-brand-500">
                      ⚡ Peak: {goldenHours.slice(0, 3).map(h => `${String(h).padStart(2, '0')}:00`).join(', ')}
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueByDate} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5c3d2e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5c3d2e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e4d6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: axisFont, fill: '#b8895a' }}
                      tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: axisFont, fill: '#b8895a' }}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#5c3d2e" strokeWidth={2.5}
                      fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: '#5c3d2e', stroke: 'white', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Revenue */}
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-5 text-sm">{t('dashboard.hourly_revenue')}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByHour} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e4d6" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: axisFontSmall, fill: '#b8895a' }}
                      tickFormatter={(v) => `${String(v).padStart(2, '0')}`} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: axisFontSmall, fill: '#b8895a' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} labelFormatter={(l) => `Jam ${String(l).padStart(2, '0')}:00`} />
                    <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                      {revenueByHour.map((entry) => (
                        <Cell key={entry.hour}
                          fill={goldenHours.includes(entry.hour) ? '#5c3d2e' : '#c8a882'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom row: leakage + margin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top leakages mini */}
              {leakages.length > 0 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-brand-800 text-sm">Kebocoran Margin Teratas</h3>
                    <Link href="/margin" className="text-xs text-brand-500 hover:text-brand-800">Lihat semua →</Link>
                  </div>
                  <div className="space-y-2">
                    {leakages.slice(0, 4).map((l, i) => (
                      <div key={l.item_name} className="flex items-center gap-3 p-2.5 bg-brand-50 rounded-xl">
                        <span className="w-5 h-5 rounded-full bg-brand-200 text-brand-700 text-[var(--text-xxs)] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-800 truncate">{l.item_name}</p>
                        </div>
                        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
                          l.margin_pct < 0 ? 'bg-red-100 text-red-700' :
                          l.margin_pct < 20 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700')}>
                          {l.margin_pct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Margin summary */}
              <div className="card">
                <h3 className="font-semibold text-brand-800 text-sm mb-4">Margin Snapshot</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total Revenue', value: formatIDR(snapshot.total_revenue || 0), color: 'text-brand-800' },
                    { label: 'Total HPP', value: `-${formatIDR(snapshot.total_hpp_cost || 0)}`, color: 'text-red-600' },
                    { label: 'Gross Profit', value: formatIDR(snapshot.gross_profit || 0), color: 'text-green-700 font-bold text-lg' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm text-brand-500">{label}</span>
                      <span className={clsx('text-sm', color)}>{value}</span>
                    </div>
                  ))}
                  <div className="h-px bg-brand-100 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-brand-700">Margin %</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-brand-100 rounded-full">
                        <div
                          className={clsx('h-2 rounded-full', snapshot.margin_pct >= 40 ? 'bg-green-500' : snapshot.margin_pct >= 25 ? 'bg-amber-400' : 'bg-red-500')}
                          style={{ width: `${Math.min(snapshot.margin_pct || 0, 100)}%` }}
                        />
                      </div>
                      <span className={clsx('text-sm font-bold',
                        snapshot.margin_pct >= 40 ? 'text-green-700' : snapshot.margin_pct >= 25 ? 'text-amber-600' : 'text-red-600')}>
                        {(snapshot.margin_pct || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
