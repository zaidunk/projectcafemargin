import { Download } from 'lucide-react'
import AppLayout from '../Layout/AppLayout'
import { exportCSV } from '../../utils/exportCSV'

/**
 * Reusable page shell with period selector, export button, loading skeleton, empty state
 */
export default function PageShell({
  title,
  period, setPeriod,
  periods = [7, 30, 90, 365, 9999],
  loading,
  hasData,
  exportData,
  exportFilename,
  emptyMessage = 'Belum ada data. Upload transaksi terlebih dahulu.',
  children,
}) {
  return (
    <AppLayout title={title}>
      <div className="space-y-5">
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-500 font-medium">Periode:</span>
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                  period === p
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-white border border-brand-200/60 text-brand-500 hover:text-brand-700 hover:border-brand-300'
                }`}
              >
                {p === 9999 ? 'Semua' : p === 365 ? '1 Tahun' : `${p} Hari`}
              </button>
            ))}
          </div>
          {exportData && exportFilename && (
            <button
              onClick={() => exportCSV(exportData, exportFilename)}
              className="btn-ghost text-xs gap-1.5 px-3 py-1.5"
            >
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="skeleton h-56 rounded-2xl" />
              <div className="skeleton h-56 rounded-2xl" />
            </div>
          </div>
        ) : !hasData ? (
          <div className="empty-state">
            <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-3">
              <Download size={24} className="text-brand-300" />
            </div>
            <p className="text-brand-400 text-sm">{emptyMessage}</p>
          </div>
        ) : children}
      </div>
    </AppLayout>
  )
}
