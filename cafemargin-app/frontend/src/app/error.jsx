'use client'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--pad-page)]">
      <div className="card max-w-md w-full text-center">
        <h2 className="text-[var(--text-lg)] font-bold text-brand-900">Terjadi kesalahan</h2>
        <p className="text-[var(--text-sm)] text-brand-500 mt-2">
          {error?.message || 'Silakan coba ulang beberapa saat lagi.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Coba lagi
          </button>
        </div>
      </div>
    </div>
  )
}
