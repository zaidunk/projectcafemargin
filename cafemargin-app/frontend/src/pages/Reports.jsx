import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/Layout/AppLayout'
import api from '../api/client'
import toast from 'react-hot-toast'
import { FileText, Download } from 'lucide-react'

export default function Reports() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(9999)
  const [generating, setGenerating] = useState(false)

  async function downloadExecutiveSummary() {
    setGenerating(true)
    try {
      const res = await api.get(`/reports/executive-summary?period_days=${period}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `executive-summary-cafemargin-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Laporan berhasil didownload!')
    } catch {
      toast.error('Gagal menggenerate laporan')
    } finally {
      setGenerating(false)
    }
  }

  const PERIOD_OPTIONS = [
    { days: 7, label: '7 Hari Terakhir' },
    { days: 30, label: '30 Hari Terakhir' },
    { days: 90, label: '90 Hari Terakhir' },
  ]

  return (
    <AppLayout title={t('nav.reports')}>
      <div className="space-y-5 max-w-2xl">
        {/* Period selector */}
        <div className="card">
          <h3 className="font-semibold text-brand-800 mb-3">{t('reports.period_label')}</h3>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(({ days, label }) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === days ? 'bg-brand-700 text-white' : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="card border-2 border-brand-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-700 rounded-xl flex-shrink-0">
              <FileText size={24} className="text-brand-50" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-brand-800 text-lg">{t('reports.executive_summary')}</h3>
              <p className="text-brand-500 text-sm mt-1">{t('reports.executive_desc')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-brand-600">
                {['✅ Margin Snapshot', '✅ Top 5 Kebocoran', '✅ Peak Hour Analysis', '✅ Top Items by Revenue', '✅ Rekomendasi Aksi', '✅ Branding CafeMargin'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-200">
            <button
              onClick={downloadExecutiveSummary}
              disabled={generating}
              className="btn-primary flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-300 border-t-white rounded-full animate-spin" />
                  {t('reports.generating')}
                </>
              ) : (
                <>
                  <Download size={16} />
                  {t('reports.download')} — {PERIOD_OPTIONS.find(o => o.days === period)?.label}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <p className="text-sm text-brand-600">
            <strong>Catatan:</strong> Laporan digenerate secara real-time berdasarkan data transaksi yang telah diupload.
            Pastikan data transaksi sudah ter-upload sebelum mendownload laporan.
          </p>
          <p className="text-xs text-brand-400 mt-2">
            Untuk laporan lebih komprehensif termasuk konsultasi langsung, hubungi tim CafeMargin —
            <strong className="text-brand-600"> PT Xolvon Kehidupan Cerdas Abadi</strong>
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
