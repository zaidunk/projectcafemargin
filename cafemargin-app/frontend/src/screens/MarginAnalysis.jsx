import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AppLayout from '../components/Layout/AppLayout'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`
const fmt = (v) => Number(v).toLocaleString('id-ID')
const PERIOD_OPTIONS = [7, 30, 90, 365, 9999]

const LEAKAGE_COLOR = { 'Margin negatif': 'red', 'Margin sangat rendah': 'amber', 'Margin di bawah target': 'yellow' }

export default function MarginAnalysis() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(9999)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.get(`/analytics/margin?period_days=${period}`)
      .then((r) => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [period])

  const snapshot = data?.margin_snapshot || {}
  const leakages = data?.top_leakages || []
  const byItem = data?.margin_by_item || []

  const waterfallData = useMemo(() => ([
    { name: 'Total Revenue', value: snapshot.total_revenue || 0, fill: '#5c3d2e' },
    { name: 'HPP / COGS', value: -(snapshot.total_hpp_cost || 0), fill: '#ef4444' },
    { name: 'Gross Profit', value: snapshot.gross_profit || 0, fill: '#16a34a' },
  ]), [snapshot.total_revenue, snapshot.total_hpp_cost, snapshot.gross_profit])

  return (
    <AppLayout title={t('nav.margin')}>
      <div className="space-y-5">
        {/* Period */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-600">Periode:</span>
          {PERIOD_OPTIONS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
        </div>

        <TipsCard
          titleKey="tips.title"
          color="amber"
          tips={(t('tips.margin', { returnObjects: true }) || []).map((text, i) => ({ icon: ['💰','⚠️','🔍','💡','📝'][i] || '💡', text }))}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Margin Snapshot */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">{t('margin.snapshot_title')}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {[
                  { label: t('margin.total_revenue'), value: formatIDR(snapshot.total_revenue || 0), color: 'text-brand-800' },
                  { label: t('margin.total_hpp'), value: formatIDR(snapshot.total_hpp_cost || 0), color: 'text-red-600' },
                  { label: t('margin.gross_profit'), value: formatIDR(snapshot.gross_profit || 0), color: 'text-green-700' },
                  { label: t('margin.margin_pct'), value: `${(snapshot.margin_pct || 0).toFixed(1)}%`, color: snapshot.margin_pct >= 40 ? 'text-green-700' : snapshot.margin_pct >= 25 ? 'text-amber-600' : 'text-red-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-brand-50 rounded-xl p-4 border border-brand-200">
                    <p className="text-xs text-brand-500 font-medium">{label}</p>
                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Waterfall */}
              <h4 className="text-sm font-semibold text-brand-700 mb-2">{t('margin.waterfall_title')}</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={waterfallData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b5e3c' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip formatter={(v) => [formatIDR(Math.abs(v)), '']}
                    contentStyle={{ background: '#fff', border: '1px solid #c8a882', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {waterfallData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Leakages */}
            {leakages.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">{t('margin.leakages_title')}</h3>
                <div className="space-y-3">
                  {leakages.map((l, i) => (
                    <div key={l.item_name} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-brand-800">{l.item_name}</span>
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                            l.leakage_type === 'Margin negatif' ? 'bg-red-100 text-red-700' :
                            l.leakage_type === 'Margin sangat rendah' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          )}>
                            {l.leakage_type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-brand-600">
                          <span>Margin: <strong className="text-red-600">{l.margin_pct?.toFixed(1)}%</strong></span>
                          <span>Harga: <strong>{formatIDR(l.avg_unit_price)}</strong></span>
                          <span>HPP: <strong>{formatIDR(l.avg_hpp)}</strong></span>
                          <span>Saran: <strong className="text-green-700">{formatIDR(l.suggested_price)}</strong></span>
                        </div>
                      </div>
                      <div className="text-right text-xs flex-shrink-0">
                        <p className="text-brand-500">Revenue</p>
                        <p className="font-semibold text-brand-800">{formatIDR(l.total_revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Margin by Item Table */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">{t('margin.by_item_title')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200">
                      {['Item', 'Harga Jual', 'HPP', 'Margin Rp', 'Margin %', 'Revenue Total', 'Qty'].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 text-brand-500 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byItem.map((item) => (
                      <tr key={item.item_name} className="border-b border-brand-100 hover:bg-brand-50">
                        <td className="py-2 pr-4 font-medium text-brand-800">{item.item_name}</td>
                        <td className="py-2 pr-4">{formatIDR(item.avg_unit_price)}</td>
                        <td className="py-2 pr-4 text-brand-500">{formatIDR(item.avg_hpp)}</td>
                        <td className="py-2 pr-4">{formatIDR(item.avg_unit_price - item.avg_hpp)}</td>
                        <td className="py-2 pr-4">
                          <span className={clsx('font-semibold',
                            item.margin_pct < 20 ? 'text-red-600' :
                            item.margin_pct < 40 ? 'text-amber-600' : 'text-green-700'
                          )}>
                            {item.margin_pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-green-700 font-semibold">{formatIDR(item.total_revenue)}</td>
                        <td className="py-2 pr-4 text-brand-600">{fmt(item.total_qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
