'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { BarChart2, MessageCircle, Send, ArrowLeft, CheckCircle2 } from 'lucide-react'

const WHATSAPP_NUMBER = '6287888760105'
const TEMPLATE_MESSAGE = 'Halo saya mau daftar akun blablabla'

export default function CreateAccount() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  useEffect(() => {
    if (!sent) return
    const timer = setTimeout(() => router.push('/login'), 2500)
    return () => clearTimeout(timer)
  }, [sent, router])

  function handleWhatsApp() {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(TEMPLATE_MESSAGE)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        background: 'linear-gradient(135deg, #1a0f08 0%, #2d1b10 35%, #5c3d2e 65%, #8b5e3c 100%)',
      }}
    >
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute bottom-16 right-10 w-96 h-96 rounded-full bg-brand-600 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <BarChart2 className="text-white icon-md" />
          </div>
          <span className="text-white font-bold text-xl">CafeMargin</span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-white/70 text-xs font-medium mb-6">
            <MessageCircle className="text-brand-400 icon-xs" />
            {t('create_account.tagline')}
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            {t('create_account.hero_title')}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            {t('create_account.hero_desc')}
          </p>
        </div>

        <p className="relative text-white/30 text-xs">{t('company')}</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[460px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <BarChart2 className="text-white icon-md" />
            </div>
            <span className="text-white font-bold text-xl">CafeMargin</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-900">{t('create_account.title')}</h2>
              <p className="text-brand-400 text-[var(--text-sm)] mt-1">{t('create_account.subtitle')}</p>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
              <p className="text-[var(--text-xs)] font-semibold text-brand-600 uppercase tracking-wider mb-2">
                {t('create_account.message_label')}
              </p>
              <div className="bg-white border border-brand-200 rounded-xl p-3 text-sm text-brand-700">
                {TEMPLATE_MESSAGE}
              </div>
              <p className="text-xs text-brand-400 mt-2">{t('create_account.message_note')}</p>
            </div>

            {sent && (
              <div className="mt-4 flex items-start gap-2.5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <CheckCircle2 className="text-green-500 mt-0.5 icon-sm" />
                <div>
                  <p className="font-semibold">{t('create_account.sent_title')}</p>
                  <p className="text-xs mt-0.5">{t('create_account.sent_desc')}</p>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-3">
              <button onClick={handleWhatsApp} className="btn-primary w-full">
                <Send className="icon-sm" /> {t('create_account.send_whatsapp')}
              </button>
              <Link href="/login" className="btn-secondary w-full">
                <ArrowLeft className="icon-sm" /> {t('create_account.back_login')}
              </Link>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs mt-5">
            © 2026 {t('company')}
          </p>
        </div>
      </div>
    </div>
  )
}
