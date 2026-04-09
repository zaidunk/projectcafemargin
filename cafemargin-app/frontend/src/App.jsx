import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Eager load login & dashboard (first screens)
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Lazy load everything else for faster initial load
const TransactionAnalytics = lazy(() => import('./pages/TransactionAnalytics'))
const MarginAnalysis = lazy(() => import('./pages/MarginAnalysis'))
const MenuPerformance = lazy(() => import('./pages/MenuPerformance'))
const PeakHourAnalysis = lazy(() => import('./pages/PeakHourAnalysis'))
const KPIDashboard = lazy(() => import('./pages/KPIDashboard'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const RevenueForecast = lazy(() => import('./pages/RevenueForecast'))
const DiscountAnalysis = lazy(() => import('./pages/DiscountAnalysis'))
const StaffPerformance = lazy(() => import('./pages/StaffPerformance'))
const BasketAnalysis = lazy(() => import('./pages/BasketAnalysis'))
const AnomalyDetection = lazy(() => import('./pages/AnomalyDetection'))
const SalesComparison = lazy(() => import('./pages/SalesComparison'))
const CustomerInsights = lazy(() => import('./pages/CustomerInsights'))
const PaymentInsights = lazy(() => import('./pages/PaymentInsights'))
const InventoryForecast = lazy(() => import('./pages/InventoryForecast'))
const PromoSimulator = lazy(() => import('./pages/PromoSimulator'))
const MenuOptimizer = lazy(() => import('./pages/MenuOptimizer'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-xs text-brand-400 font-medium">Memuat...</p>
      </div>
    </div>
  )
}

function PrivateRoute({ children, minLevel = 1 }) {
  const { user, hasLevel } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!hasLevel(minLevel)) return <Navigate to="/dashboard" replace />
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><TransactionAnalytics /></PrivateRoute>} />
      <Route path="/margin" element={<PrivateRoute><MarginAnalysis /></PrivateRoute>} />
      <Route path="/menu-performance" element={<PrivateRoute><MenuPerformance /></PrivateRoute>} />
      <Route path="/peak-hours" element={<PrivateRoute><PeakHourAnalysis /></PrivateRoute>} />
      <Route path="/kpi" element={<PrivateRoute><KPIDashboard /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      <Route path="/forecast" element={<PrivateRoute><RevenueForecast /></PrivateRoute>} />
      <Route path="/discounts" element={<PrivateRoute><DiscountAnalysis /></PrivateRoute>} />
      <Route path="/staff" element={<PrivateRoute><StaffPerformance /></PrivateRoute>} />
      <Route path="/baskets" element={<PrivateRoute><BasketAnalysis /></PrivateRoute>} />
      <Route path="/anomalies" element={<PrivateRoute><AnomalyDetection /></PrivateRoute>} />
      <Route path="/comparison" element={<PrivateRoute><SalesComparison /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><CustomerInsights /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><PaymentInsights /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><InventoryForecast /></PrivateRoute>} />
      <Route path="/promo-simulator" element={<PrivateRoute><PromoSimulator /></PrivateRoute>} />
      <Route path="/menu-optimizer" element={<PrivateRoute><MenuOptimizer /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
