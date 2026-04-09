import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingBag, Link, Package } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import api from '../api/client'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function BasketAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/baskets?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const stats = data?.basket_stats || {}
  const pairs = data?.item_pairs || []
  const bundles = data?.top_bundles || []

  return (
    <AppLayout title="Basket Analysis">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          {[7, 30, 90, 365, 9999].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
            </button>
          ))}
        </div>

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <MetricCard label="Total Basket" value={(stats.total_baskets || 0).toLocaleString()} icon={ShoppingBag} color="brand" />
              <MetricCard label="Avg Basket Size" value={`${(stats.avg_basket_size || 0).toFixed(1)} item`} icon={Package} color="green" />
              <MetricCard label="Max Basket" value={`${stats.max_basket_size || 0} item`} icon={Package} color="amber" />
              <MetricCard label="Single Item %" value={`${(stats.single_item_pct || 0).toFixed(1)}%`} icon={Link} color="red" />
            </div>

            {pairs.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Top Item Pairs (Association Rules)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pairs.slice(0, 10)} layout="vertical" margin={{ left: 150 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey={d => `${d.item_a} + ${d.item_b}`} type="category" tick={{ fontSize: 9 }} width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#5c3d2e" radius={[0, 4, 4, 0]} name="Frequency" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="table-container mt-4">
                  <table className="table">
                    <thead><tr><th>Item A</th><th>Item B</th><th>Freq</th><th>Support</th><th>Conf A→B</th><th>Conf B→A</th></tr></thead>
                    <tbody>
                      {pairs.slice(0, 15).map((p, i) => (
                        <tr key={i}>
                          <td className="text-brand-800 font-medium text-xs">{p.item_a}</td>
                          <td className="text-brand-800 font-medium text-xs">{p.item_b}</td>
                          <td>{p.count}</td>
                          <td>{(p.support * 100).toFixed(1)}%</td>
                          <td>{(p.confidence_a_to_b * 100).toFixed(1)}%</td>
                          <td>{(p.confidence_b_to_a * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {bundles.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Rekomendasi Bundling</h3>
                <div className="space-y-3">
                  {bundles.map((b, i) => (
                    <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-green-800">{b.items.join(' + ')}</p>
                          <p className="text-xs text-green-600 mt-1">Dibeli bersama {b.frequency}x</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-brand-500 line-through">{formatIDR(b.individual_total)}</p>
                          <p className="font-bold text-green-700">{formatIDR(b.suggested_bundle_price)}</p>
                          <p className="text-xs text-green-600">Hemat {b.discount_pct}%</p>
                        </div>
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
