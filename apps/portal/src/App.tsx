import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { usePortalAuthStore } from '@/store/authStore'

const LoginPage       = lazy(() => import('./pages/LoginPage'))
const DashboardPage   = lazy(() => import('./pages/DashboardPage'))
const LoansPage       = lazy(() => import('./pages/LoansPage'))
const LoanDetailPage  = lazy(() => import('./pages/LoanDetailPage'))
const ApplyLoanPage   = lazy(() => import('./pages/ApplyLoanPage'))
const DocumentsPage    = lazy(() => import('./pages/DocumentsPage'))
const ProfilePage      = lazy(() => import('./pages/ProfilePage'))
const StatementsPage   = lazy(() => import('./pages/StatementsPage'))

function RequireAuth({ children }: { children: React.ReactElement }) {
  const isAuthenticated = usePortalAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-5 h-5 border-2 border-action border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/loans" element={<RequireAuth><LoansPage /></RequireAuth>} />
          <Route path="/loans/:loanId" element={<RequireAuth><LoanDetailPage /></RequireAuth>} />
          <Route path="/apply" element={<RequireAuth><ApplyLoanPage /></RequireAuth>} />
          <Route path="/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
          <Route path="/profile"    element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/statements" element={<RequireAuth><StatementsPage /></RequireAuth>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
