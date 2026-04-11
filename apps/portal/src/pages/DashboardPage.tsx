import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CheckCircle, Clock, FileText, CreditCard } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { usePortalAuthStore } from '@/store/authStore'
import { portalClient } from '@/api/client'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface PortalLoan {
  loanId?: string
  id?: string
  productType?: string
  outstandingBalance?: number | string
  principalAmount?: number | string
  emiAmount?: number | string
  nextDueDate?: string
  dpd?: number
  status?: string
  repayments?: { dueDate: string; installmentAmount?: number; amount?: number }[]
}

interface PortalDoc {
  docType?: string
  type?: string
  status?: string
  expiresAt?: string | null
}

function formatINR(n: number | string | undefined) {
  const v = Number(n ?? 0)
  return `₹${v.toLocaleString('en-IN')}`
}

function compactINR(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function LoanCard({ loan }: { loan: PortalLoan }) {
  const outstanding = Number(loan.outstandingBalance ?? loan.principalAmount ?? 0)
  const nextRepayment = loan.repayments?.[0]
  const due = loan.nextDueDate
    ? new Date(loan.nextDueDate)
    : nextRepayment?.dueDate
      ? new Date(nextRepayment.dueDate)
      : null
  const daysLeft = due ? Math.ceil((due.getTime() - Date.now()) / 86400000) : null
  const isUrgent = daysLeft !== null && daysLeft <= 7
  const id = loan.loanId ?? loan.id ?? '—'
  const dpd = Number(loan.dpd ?? 0)

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-sub mb-1">{loan.productType ?? 'Loan'}</p>
          <p className="text-xs font-mono text-muted">{id}</p>
        </div>
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded',
          loan.status === 'ACTIVE' || loan.status === 'DISBURSED' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'
        )}>
          {loan.status ?? 'ACTIVE'}
        </span>
      </div>

      <p className="text-2xl font-bold text-ink mb-1">{formatINR(outstanding)}</p>
      <p className="text-xs text-sub mb-4">Outstanding balance</p>

      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-border text-xs">
        <div>
          <p className="text-muted mb-0.5">Monthly EMI</p>
          <p className="font-semibold text-ink">
            {formatINR(loan.emiAmount ?? nextRepayment?.installmentAmount ?? nextRepayment?.amount ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-muted mb-0.5">Next due</p>
          <p className={clsx('font-semibold', isUrgent ? 'text-warn' : 'text-ink')}>
            {due ? format(due, 'dd MMM yyyy') : '—'}
            {daysLeft !== null && isUrgent && ` · ${daysLeft}d`}
          </p>
        </div>
        <div>
          <p className="text-muted mb-0.5">DPD</p>
          <p className={clsx('font-semibold', dpd > 0 ? 'text-risk' : 'text-ok')}>{dpd} days</p>
        </div>
      </div>

      <Link to={`/loans/${id}`}>
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

  const loansQ = useQuery({
    queryKey: ['portal-dashboard-loans'],
    queryFn: () => portalClient.get('/portal/loans/my').then((r: any) => r.body ?? []),
  })
  const docsQ = useQuery({
    queryKey: ['portal-dashboard-docs'],
    queryFn: () => portalClient.get('/portal/dms/my-docs').then((r: any) => r.body ?? []),
  })

  const loans: PortalLoan[] = Array.isArray(loansQ.data) ? loansQ.data : []
  const docs: PortalDoc[] = Array.isArray(docsQ.data) ? docsQ.data : []

  const activeCount = loans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED').length
  const totalOutstanding = loans.reduce((s, l) => s + Number(l.outstandingBalance ?? l.principalAmount ?? 0), 0)
  const nextEmi = loans
    .map(l => Number(l.emiAmount ?? l.repayments?.[0]?.installmentAmount ?? l.repayments?.[0]?.amount ?? 0))
    .filter(v => v > 0)
    .sort((a, b) => b - a)[0] ?? 0
  const kycVerified = docs.length > 0 && docs.every(d => d.status === 'APPROVED')

  return (
    <PageLayout>
      <div className="mb-6">
        <p className="text-sm text-sub">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-xl font-semibold text-ink mt-1">{greeting}, {user?.name?.split(' ')[0]}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 p-4 bg-surface border border-border rounded-xl">
        {[
          { label: 'Active Loans',      value: String(activeCount),              icon: CreditCard,   color: 'text-action' },
          { label: 'Total Outstanding', value: compactINR(totalOutstanding),     icon: ArrowUpRight, color: 'text-ink'    },
          { label: 'Next EMI',          value: nextEmi ? compactINR(nextEmi) : '—', icon: Clock,     color: 'text-warn'   },
          { label: 'KYC Status',        value: kycVerified ? 'Verified' : docs.length ? 'Pending' : '—', icon: CheckCircle, color: kycVerified ? 'text-ok' : 'text-warn' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink">My Loans</h2>
            <Link to="/loans" className="text-sm text-action hover:underline">View all →</Link>
          </div>
          <div className="space-y-4">
            {loansQ.isLoading && [1, 2].map(i => (
              <div key={i} className="h-36 bg-surface border border-border rounded-xl animate-pulse" />
            ))}
            {!loansQ.isLoading && loans.length === 0 && (
              <div className="bg-white border border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm text-sub mb-3">You have no active loans.</p>
                <Link to="/apply" className="btn-primary inline-flex">Apply for a loan</Link>
              </div>
            )}
            {loans.slice(0, 3).map(l => <LoanCard key={l.loanId ?? l.id} loan={l} />)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">My Documents</h3>
              <Link to="/documents" className="text-xs text-action hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {docsQ.isLoading && [1, 2, 3].map(i => (
                <div key={i} className="h-5 bg-surface rounded animate-pulse" />
              ))}
              {!docsQ.isLoading && docs.length === 0 && (
                <p className="text-xs text-muted py-2">No documents yet.</p>
              )}
              {docs.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-muted" />
                    <span className="text-xs text-ink">
                      {(d.docType ?? d.type ?? 'Document').replace(/_/g, ' ')}
                    </span>
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

          <div className="bg-white border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Apply for a new loan', path: '/apply',      highlight: true  },
                { label: 'Download statement',   path: '/statements', highlight: false },
                { label: 'Update contact info',  path: '/profile',    highlight: false },
                { label: 'View documents',       path: '/documents',  highlight: false },
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
