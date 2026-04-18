import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, AlertCircle, Shield } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'
import MetricCard from '../components/Cards/MetricCard'
import TipsCard from '../components/TipsCard'
import api from '../api/client'
import clsx from 'clsx'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function AnomalyDetection() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(9999)

  useEffect(() => {
    setLoading(true)
    api.get(`/advanced/anomalies?period_days=${period}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const s = data?.summary || {}
  const anomalies = data?.anomalies || []
  const byType = data?.by_type || []

  return (
    <AppLayout title="Anomaly Detection">
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
          color="amber"
          tips={(t('tips.anomalies', { returnObjects: true }) || []).map((text, i) => ({ icon: ['📊','⬆️','📈','🔍'][i] || '💡', text }))}
        />
        </div>

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard label="Total Anomali" value={s.total_anomalies || 0} icon={AlertTriangle} color="red" />
              <MetricCard label="High Severity" value={s.high_severity || 0} icon={AlertCircle} color="red" />
              <MetricCard label="Medium Severity" value={s.medium_severity || 0} icon={Shield} color="amber" />
            </div>

            {byType.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-3">Anomali per Tipe</h3>
                <div className="flex gap-3">
                  {byType.map(t => (
                    <div key={t.type} className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs text-red-600 capitalize">{t.type.replace('_', ' ')}</p>
                      <p className="text-xl font-bold text-red-800">{t.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-3">Detail Anomali</h3>
              {anomalies.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={36} className="text-green-300 mx-auto mb-3" />
                  <p className="text-green-600 font-medium">Tidak ada anomali terdeteksi</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Severity</th><th>Tipe</th><th>Tanggal</th><th>Jam</th><th>Nilai</th><th>Threshold</th></tr></thead>
                    <tbody>
                      {anomalies.slice(0, 30).map((a, i) => (
                        <tr key={i}>
                          <td>
                            <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
                              a.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="text-xs capitalize">{a.type.replace('_', ' ')}</td>
                          <td>{a.date}</td>
                          <td>{String(a.hour).padStart(2, '0')}:00</td>
                          <td className="font-semibold">{typeof a.value === 'number' && a.value > 1000 ? formatIDR(a.value) : a.value}</td>
                          <td className="text-xs text-brand-500">
                            {a.threshold_upper ? `≤ ${formatIDR(a.threshold_upper)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
