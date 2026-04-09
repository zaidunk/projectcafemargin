import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Receipt, TrendingDown, UtensilsCrossed,
  Clock, Target, FileText, Settings, Shield, LogOut, BarChart2, Lock,
  TrendingUp, Percent, Users, ShoppingCart, AlertTriangle, GitCompare,
  CreditCard, Package, Calculator, Sparkles, ChevronDown, Search,
  Zap, PanelLeftClose, PanelLeft
} from 'lucide-react'
import clsx from 'clsx'

const LEVEL_BADGE = {
  1: { text: 'DIAGNOSTIC', cls: 'bg-amber-400/20 text-amber-200 border border-amber-400/30' },
  2: { text: 'GROWTH',     cls: 'bg-green-400/20 text-green-200 border border-green-400/30' },
  3: { text: 'CONTROL',    cls: 'bg-blue-400/20 text-blue-200 border border-blue-400/30' },
  4: { text: 'SCALE',      cls: 'bg-purple-400/20 text-purple-200 border border-purple-400/30' },
}

const NAV_SECTIONS = [
  {
    key: 'core',
    label: 'Core Analytics',
    items: [
      { to: '/dashboard',        icon: LayoutDashboard, label: 'nav.dashboard',        minLevel: 1 },
      { to: '/transactions',     icon: Receipt,         label: 'nav.transactions',      minLevel: 1 },
      { to: '/margin',           icon: TrendingDown,    label: 'nav.margin',            minLevel: 1 },
      { to: '/peak-hours',       icon: Clock,           label: 'nav.peak_hours',        minLevel: 1 },
      { to: '/menu-performance', icon: UtensilsCrossed, label: 'nav.menu_performance',  minLevel: 1 },
    ],
  },
  {
    key: 'advanced',
    label: 'Advanced ML',
    items: [
      { to: '/forecast',        icon: TrendingUp,      label: 'nav.forecast',          minLevel: 1 },
      { to: '/discounts',       icon: Percent,         label: 'nav.discounts',         minLevel: 1 },
      { to: '/anomalies',       icon: AlertTriangle,   label: 'nav.anomalies',         minLevel: 1 },
      { to: '/comparison',      icon: GitCompare,      label: 'nav.comparison',        minLevel: 1 },
      { to: '/baskets',         icon: ShoppingCart,     label: 'nav.baskets',           minLevel: 1 },
      { to: '/menu-optimizer',  icon: Sparkles,        label: 'nav.menu_optimizer',    minLevel: 1 },
    ],
  },
  {
    key: 'insights',
    label: 'Insights & Tools',
    items: [
      { to: '/customers',       icon: Users,           label: 'nav.customers',         minLevel: 1 },
      { to: '/payments',        icon: CreditCard,      label: 'nav.payments',          minLevel: 1 },
      { to: '/staff',           icon: Users,           label: 'nav.staff',             minLevel: 1 },
      { to: '/inventory',       icon: Package,         label: 'nav.inventory',         minLevel: 1 },
      { to: '/promo-simulator', icon: Calculator,      label: 'nav.promo_simulator',   minLevel: 1 },
    ],
  },
  {
    key: 'manage',
    label: 'Management',
    items: [
      { to: '/kpi',      icon: Target,   label: 'nav.kpi',      minLevel: 1 },
      { to: '/reports',  icon: FileText, label: 'nav.reports',  minLevel: 1 },
      { to: '/settings', icon: Settings, label: 'nav.settings', minLevel: 1 },
    ],
  },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { user, logout, hasLevel } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState({ core: true, advanced: true, insights: true, manage: true })
  const [search, setSearch] = useState('')

  const levelInfo = LEVEL_BADGE[user?.subscription_level] || LEVEL_BADGE[1]

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const allItems = NAV_SECTIONS.flatMap(s => s.items)
  const filtered = search
    ? allItems.filter(i => t(i.label).toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <aside className={clsx(
      'min-h-screen flex flex-col shadow-sidebar transition-all duration-300 relative',
      collapsed ? 'w-[60px]' : 'w-[230px]'
    )} style={{
      background: 'linear-gradient(180deg, #1a0f08 0%, #2d1b10 40%, #3d2419 100%)'
    }}>
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-3 pt-5 pb-3', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow flex-shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">CafeMargin</p>
            <p className="text-brand-400 text-[9px] font-medium tracking-wider">ANALYTICS PLATFORM</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-brand-700 border-2 border-brand-900 flex items-center justify-center text-brand-200 hover:text-white hover:bg-brand-600 transition-all z-50 shadow-lg"
      >
        {collapsed ? <PanelLeft size={11} /> : <PanelLeftClose size={11} />}
      </button>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/8 mb-2" />

      {/* Cafe info */}
      {user && !collapsed && (
        <div className="px-3 mb-2">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/8">
            <p className="text-white text-xs font-semibold truncate">{user.cafe_name || user.full_name}</p>
            <p className="text-brand-400 text-[10px] mt-0.5 truncate">{user.email}</p>
            {user.subscription_level && (
              <span className={clsx('mt-1.5 inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider', levelInfo.cls)}>
                {levelInfo.text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full bg-white/8 border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white/80 placeholder:text-white/25 outline-none focus:border-brand-400/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 pb-2 overflow-y-auto space-y-1 scrollbar-thin">
        {search && filtered ? (
          // Search results
          filtered.map(item => (
            <NavItem key={item.to} item={item} collapsed={collapsed} hasLevel={hasLevel} t={t} />
          ))
        ) : (
          // Grouped sections
          NAV_SECTIONS.map(section => {
            const items = [...section.items]
            if (section.key === 'manage' && user?.role === 'superadmin') {
              items.push({ to: '/admin', icon: Shield, label: 'nav.admin', minLevel: 1 })
            }
            return (
              <div key={section.key}>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 hover:text-white/50 transition-colors"
                  >
                    {section.label}
                    <ChevronDown size={10} className={clsx('transition-transform', !openSections[section.key] && '-rotate-90')} />
                  </button>
                )}
                {(collapsed || openSections[section.key]) && (
                  <div className="space-y-0.5">
                    {items.map(item => (
                      <NavItem key={item.to} item={item} collapsed={collapsed} hasLevel={hasLevel} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/8 mb-1" />

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className={clsx(
            'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-white/30 hover:text-red-300 hover:bg-red-900/20 transition-all w-full',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={14} className="group-hover:scale-110 transition-transform flex-shrink-0" />
          {!collapsed && t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ item, collapsed, hasLevel, t }) {
  const { to, icon: Icon, label, minLevel } = item
  const locked = !hasLevel(minLevel)

  return (
    <NavLink
      to={locked ? '#' : to}
      onClick={locked ? (e) => e.preventDefault() : undefined}
      title={collapsed ? t(label) : undefined}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-150',
          collapsed && 'justify-center',
          locked
            ? 'text-white/15 cursor-not-allowed'
            : isActive
            ? 'bg-gradient-to-r from-brand-600/30 to-brand-500/10 text-white shadow-sm border-l-2 border-brand-400'
            : 'text-white/50 hover:text-white/85 hover:bg-white/7'
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={clsx('flex-shrink-0 transition-all duration-150',
            !locked && isActive && 'text-brand-400',
            !locked && !isActive && 'group-hover:scale-110 group-hover:text-brand-300')}>
            <Icon size={15} />
          </div>
          {!collapsed && (
            <>
              <span className="truncate flex-1">{t(label)}</span>
              {locked && <Lock size={10} className="opacity-30 flex-shrink-0" />}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}
