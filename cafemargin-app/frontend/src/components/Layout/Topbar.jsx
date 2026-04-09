import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Languages, Bell, Printer, Download } from 'lucide-react'

export default function Topbar({ title }) {
  const { t } = useTranslation()
  const { user, toggleLanguage } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-brand-100/60 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-bold text-brand-900 tracking-tight">{title}</h1>
        <p className="text-[10px] text-brand-400 font-medium mt-0.5">{user?.cafe_name || 'CafeMargin Analytics'}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Print */}
        <button
          onClick={() => window.print()}
          className="p-2 text-brand-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
          title="Print halaman ini"
        >
          <Printer size={14} />
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-500 hover:text-brand-800 bg-brand-50/80 hover:bg-brand-100 border border-brand-200/60 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Languages size={12} />
          <span>{user?.preferred_lang === 'id' ? 'ID' : 'EN'}</span>
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2.5 bg-brand-50/80 border border-brand-200/60 rounded-xl px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] font-semibold text-brand-800 leading-none">{user?.full_name}</p>
            <p className="text-[9px] text-brand-400 mt-0.5 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
