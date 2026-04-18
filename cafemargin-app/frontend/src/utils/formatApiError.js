export function formatApiError(err, fallback = 'Terjadi kesalahan') {
  const detail = err?.response?.data?.detail ?? err?.response?.data ?? err?.message
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.detail || JSON.stringify(item))
      .join(', ')
  }
  if (detail && typeof detail === 'object') {
    if (detail.msg) return detail.msg
    if (detail.detail) return detail.detail
    if (detail.error) return detail.error
    return JSON.stringify(detail)
  }
  if (detail) return String(detail)
  return fallback
}
