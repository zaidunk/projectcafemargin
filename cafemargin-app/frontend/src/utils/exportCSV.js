/**
 * Export data array to CSV and trigger download
 * @param {Array} data - Array of objects
 * @param {string} filename - Filename without extension
 */
export function exportCSV(data, filename = 'export') {
  if (!data?.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => {
    const val = row[h]
    const str = String(val ?? '')
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Format IDR currency
 */
export const formatIDR = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`

/**
 * Format compact number (1K, 1M, etc)
 */
export const formatCompact = (v) => {
  const n = Number(v || 0)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
