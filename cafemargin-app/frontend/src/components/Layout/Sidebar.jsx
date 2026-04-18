
'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Settings,
  Shield,
  LogOut,
  Lock,
  TrendingDown,
  UtensilsCrossed,
  Clock,
  Target,
  TrendingUp,
  Percent,
  AlertTriangle,
  GitCompare,
  ShoppingCart,
  Sparkles,
  Users,
  CreditCard,
  Package,
  Calculator,
  ChevronDown,
  MoreHorizontal,
  Zap,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
} from 'lucide-react'
import clsx from 'clsx'

const LEVEL_BADGE = {
  1: { text: 'DIAGNOSTIC', cls: 'bg-amber-400/20 text-amber-200 border border-amber-400/30' },
  2: { text: 'GROWTH',     cls: 'bg-green-400/20 text-green-200 border border-green-400/30' },
  3: { text: 'CONTROL',    cls: 'bg-blue-400/20 text-blue-200 border border-blue-400/30' },
  4: { text: 'SCALE',      cls: 'bg-purple-400/20 text-purple-200 border border-purple-400/30' },
}

const MAIN_NAV = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'nav.dashboard',          minLevel: 1 },
  { to: '/transactions',   icon: Receipt,         label: 'nav.upload_transaction', minLevel: 1 },
  { to: '/template-guide', icon: BookOpen,        label: 'nav.template_guide',     minLevel: 1 },
  { to: '/reports',        icon: FileText,        label: 'nav.reports',            minLevel: 1 },
  { to: '/features',       icon: Sparkles,        label: 'nav.features',           minLevel: 1 },
  { to: '/settings',       icon: Settings,        label: 'nav.settings',           minLevel: 1 },
]

const MORE_NAV = [
  { to: '/margin',           icon: TrendingDown,    label: 'nav.margin',           minLevel: 1 },
  { to: '/peak-hours',       icon: Clock,           label: 'nav.peak_hours',       minLevel: 1 },
  { to: '/menu-performance', icon: UtensilsCrossed, label: 'nav.menu_performance', minLevel: 1 },
  { to: '/kpi',              icon: Target,          label: 'nav.kpi',              minLevel: 1 },
  { to: '/forecast',         icon: TrendingUp,      label: 'nav.forecast',         minLevel: 1 },
  { to: '/discounts',        icon: Percent,         label: 'nav.discounts',        minLevel: 1 },
  { to: '/anomalies',        icon: AlertTriangle,   label: 'nav.anomalies',        minLevel: 1 },
  { to: '/comparison',       icon: GitCompare,      label: 'nav.comparison',       minLevel: 1 },
  { to: '/baskets',          icon: ShoppingCart,    label: 'nav.baskets',          minLevel: 1 },
  { to: '/menu-optimizer',   icon: Sparkles,        label: 'nav.menu_optimizer',   minLevel: 1 },
  { to: '/customers',        icon: Users,           label: 'nav.customers',        minLevel: 1 },
  { to: '/payments',         icon: CreditCard,      label: 'nav.payments',         minLevel: 1 },
  { to: '/staff',            icon: Users,           label: 'nav.staff',            minLevel: 1 },
  { to: '/inventory',        icon: Package,         label: 'nav.inventory',        minLevel: 1 },
  { to: '/promo-simulator',  icon: Calculator,      label: 'nav.promo_simulator',  minLevel: 1 },
]

