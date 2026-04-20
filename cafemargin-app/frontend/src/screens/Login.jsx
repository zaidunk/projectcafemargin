import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { t } = useTranslation()
  const { user, login, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError('')
    const result = await login(form.email, form.password)
    if (result.ok) {
      toast.success('Selamat datang di CafeMargin!')
      router.push('/dashboard')
    } else {
      setError(result.error)
    }
  }

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{
      background: 'linear-gradient(135deg, #1a0f08 0%, #2d1b10 35%, #5c3d2e 65%, #8b5e3c 100%)'
    }}>
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-brand-600 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src="/logo.jpeg" alt="CafeMargin" className="w-10 h-10 rounded-2xl object-cover" />
          <span className="text-white font-bold text-xl">CafeMargin</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-white/70 text-xs font-medium mb-6">
            <Sparkles className="text-brand-400 icon-xs" />
            Strategic Data Analytics Platform
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Maksimalkan Margin<br />
            <span className="text-brand-400">Cafe Anda</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Temukan kebocoran margin, identifikasi golden hours, dan ambil keputusan bisnis berbasis data — bukan insting.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10">
            {[
              { value: '20+', label: 'Analytics Pages' },
              { value: '11', label: 'ML Algorithms' },
              { value: '100K', label: 'All-in-One' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/8 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white text-xl font-bold">{value}</p>
                <p className="text-white/50 text-[var(--text-xs)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">
          PT Xolvon Kehidupan Cerdas Abadi
        </p>
      </div>

      {/* Right: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/logo.jpeg" alt="CafeMargin" className="w-10 h-10 rounded-2xl object-cover" />
            <span className="text-white font-bold text-xl">CafeMargin</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-900">{t('login.title')}</h2>
              <p className="text-brand-400 text-[var(--text-sm)] mt-1">Masukkan kredensial akun cafe Anda</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <span className="text-red-500 mt-0.5 flex-shrink-0">!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('login.email')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder="admin"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required autoFocus
                />
              </div>

              <div>
                <label className="label">{t('login.password')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700 transition-colors"
                  >
                    {showPass ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                ) : (
                  <>{t('login.submit')} <ArrowRight className="icon-sm" /></>
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-brand-500">{t('login.no_account')}</p>
              <Link href="/create-account" className="text-brand-700 font-semibold hover:underline">
                {t('login.create_account')}
              </Link>
            </div>

          </div>

          <p className="text-center text-white/30 text-xs mt-5">
            © 2026 PT Xolvon Kehidupan Cerdas Abadi
          </p>
        </div>
      </div>
    </div>
  )
}
