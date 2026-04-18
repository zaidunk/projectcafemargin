import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingBag, Link, Package, Users } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

const ROLE_BADGE = {
  Anchor:     { cls: 'bg-green-100 text-green-800 border-green-200',  icon: '⚓' },
  Standalone: { cls: 'bg-blue-100 text-blue-800 border-blue-200',     icon: '🎯' },
  Companion:  { cls: 'bg-amber-100 text-amber-800 border-amber-200',  icon: '🤝' },
  Weak:       { cls: 'bg-red-100 text-red-700 border-red-200',        icon: '⚠️' },
}

export default function BasketAnalysis() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/baskets?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const stats = data?.basket_stats || {}
  const pairs = data?.item_pairs || []
  const bundles = data?.top_bundles || []
  const triples = data?.top_triples || []
  const roles = data?.menu_roles || []

  const filteredRoles = roleFilter === 'all' ? roles : roles.filter(r => r.role === roleFilter)

  const chartData = pairs.slice(0, 10).map(p => ({
    name: `${p.item_a.length > 15 ? p.item_a.slice(0, 15) + '…' : p.item_a} + ${p.item_b.length > 15 ? p.item_b.slice(0, 15) + '…' : p.item_b}`,
    fullName: `${p.item_a} + ${p.item_b}`,
    count: p.count,
    support: +(p.support * 100).toFixed(1),
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const d = chartData.find(c => c.name === label)
    return (
      <div className="bg-white border border-brand-200 rounded-xl p-3 shadow-lg text-xs max-w-[220px]">
        <p className="font-semibold text-brand-700 mb-1 break-words">{d?.fullName || label}</p>
        <p className="text-brand-800">Dibeli bersama: <strong>{payload[0].value}×</strong></p>
        {payload[1] && <p className="text-brand-500">Support: <strong>{payload[1].value}%</strong></p>}
      </div>
    )
  }

  return (
    <AppLayout title={t('nav.baskets')}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          {[7, 30, 90, 365, 9999].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
        </div>

        <TipsCard
          titleKey="tips.title"
          color="blue"
          tips={(t('tips.basket', { returnObjects: true }) || []).map((text, i) => ({ icon: ['🧺','📊','🔗','⚓','🤝','💰'][i] || '💡', text }))}
        />

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard label="Total Basket" value={(stats.total_baskets || 0).toLocaleString('id-ID')} icon={ShoppingBag} color="brand" />
              <MetricCard label="Avg Basket Size" value={`${(stats.avg_basket_size || 0).toFixed(1)} item`} icon={Package} color="green"
                subvalue="rata-rata item per struk" />
              <MetricCard label="Max Basket" value={`${stats.max_basket_size || 0} item`} icon={Package} color="amber"
                subvalue="transaksi terbesar" />
              <MetricCard label="Single Item %" value={`${(stats.single_item_pct || 0).toFixed(1)}%`} icon={Link} color="red"
                subvalue="beli hanya 1 item" />
            </div>

            {/* Top Item Pairs Chart */}
            {chartData.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-1">Top 10 Pasangan Item yang Sering Dibeli Bersama</h3>
                <p className="text-xs text-brand-400 mb-4">Nama item dipotong untuk keterbacaan. Hover untuk nama lengkap.</p>
                <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 38)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#8b5e3c' }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10, fill: '#5c3d2e' }}
                      width={200}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#5c3d2e" radius={[0, 4, 4, 0]} name="Frekuensi" barSize={18} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Table */}
                <div className="table-container mt-4">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>#</th><th>Item A</th><th>Item B</th><th>Freq</th>
                        <th title="Seberapa sering pasangan ini muncul dari total struk">Support</th>
                        <th title="Dari semua struk dengan Item A, berapa % ada Item B">Conf A→B</th>
                        <th title="Dari semua struk dengan Item B, berapa % ada Item A">Conf B→A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pairs.slice(0, 15).map((p, i) => (
                        <tr key={i}>
                          <td className="text-brand-400 font-mono">{i + 1}</td>
                          <td className="text-brand-800 font-medium max-w-[120px] truncate" title={p.item_a}>{p.item_a}</td>
                          <td className="text-brand-800 font-medium max-w-[120px] truncate" title={p.item_b}>{p.item_b}</td>
                          <td className="font-semibold text-brand-700">{p.count}</td>
                          <td>{(p.support * 100).toFixed(1)}%</td>
                          <td className="text-green-700 font-medium">{(p.confidence_a_to_b * 100).toFixed(1)}%</td>
                          <td className="text-green-700 font-medium">{(p.confidence_b_to_a * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top 3-Item Combos */}
            {triples.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Top Kombinasi 3 Item</h3>
                <div className="space-y-2">
                  {triples.slice(0, 8).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                      <span className="text-xs font-bold text-brand-400 w-5 text-center">#{i + 1}</span>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {t.items.map((item, j) => (
                          <span key={j} className="bg-white border border-brand-200 text-brand-700 text-xs px-2 py-0.5 rounded-full">{item}</span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-brand-600 flex-shrink-0">{t.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bundle Suggestions */}
            {bundles.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Rekomendasi Bundling (−10% diskon)</h3>
                <div className="space-y-3">
                  {bundles.map((b, i) => (
                    <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {b.items.map((item, j) => (
                              <span key={j} className="bg-white border border-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">{item}</span>
                            ))}
                          </div>
                          <p className="text-xs text-green-600 mt-1">Dibeli bersama <strong>{b.frequency}×</strong></p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-brand-400 line-through">{formatIDR(b.individual_total)}</p>
                          <p className="font-bold text-green-700 text-sm">{formatIDR(b.suggested_bundle_price)}</p>
                          <p className="text-xs text-green-600">Hemat {b.discount_pct}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Roles */}
            {roles.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-semibold text-brand-800">Peran Menu (Anchor / Standalone / Companion / Weak)</h3>
                  <div className="flex gap-1.5 flex-wrap">
                    {['all', 'Anchor', 'Standalone', 'Companion', 'Weak'].map(role => (
                      <button key={role} onClick={() => setRoleFilter(role)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${roleFilter === role ? 'bg-brand-700 text-white' : 'bg-brand-50 border border-brand-200 text-brand-600'}`}>
                        {role === 'all' ? 'Semua' : role}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="table-container">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th title="Total terjual (solo + bundel)">Total Terjual</th>
                        <th title="Dijual sendiri (single item)">Solo</th>
                        <th title="Dijual bersama item lain">Bundel</th>
                        <th title="Skor popularitas (terjual / total struk)">Popularitas</th>
                        <th title="Skor bundel (bundel / total terjual)">Support</th>
                        <th>Peran</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.map((r, i) => {
                        const badge = ROLE_BADGE[r.role] || ROLE_BADGE.Weak
                        return (
                          <tr key={i}>
                            <td className="font-medium text-brand-800 max-w-[140px] truncate" title={r.item_name}>{r.item_name}</td>
                            <td>{r.total_sold}</td>
                            <td>{r.solo_count}</td>
                            <td className="text-green-700 font-medium">{r.multi_count}</td>
                            <td>{(r.popularity_score * 100).toFixed(1)}%</td>
                            <td>{(r.support_score * 100).toFixed(1)}%</td>
                            <td>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                                {badge.icon} {r.role}
                              </span>
                            </td>
                            <td className="text-brand-500 max-w-[160px] truncate" title={r.role_desc}>{r.role_desc}</td>
                          </tr>
                        )
                      })}
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
