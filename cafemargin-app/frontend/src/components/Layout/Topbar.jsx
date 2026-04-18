'use client'

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Languages, Printer, Menu } from 'lucide-react'

export default function Topbar({ title, onToggleSidebar = () => {} }) {
  const { t } = useTranslation()
  const { user, toggleLanguage } = useAuth()
  const handlePrint = useCallback(() => window.print(), [])

  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-brand-100/60 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-brand-500 hover:text-brand-800 hover:bg-brand-50 transition-all"
          aria-label="Buka menu"
        >
          <Menu className="icon-md" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[var(--text-base)] font-bold text-brand-900 tracking-tight truncate">{title}</h1>
          <p className="text-[var(--text-xs)] text-brand-400 font-medium mt-0.5 truncate">
            {user?.cafe_name || 'CafeMargin Analytics'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Print */}
        <button
          onClick={handlePrint}
          className="p-2 text-brand-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
          title="Print halaman ini"
        >
          <Printer className="icon-sm" />
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-[var(--text-xs)] font-semibold text-brand-500 hover:text-brand-800 bg-brand-50/80 hover:bg-brand-100 border border-brand-200/60 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Languages className="icon-xs" />
          <span>{user?.preferred_lang === 'id' ? 'ID' : 'EN'}</span>
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2.5 bg-brand-50/80 border border-brand-200/60 rounded-xl px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[var(--text-xs)] font-bold flex-shrink-0 shadow-sm">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-[var(--text-xs)] font-semibold text-brand-800 leading-none">{user?.full_name}</p>
            <p className="text-[var(--text-xxs)] text-brand-400 mt-0.5 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
