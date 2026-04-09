import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Percent, TrendingUp, Calculator, ArrowRight } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function PromoSimulator() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState('')
  const [discountPct, setDiscountPct] = useState(10)
  const [volumeBoost, setVolumeBoost] = useState(20)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ period_days: 9999, discount_pct: discountPct, volume_boost_pct: volumeBoost })
    if (selectedItem) params.set('item_name', selectedItem)
    api.get(`/advanced/promo-simulator?${params}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [selectedItem, discountPct, volumeBoost])

  const items = data?.items || []
  const sim = data?.simulation || {}

  return (
    <AppLayout title="Promo Simulator">
      <div className="space-y-5">
        <div className="card">
          <h3 className="font-semibold text-brand-800 mb-4">Simulasi What-If</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Pilih Menu Item</label>
              <select className="input" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                <option value="">-- Pilih item --</option>
                {items.map(i => (
                  <option key={i.item_name} value={i.item_name}>{i.item_name} ({formatIDR(i.avg_price)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Diskon %: {discountPct}%</label>
              <input type="range" min="0" max="50" step="5" value={discountPct}
                onChange={e => setDiscountPct(Number(e.target.value))}
                className="w-full accent-brand-600" />
            </div>
            <div>
              <label className="label">Estimasi Volume Boost: +{volumeBoost}%</label>
              <input type="range" min="0" max="100" step="5" value={volumeBoost}
                onChange={e => setVolumeBoost(Number(e.target.value))}
                className="w-full accent-brand-600" />
            </div>
          </div>
        </div>

        {loading ? <div className="skeleton h-40 rounded-2xl" /> : sim?.item_name && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card border-2 border-brand-200">
                <h4 className="text-sm font-semibold text-brand-600 mb-3">SEBELUM PROMO</h4>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-brand-500">Harga</span><span className="font-semibold">{formatIDR(sim.original.price)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-brand-500">Qty Terjual</span><span className="font-semibold">{sim.original.qty.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-brand-500">Revenue</span><span className="font-semibold">{formatIDR(sim.original.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-brand-500">Profit</span><span className="font-semibold">{formatIDR(sim.original.profit)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-brand-500">Margin</span><span className="font-semibold">{sim.original.margin_pct.toFixed(1)}%</span></div>
                </div>
              </div>

              <div className="card border-2 border-green-300 bg-green-50/50">
                <h4 className="text-sm font-semibold text-green-700 mb-3">SETELAH PROMO</h4>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-green-600">Harga Promo</span><span className="font-semibold">{formatIDR(sim.simulated.price)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-green-600">Qty Estimasi</span><span className="font-semibold">{sim.simulated.qty.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-green-600">Revenue</span><span className="font-semibold">{formatIDR(sim.simulated.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-green-600">Profit</span><span className="font-semibold">{formatIDR(sim.simulated.profit)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-green-600">Margin</span><span className="font-semibold">{sim.simulated.margin_pct.toFixed(1)}%</span></div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">Impact Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Revenue Change', value: formatIDR(sim.impact.revenue_change), pct: sim.impact.revenue_change_pct },
                  { label: 'Profit Change', value: formatIDR(sim.impact.profit_change), pct: sim.impact.profit_change_pct },
                  { label: 'Breakeven Volume', value: `${sim.impact.breakeven_volume} unit`, pct: null },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-brand-50 rounded-xl border border-brand-100">
                    <p className="text-xs text-brand-500">{item.label}</p>
                    <p className="text-sm font-bold text-brand-800 mt-1">{item.value}</p>
                    {item.pct !== null && (
                      <p className={clsx('text-xs font-semibold mt-0.5', item.pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(1)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className={clsx('mt-4 p-4 rounded-xl border',
                sim.impact.profit_change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                <p className={clsx('text-sm font-semibold', sim.impact.profit_change >= 0 ? 'text-green-800' : 'text-red-800')}>
                  {sim.impact.profit_change >= 0
                    ? `Promo ini berpotensi MENGUNTUNGKAN — profit naik ${formatIDR(sim.impact.profit_change)}`
                    : `Promo ini berpotensi MERUGIKAN — profit turun ${formatIDR(Math.abs(sim.impact.profit_change))}. Butuh minimal ${sim.impact.breakeven_volume} unit untuk breakeven.`
                  }
                </p>
              </div>
            </div>
          </>
        )}

        {!selectedItem && !loading && (
          <div className="card text-center py-12">
            <Calculator size={36} className="text-brand-200 mx-auto mb-3" />
            <p className="text-brand-400">Pilih item untuk mulai simulasi</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
