'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'

function ScreenLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-[var(--text-xs)] text-brand-400 font-medium">Memuat...</p>
      </div>
    </div>
  )
}

const Dashboard = dynamic(() => import('../../../screens/Dashboard'), { ssr: false, loading: ScreenLoader })
const TransactionAnalytics = dynamic(() => import('../../../screens/TransactionAnalytics'), { ssr: false, loading: ScreenLoader })
const MarginAnalysis = dynamic(() => import('../../../screens/MarginAnalysis'), { ssr: false, loading: ScreenLoader })
const MenuPerformance = dynamic(() => import('../../../screens/MenuPerformance'), { ssr: false, loading: ScreenLoader })
const PeakHourAnalysis = dynamic(() => import('../../../screens/PeakHourAnalysis'), { ssr: false, loading: ScreenLoader })
const KPIDashboard = dynamic(() => import('../../../screens/KPIDashboard'), { ssr: false, loading: ScreenLoader })
const Reports = dynamic(() => import('../../../screens/Reports'), { ssr: false, loading: ScreenLoader })
const Settings = dynamic(() => import('../../../screens/Settings'), { ssr: false, loading: ScreenLoader })
const AdminPanel = dynamic(() => import('../../../screens/AdminPanel'), { ssr: false, loading: ScreenLoader })
const RevenueForecast = dynamic(() => import('../../../screens/RevenueForecast'), { ssr: false, loading: ScreenLoader })
const DiscountAnalysis = dynamic(() => import('../../../screens/DiscountAnalysis'), { ssr: false, loading: ScreenLoader })
const StaffPerformance = dynamic(() => import('../../../screens/StaffPerformance'), { ssr: false, loading: ScreenLoader })
const BasketAnalysis = dynamic(() => import('../../../screens/BasketAnalysis'), { ssr: false, loading: ScreenLoader })
const AnomalyDetection = dynamic(() => import('../../../screens/AnomalyDetection'), { ssr: false, loading: ScreenLoader })
const SalesComparison = dynamic(() => import('../../../screens/SalesComparison'), { ssr: false, loading: ScreenLoader })
const CustomerInsights = dynamic(() => import('../../../screens/CustomerInsights'), { ssr: false, loading: ScreenLoader })
const PaymentInsights = dynamic(() => import('../../../screens/PaymentInsights'), { ssr: false, loading: ScreenLoader })
const InventoryForecast = dynamic(() => import('../../../screens/InventoryForecast'), { ssr: false, loading: ScreenLoader })
const PromoSimulator = dynamic(() => import('../../../screens/PromoSimulator'), { ssr: false, loading: ScreenLoader })
const MenuOptimizer = dynamic(() => import('../../../screens/MenuOptimizer'), { ssr: false, loading: ScreenLoader })
const FeatureHub = dynamic(() => import('../../../screens/FeatureHub'), { ssr: false, loading: ScreenLoader })
const TemplateGuide = dynamic(() => import('../../../screens/TemplateGuide'), { ssr: false, loading: ScreenLoader })

const ROUTES = {
  dashboard: Dashboard,
  transactions: TransactionAnalytics,
  margin: MarginAnalysis,
  'menu-performance': MenuPerformance,
  'peak-hours': PeakHourAnalysis,
  kpi: KPIDashboard,
  reports: Reports,
  settings: Settings,
  admin: AdminPanel,
  forecast: RevenueForecast,
  discounts: DiscountAnalysis,
  staff: StaffPerformance,
  baskets: BasketAnalysis,
  anomalies: AnomalyDetection,
  comparison: SalesComparison,
  customers: CustomerInsights,
  payments: PaymentInsights,
  inventory: InventoryForecast,
  'promo-simulator': PromoSimulator,
  'menu-optimizer': MenuOptimizer,
  features: FeatureHub,
  'template-guide': TemplateGuide,
}

export default function AppRoutePage() {
  const { slug } = useParams()
  const router = useRouter()
  const { user, hydrated } = useAuth()

  const routeKey = Array.isArray(slug) ? slug[0] : slug
  const Screen = ROUTES[routeKey]

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!Screen) {
      router.replace('/')
    }
  }, [hydrated, user, Screen, router])

  if (!hydrated || !user || !Screen) return <ScreenLoader />

  return <Screen />
}
