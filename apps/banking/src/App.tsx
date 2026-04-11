import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Auth
const LoginPage = lazy(() => import('@/pages/LoginPage'))

// Modules
const Dashboard = lazy(() => import('@/modules/dashboard/DashboardPage'))
const EWSPage    = lazy(() => import('@/modules/ews/EWSPage'))
const AMLPage    = lazy(() => import('@/modules/aml/AMLPage'))
const DMSPage    = lazy(() => import('@/modules/dms/DMSPage'))
const LOSPage    = lazy(() => import('@/modules/los/LOSPage'))
const CMSPage    = lazy(() => import('@/modules/cms/CMSPage'))
const IFRS9Page  = lazy(() => import('@/modules/ifrs9/IFRS9Page'))
const ReportsPage = lazy(() => import('@/modules/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore()
  return accessToken ? <>{children}</> : <Navigate to="/login" replace />
}

const Loading = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ews/*"     element={<ProtectedRoute><EWSPage /></ProtectedRoute>} />
        <Route path="/aml/*"     element={<ProtectedRoute><AMLPage /></ProtectedRoute>} />
        <Route path="/dms/*"     element={<ProtectedRoute><DMSPage /></ProtectedRoute>} />
        <Route path="/los/*"     element={<ProtectedRoute><LOSPage /></ProtectedRoute>} />
        <Route path="/cms/*"     element={<ProtectedRoute><CMSPage /></ProtectedRoute>} />
        <Route path="/ifrs9/*"   element={<ProtectedRoute><IFRS9Page /></ProtectedRoute>} />
        <Route path="/reports/*" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings/*"element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
