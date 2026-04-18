import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--pad-page)]">
      <div className="card max-w-md w-full text-center">
        <h2 className="text-[var(--text-lg)] font-bold text-brand-900">Halaman tidak ditemukan</h2>
        <p className="text-[var(--text-sm)] text-brand-500 mt-2">
          Link yang Anda buka tidak tersedia.
        </p>
        <div className="mt-5">
          <Link href="/" className="btn-primary">Kembali ke Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
