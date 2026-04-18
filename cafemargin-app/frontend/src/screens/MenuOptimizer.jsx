import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts'
import { Lightbulb, TrendingUp, AlertTriangle, Star } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

const CLUSTER_STYLES = {
  champion: { bg: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-700', label: 'Champion' },
  volume_trap: { bg: 'bg-amber-50 border-amber-300', badge: 'bg-amber-100 text-amber-700', label: 'Volume Trap' },
  hidden_gem: { bg: 'bg-blue-50 border-blue-300', badge: 'bg-blue-100 text-blue-700', label: 'Hidden Gem' },
  inconsistent: { bg: 'bg-purple-50 border-purple-300', badge: 'bg-purple-100 text-purple-700', label: 'Inconsistent' },
  underperformer: { bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-700', label: 'Underperformer' },
  stable: { bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-700', label: 'Stable' },
}

export default function MenuOptimizer() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)
  const [activeCluster, setActiveCluster] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/menu-optimizer?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const suggestions = data?.suggestions || []
  const clusters = data?.clusters || []
  const pricing = data?.pricing_analysis || []

  const clusterCounts = {}
  clusters.forEach(c => { clusterCounts[c.cluster] = (clusterCounts[c.cluster] || 0) + 1 })

  const filteredClusters = activeCluster ? clusters.filter(c => c.cluster === activeCluster) : clusters

  return (
    <AppLayout title="Menu Optimizer">
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
          color="green"
          tips={(t('tips.menu_optimizer', { returnObjects: true }) || []).map((text, i) => ({ icon: ['🎯','📊','⚠️'][i] || '💡', text }))}
        />

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            {/* Cluster summary chips */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCluster(null)}
                className={clsx('px-3 py-1.5 text-xs rounded-lg font-semibold border transition-all',
                  !activeCluster ? 'bg-brand-700 text-white border-brand-700' : 'bg-white border-brand-200 text-brand-600')}>
                Semua ({clusters.length})
              </button>
              {Object.entries(CLUSTER_STYLES).map(([key, style]) => {
                const count = clusterCounts[key] || 0
                if (count === 0) return null
                return (
                  <button key={key} onClick={() => setActiveCluster(activeCluster === key ? null : key)}
                    className={clsx('px-3 py-1.5 text-xs rounded-lg font-semibold border-2 transition-all', style.bg,
                      activeCluster === key ? 'ring-2 ring-brand-500' : '')}>
                    {style.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !activeCluster && (
              <div className="card border-2 border-amber-200 bg-amber-50/50">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <Lightbulb size={18} /> Rekomendasi Aksi ({suggestions.length} item)
                </h3>
                <div className="space-y-2">
                  {suggestions.slice(0, 8).map(s => {
                    const style = CLUSTER_STYLES[s.cluster] || CLUSTER_STYLES.stable
                    return (
                      <div key={s.item_name} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', style.badge)}>{style.label}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-brand-800 text-sm truncate">{s.item_name}</p>
                          <p className="text-xs text-brand-500">{s.action}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-brand-500">Margin: {s.margin_pct.toFixed(0)}%</p>
                          <p className="text-xs text-brand-500">Revenue: {formatIDR(s.total_revenue)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Full cluster table */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-3">
                {activeCluster ? CLUSTER_STYLES[activeCluster]?.label : 'Semua'} Items ({filteredClusters.length})
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Item</th><th>Cluster</th><th>Revenue</th><th>Qty/Hari</th><th>Margin</th><th>Konsistensi</th><th>Saran Harga</th></tr></thead>
                  <tbody>
                    {filteredClusters.map(c => {
                      const style = CLUSTER_STYLES[c.cluster] || CLUSTER_STYLES.stable
                      return (
                        <tr key={c.item_name}>
                          <td className="font-medium text-brand-800 text-xs max-w-[150px] truncate">{c.item_name}</td>
                          <td><span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', style.badge)}>{style.label}</span></td>
                          <td className="text-xs">{formatIDR(c.total_revenue)}</td>
                          <td>{c.daily_qty}</td>
                          <td className={clsx('font-semibold', c.margin_pct < 20 ? 'text-red-600' : c.margin_pct < 40 ? 'text-amber-600' : 'text-green-600')}>
                            {c.margin_pct.toFixed(0)}%
                          </td>
                          <td>{c.consistency.toFixed(0)}%</td>
                          <td className="text-xs">
                            {Math.abs(c.suggested_price - c.avg_price) > 1000
                              ? <span className="text-amber-700 font-semibold">{formatIDR(c.suggested_price)}</span>
                              : <span className="text-green-600">OK</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing suggestions */}
            {pricing.length > 0 && !activeCluster && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Saran Penyesuaian Harga</h3>
                <div className="space-y-2">
                  {pricing.map(p => (
                    <div key={p.item_name} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-brand-800 text-sm">{p.item_name}</p>
                        <p className="text-xs text-brand-500">HPP: {formatIDR(p.avg_hpp)} · Margin sekarang: {p.margin_pct.toFixed(0)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-brand-500 line-through">{formatIDR(p.avg_price)}</p>
                        <p className="font-bold text-amber-700">{formatIDR(p.suggested_price)}</p>
                        <p className="text-xs text-amber-600">Target margin 40%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
