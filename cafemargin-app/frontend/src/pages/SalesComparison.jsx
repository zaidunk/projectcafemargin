import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, ArrowDownRight, GitCompare, BarChart2 } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function SalesComparison() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/comparison?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const comparison = data?.comparison || []
  const wow = data?.wow || []

  return (
    <AppLayout title="Sales Comparison">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${period === p ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600'}`}>
              {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} vs ${p} Hari`}
            </button>
          ))}
        </div>

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparison.map(c => {
                const up = c.change_pct >= 0
                return (
                  <div key={c.metric} className="card">
                    <p className="text-xs text-brand-500 mb-1">{c.metric}</p>
                    <p className="text-lg font-bold text-brand-800">
                      {c.metric.includes('Revenue') || c.metric.includes('Avg') ? formatIDR(c.current) : c.current.toLocaleString()}
                    </p>
                    <div className={clsx('flex items-center gap-1 mt-1 text-xs font-semibold', up ? 'text-green-600' : 'text-red-600')}>
                      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(c.change_pct).toFixed(1)}%
                      <span className="text-brand-400 font-normal ml-1">vs periode lalu</span>
                    </div>
                    <p className="text-xs text-brand-400 mt-0.5">
                      Sebelumnya: {c.metric.includes('Revenue') || c.metric.includes('Avg') ? formatIDR(c.previous) : c.previous.toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>

            {wow.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">Revenue per Minggu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={wow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5bc" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={v => `W${v}`} />
                    <YAxis tick={{ fontSize: 10, fill: '#8b5e3c' }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                    <Tooltip formatter={v => formatIDR(v)} />
                    <Bar dataKey="revenue" fill="#5c3d2e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
