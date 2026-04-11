import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, AlertCircle, CheckCircle, Clock, FileText, CreditCard } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { usePortalAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format } from 'date-fns'

// Mock loan data
const MOCK_LOANS = [
  {
    loanId: 'LN-00124', productType: 'Home Loan',
    outstandingBalance: '₹24,80,000', emiAmount: '₹22,400',
    nextDueDate: '2026-05-01', dpd: 0, status: 'ACTIVE',
  },
  {
    loanId: 'LN-00218', productType: 'Vehicle Loan',
    outstandingBalance: '₹6,40,000', emiAmount: '₹12,800',
    nextDueDate: '2026-05-05', dpd: 0, status: 'ACTIVE',
  },
]

const MOCK_DOCS = [
  { type: 'National ID', status: 'APPROVED',  expiresAt: '2028-12-31' },
  { type: 'Address Proof', status: 'APPROVED', expiresAt: '2027-06-30' },
  { type: 'Income Proof',  status: 'PENDING_REVIEW', expiresAt: null  },
]

function LoanCard({ loan }: { loan: typeof MOCK_LOANS[0] }) {
  const due = new Date(loan.nextDueDate)
  const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000)
  const isUrgent = daysLeft <= 7

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-sub mb-1">{loan.productType}</p>
          <p className="text-xs font-mono text-muted">{loan.loanId}</p>
        </div>
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded',
          loan.status === 'ACTIVE' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'
        )}>
          {loan.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-ink mb-1">{loan.outstandingBalance}</p>
      <p className="text-xs text-sub mb-4">Outstanding balance</p>

      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-border text-xs">
        <div>
          <p className="text-muted mb-0.5">Monthly EMI</p>
          <p className="font-semibold text-ink">{loan.emiAmount}</p>
        </div>
        <div>
          <p className="text-muted mb-0.5">Next due</p>
          <p className={clsx('font-semibold', isUrgent ? 'text-warn' : 'text-ink')}>
            {format(due, 'dd MMM yyyy')}
            {isUrgent && ` · ${daysLeft}d`}
          </p>
        </div>
        <div>
          <p className="text-muted mb-0.5">DPD</p>
          <p className={clsx('font-semibold', loan.dpd > 0 ? 'text-risk' : 'text-ok')}>{loan.dpd} days</p>
        </div>
      </div>

      <Link to={`/loans/${loan.loanId}`}>
        <button className="mt-4 w-full h-9 border border-border rounded-lg text-sm text-sub hover:text-ink hover:border-borderMed transition-colors flex items-center justify-center gap-2">
          View details <ArrowUpRight size={14} />
        </button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = usePortalAuthStore()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <PageLayout>
      {/* Welcome */}
      <div className="mb-6">
        <p className="text-sm text-sub">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-xl font-semibold text-ink mt-1">{greeting}, {user?.name?.split(' ')[0]}</h1>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 p-4 bg-surface border border-border rounded-xl">
        {[
          { label: 'Active Loans',    value: '2',        icon: CreditCard,   color: 'text-action' },
          { label: 'Total Outstanding', value: '₹31.2L',  icon: ArrowUpRight, color: 'text-ink'   },
          { label: 'Next EMI',        value: '₹22,400',  icon: Clock,        color: 'text-warn'   },
          { label: 'KYC Status',      value: 'Verified', icon: CheckCircle,  color: 'text-ok'     },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center flex-shrink-0">
                <Icon size={15} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-muted">{s.label}</p>
                <p className="text-sm font-semibold text-ink">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Loans */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink">My Loans</h2>
            <Link to="/loans" className="text-sm text-action hover:underline">View all →</Link>
          </div>
          <div className="space-y-4">
            {MOCK_LOANS.map(l => <LoanCard key={l.loanId} loan={l} />)}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Documents */}
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">My Documents</h3>
              <Link to="/documents" className="text-xs text-action hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {MOCK_DOCS.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-muted" />
                    <span className="text-xs text-ink">{d.type}</span>
                  </div>
                  <span className={clsx('text-xs', d.status === 'APPROVED' ? 'text-ok' : 'text-warn')}>
                    {d.status === 'APPROVED' ? 'Active' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/documents">
              <button className="mt-3 w-full h-8 border border-dashed border-border rounded-lg text-xs text-sub hover:border-action hover:text-action transition-colors">
                + Upload document
              </button>
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Apply for a new loan', path: '/apply',     highlight: true  },
                { label: 'Download statement',   path: '/loans',     highlight: false },
                { label: 'Update contact info',  path: '/profile',   highlight: false },
                { label: 'Contact support',      path: '/support',   highlight: false },
              ].map(a => (
                <Link key={a.path} to={a.path}>
                  <div className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                    a.highlight ? 'bg-action text-white' : 'text-sub hover:bg-surface'
                  )}>
                    {a.label}
                    <ArrowUpRight size={13} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
