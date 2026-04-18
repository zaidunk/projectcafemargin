'use client'

import AppLayout from '../components/Layout/AppLayout'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import {
  TrendingDown,
  Clock,
  UtensilsCrossed,
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
  Shield,
  ArrowUpRight,
  Lock,
} from 'lucide-react'

const FEATURE_GROUPS = [
  {
    key: 'core',
    titleKey: 'features.core',
    items: [
      {
        to: '/margin',
        icon: TrendingDown,
        label: 'nav.margin',
        minLevel: 1,
        desc: {
          id: 'Analisis margin dan HPP per item untuk menemukan kebocoran.',
          en: 'Margin and COGS analysis per item to find leakages.',
        },
      },
      {
        to: '/peak-hours',
        icon: Clock,
        label: 'nav.peak_hours',
        minLevel: 1,
        desc: {
          id: 'Lihat golden hours dan dead hours berdasarkan transaksi.',
          en: 'Find golden and dead hours based on transactions.',
        },
      },
      {
        to: '/menu-performance',
        icon: UtensilsCrossed,
        label: 'nav.menu_performance',
        minLevel: 1,
        desc: {
          id: 'Evaluasi performa menu dengan matrix engineering.',
          en: 'Evaluate menu performance with engineering matrix.',
        },
      },
      {
        to: '/kpi',
        icon: Target,
        label: 'nav.kpi',
        minLevel: 1,
        desc: {
          id: 'Pantau KPI dan action plan untuk 30 hari ke depan.',
          en: 'Track KPI and 30-day action plan progress.',
        },
      },
    ],
  },
  {
    key: 'growth',
    titleKey: 'features.growth',
    items: [
      {
        to: '/forecast',
        icon: TrendingUp,
        label: 'nav.forecast',
        minLevel: 1,
        desc: {
          id: 'Forecast revenue untuk perencanaan stok dan cashflow.',
          en: 'Forecast revenue for stock and cashflow planning.',
        },
      },
      {
        to: '/discounts',
        icon: Percent,
        label: 'nav.discounts',
        minLevel: 1,
        desc: {
          id: 'Analisis dampak diskon terhadap margin dan revenue.',
          en: 'Analyze discount impact on margin and revenue.',
        },
      },
      {
        to: '/anomalies',
        icon: AlertTriangle,
        label: 'nav.anomalies',
        minLevel: 1,
        desc: {
          id: 'Deteksi transaksi anomali yang perlu diperiksa.',
          en: 'Detect anomaly transactions that need review.',
        },
      },
      {
        to: '/comparison',
        icon: GitCompare,
        label: 'nav.comparison',
        minLevel: 1,
        desc: {
          id: 'Bandingkan performa penjualan antar periode.',
          en: 'Compare sales performance between periods.',
        },
      },
      {
        to: '/baskets',
        icon: ShoppingCart,
        label: 'nav.baskets',
        minLevel: 1,
        desc: {
          id: 'Temukan pola pembelian untuk strategi bundling.',
          en: 'Find purchase patterns for bundling strategy.',
        },
      },
      {
        to: '/menu-optimizer',
        icon: Sparkles,
        label: 'nav.menu_optimizer',
        minLevel: 1,
        desc: {
          id: 'Rekomendasi optimasi menu berdasarkan data.',
          en: 'Menu optimization recommendations based on data.',
        },
      },
    ],
  },
  {
    key: 'insights',
    titleKey: 'features.insights',
    items: [
      {
        to: '/customers',
        icon: Users,
        label: 'nav.customers',
        minLevel: 1,
        desc: {
          id: 'Segmentasi pelanggan dan pola kunjungan.',
          en: 'Customer segmentation and visit patterns.',
        },
      },
      {
        to: '/payments',
        icon: CreditCard,
        label: 'nav.payments',
        minLevel: 1,
        desc: {
          id: 'Analisis metode pembayaran dan kontribusi revenue.',
          en: 'Analyze payment methods and revenue contribution.',
        },
      },
      {
        to: '/staff',
        icon: Users,
        label: 'nav.staff',
        minLevel: 1,
        desc: {
          id: 'Pantau performa staff dan jam kerja efektif.',
          en: 'Monitor staff performance and effective hours.',
        },
      },
      {
        to: '/inventory',
        icon: Package,
        label: 'nav.inventory',
        minLevel: 1,
        desc: {
          id: 'Forecast kebutuhan bahan dan stok inventori.',
          en: 'Forecast inventory needs and stock planning.',
        },
      },
      {
        to: '/promo-simulator',
        icon: Calculator,
        label: 'nav.promo_simulator',
        minLevel: 1,
        desc: {
          id: 'Simulasikan promo untuk melihat dampaknya.',
          en: 'Simulate promos to evaluate impact.',
        },
      },
    ],
  },
  {
    key: 'admin',
    titleKey: 'features.admin',
    items: [
      {
        to: '/admin',
        icon: Shield,
        label: 'nav.admin',
        minLevel: 1,
        superadmin: true,
        desc: {
          id: 'Kelola cafe dan user untuk seluruh platform.',
          en: 'Manage cafes and users for the platform.',
        },
      },
    ],
  },
]

export default function FeatureHub() {
  const { t, i18n } = useTranslation()
  const { user, hasLevel } = useAuth()
  const lang = i18n.language?.startsWith('id') ? 'id' : 'en'

  return (
    <AppLayout title={t('nav.features')}>
      <div className="space-y-6 animate-fade-in">
        <div className="card">
          <h2 className="text-lg font-bold text-brand-800">{t('features.title')}</h2>
          <p className="text-sm text-brand-500 mt-1">{t('features.subtitle')}</p>
        </div>

        {FEATURE_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !item.superadmin || user?.role === 'superadmin')
          if (visibleItems.length === 0) return null

          return (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="section-title">{t(group.titleKey)}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleItems.map((item) => {
                  const allowed = hasLevel(item.minLevel) && (!item.superadmin || user?.role === 'superadmin')
                  return (
                    <FeatureCard
                      key={item.to}
                      item={item}
                      allowed={allowed}
                      lang={lang}
                      t={t}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </AppLayout>
  )
}

function FeatureCard({ item, allowed, lang, t }) {
  const Icon = item.icon
  const CardTag = allowed ? Link : 'div'
  const cardProps = allowed ? { href: item.to } : { role: 'button', 'aria-disabled': true }

  return (
    <CardTag
      {...cardProps}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-brand-100/80 bg-white p-4 shadow-card transition-all duration-200',
        allowed
          ? 'hover:-translate-y-0.5 hover:shadow-card-lg'
          : 'opacity-60 cursor-not-allowed'
      )}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-brand-100 blur-2xl" />
      </div>
      <div className="relative flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
          <Icon className="icon-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-800 truncate">{t(item.label)}</p>
          <p className="text-xs text-brand-500 mt-1">{item.desc[lang]}</p>
        </div>
        {allowed ? (
          <ArrowUpRight className="text-brand-300 group-hover:text-brand-600 transition-colors icon-sm" />
        ) : (
          <Lock className="text-brand-300 icon-sm" />
        )}
      </div>
      <div className="relative mt-3 flex items-center gap-2 flex-wrap">
        {item.minLevel > 1 && (
          <span className="badge badge-info">Level {item.minLevel}+</span>
        )}
        {item.superadmin && (
          <span className="badge badge-warning">Admin</span>
        )}
        {!allowed && (
          <span className="badge badge-danger">Locked</span>
        )}
      </div>
    </CardTag>
  )
}