export default function Sidebar({ mobileOpen = false, onMobileClose = () => {} }) {
  const { t } = useTranslation()
  const { user, logout, hasLevel } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const levelInfo = useMemo(() => (
    LEVEL_BADGE[user?.subscription_level] || LEVEL_BADGE[1]
  ), [user?.subscription_level])

  const moreItems = useMemo(() => {
    const items = [...MORE_NAV]
    if (user?.role === 'superadmin') {
      items.push({ to: '/admin', icon: Shield, label: 'nav.admin', minLevel: 1 })
    }
    return items
  }, [user?.role])

  const isCollapsed = collapsed && !mobileOpen

  const asideClass = clsx(
    'min-h-screen flex flex-col shadow-sidebar transition-all duration-300 relative',
    mobileOpen
      ? 'fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[280px]'
      : 'hidden md:flex md:relative',
    isCollapsed ? 'md:w-[4.5rem]' : 'md:w-[min(15rem,22vw)]'
  )

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}
      <aside className={asideClass} style={{
        background: 'linear-gradient(180deg, #1a0f08 0%, #2d1b10 40%, #3d2419 100%)'
      }}>
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-3 pt-5 pb-3', isCollapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow flex-shrink-0">
          <Zap className="text-white icon-sm" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">CafeMargin</p>
            <p className="text-brand-400 text-[var(--text-xxs)] font-medium tracking-wider">ANALYTICS PLATFORM</p>
          </div>
        )}
        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto md:hidden w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
            aria-label="Tutup menu"
          >
            <PanelLeftClose className="icon-sm mx-auto" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-brand-700 border-2 border-brand-900 items-center justify-center text-brand-200 hover:text-white hover:bg-brand-600 transition-all z-50 shadow-lg"
      >
        {collapsed ? <PanelLeft className="icon-xs" /> : <PanelLeftClose className="icon-xs" />}
      </button>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/8 mb-2" />

      {/* Cafe info */}
      {user && !isCollapsed && (
        <div className="px-3 mb-2">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/8">
            <p className="text-white text-xs font-semibold truncate">{user.cafe_name || user.full_name}</p>
            <p className="text-brand-400 text-[var(--text-xs)] mt-0.5 truncate">{user.email}</p>
            {user.subscription_level && (
              <span className={clsx('mt-1.5 inline-flex px-2 py-0.5 rounded-full text-[var(--text-xxs)] font-bold uppercase tracking-wider', levelInfo.cls)}>
                {levelInfo.text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 pb-2 overflow-y-auto space-y-1 scrollbar-thin">
        <div className="space-y-0.5">
          {MAIN_NAV.map(item => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={isCollapsed}
              hasLevel={hasLevel}
              t={t}
              pathname={pathname}
              onNavigate={onMobileClose}
            />
          ))}
        </div>

        <div className="mx-3 h-px bg-white/8 my-2" />

        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={clsx(
            'flex items-center justify-between w-full px-2 py-2 rounded-lg text-[var(--text-xs)] font-semibold transition-colors',
            'text-white/40 hover:text-white/70 hover:bg-white/5',
            isCollapsed && 'justify-center'
          )}
          aria-expanded={moreOpen}
        >
          {isCollapsed ? <MoreHorizontal className="icon-sm" /> : t('nav.more')}
          {!isCollapsed && (
            <ChevronDown className={clsx('transition-transform icon-xs', !moreOpen && '-rotate-90')} />
          )}
        </button>

        {moreOpen && (
          <div className="mt-1 ml-2 pl-2 border-l border-white/10 space-y-0.5">
            {moreItems.map(item => (
              <NavItem
                key={item.to}
                item={item}
                collapsed={isCollapsed}
                hasLevel={hasLevel}
                t={t}
                pathname={pathname}
                onNavigate={onMobileClose}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/8 mb-1" />

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className={clsx(
            'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[var(--text-sm)] font-medium text-white/30 hover:text-red-300 hover:bg-red-900/20 transition-all w-full',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="group-hover:scale-110 transition-transform flex-shrink-0 icon-sm" />
          {!isCollapsed && t('nav.logout')}
        </button>
      </div>
    </aside>
    </>
  )
}

const NavItem = memo(function NavItem({ item, collapsed, hasLevel, t, pathname, onNavigate }) {
  const { to, icon: Icon, label, minLevel } = item
  const locked = !hasLevel(minLevel)
  const isActive = !locked && pathname === to

  const handleClick = (event) => {
    if (locked) {
      event.preventDefault()
      return
    }
    if (onNavigate) onNavigate()
  }

  return (
    <Link
      href={locked ? '#' : to}
      onClick={handleClick}
      title={collapsed ? t(label) : undefined}
      className={clsx(
        'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[var(--text-sm)] font-medium transition-all duration-150',
        collapsed && 'justify-center',
        locked
          ? 'text-white/15 cursor-not-allowed'
          : isActive
          ? 'bg-gradient-to-r from-brand-600/30 to-brand-500/10 text-white shadow-sm border-l-2 border-brand-400'
          : 'text-white/50 hover:text-white/85 hover:bg-white/7'
      )}
    >
      <>
        <div className={clsx('flex-shrink-0 transition-all duration-150',
          !locked && isActive && 'text-brand-400',
          !locked && !isActive && 'group-hover:scale-110 group-hover:text-brand-300')}>
          <Icon className="icon-sm" />
        </div>
        {!collapsed && (
          <>
            <span className="truncate flex-1">{t(label)}</span>
            {locked && <Lock className="opacity-30 flex-shrink-0 icon-xs" />}
          </>
        )}
      </>
    </Link>
  )
})
