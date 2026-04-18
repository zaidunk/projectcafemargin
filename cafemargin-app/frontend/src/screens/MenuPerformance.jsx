import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Label } from 'recharts'
import AppLayout from '../components/Layout/AppLayout'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

const QUADRANT_STYLES = {
  stars: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800', icon: '⭐' },
  cash_cows: { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800', icon: '🐄' },
  question_marks: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', icon: '❓' },
  dogs: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', icon: '🐕' },
}

export default function MenuPerformance() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(9999)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeQuadrant, setActiveQuadrant] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/menu-matrix?period_days=${period}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const matrix = data?.menu_matrix || []
  const topRevenue = data?.top_items_by_revenue || []
  const topQty = data?.top_items_by_qty || []
  const categories = data?.category_breakdown || []

  const quadrantGroups = {
    stars: matrix.filter(i => i.quadrant === 'stars'),
    cash_cows: matrix.filter(i => i.quadrant === 'cash_cows'),
    question_marks: matrix.filter(i => i.quadrant === 'question_marks'),
    dogs: matrix.filter(i => i.quadrant === 'dogs'),
  }

  const filteredMatrix = activeQuadrant ? matrix.filter(i => i.quadrant === activeQuadrant) : matrix

  return (
    <AppLayout title={t('nav.menu_performance')}>
      <div className="space-y-5">
        <TipsCard
          titleKey="tips.title"
          color="amber"
          tips={(t('tips.menu_performance', { returnObjects: true }) || []).map((text, i) => ({ icon: ['⭐','🐄','❓','🐕'][i] || '💡', text }))}
        />

        {/* Period */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-600">Periode:</span>
          {[7, 30, 90, 365, 9999].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* BCG Quadrant Summary */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">{t('menu.matrix_title')}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(quadrantGroups).map(([key, items]) => {
                  const s = QUADRANT_STYLES[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveQuadrant(activeQuadrant === key ? null : key)}
                      className={clsx('p-3 rounded-xl border-2 text-left transition-all', s.bg,
                        activeQuadrant === key ? 'ring-2 ring-brand-500' : '')}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{s.icon}</span>
                        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', s.badge)}>
                          {t(`menu.${key}`)}
                        </span>
                        <span className="ml-auto text-lg font-bold text-brand-700">{items.length}</span>
                      </div>
                      <p className="text-xs text-brand-500">{t(`menu.${key}_desc`)}</p>
                    </button>
                  )
                })}
              </div>

              {/* Item List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredMatrix.map((item) => {
                  const s = QUADRANT_STYLES[item.quadrant]
                  return (
                    <div key={item.item_name} className={clsx('flex items-center gap-3 p-2.5 rounded-lg border', s.bg)}>
                      <span className="text-base">{QUADRANT_STYLES[item.quadrant].icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-800 text-sm truncate">{item.item_name}</p>
                        <p className="text-xs text-brand-500">{item.action}</p>
                      </div>
                      <div className="text-right text-xs flex-shrink-0">
                        <p className="font-semibold text-brand-800">{formatIDR(item.total_revenue)}</p>
                        <p className={clsx('font-bold', item.margin_pct < 20 ? 'text-red-600' : item.margin_pct < 40 ? 'text-amber-600' : 'text-green-700')}>
                          {item.margin_pct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {activeQuadrant && (
                <button onClick={() => setActiveQuadrant(null)} className="text-xs text-brand-500 hover:text-brand-700 mt-2">
                  ← Tampilkan semua
                </button>
              )}
            </div>

            {/* Top Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">{t('menu.top_revenue')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topRevenue} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#8b5e3c' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="item_name" tick={{ fontSize: 10, fill: '#5c3d2e' }} width={60} />
                    <Tooltip formatter={(v) => [formatIDR(v), 'Revenue']}
                      contentStyle={{ background: '#fff', border: '1px solid #c8a882', borderRadius: 8 }} />
                    <Bar dataKey="total_revenue" fill="#5c3d2e" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">{t('menu.top_qty')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topQty} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#8b5e3c' }} />
                    <YAxis type="category" dataKey="item_name" tick={{ fontSize: 10, fill: '#5c3d2e' }} width={60} />
                    <Tooltip formatter={(v) => [v, 'Qty']}
                      contentStyle={{ background: '#fff', border: '1px solid #c8a882', borderRadius: 8 }} />
                    <Bar dataKey="total_qty" fill="#c8a882" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            {categories.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Revenue per Kategori</h3>
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const total = categories.reduce((s, c) => s + c.total_revenue, 0)
                    const pct = total > 0 ? cat.total_revenue / total * 100 : 0
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-brand-700">{cat.category}</span>
                          <span className="text-brand-600">{formatIDR(cat.total_revenue)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-brand-100 rounded-full">
                          <div className="h-2 bg-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
