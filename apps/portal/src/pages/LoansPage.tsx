import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, AlertCircle, Plus } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { portalClient } from '@/api/client'
import { clsx } from 'clsx'

const STATUS_CLASS: Record<string, string> = {
  ACTIVE:       'pill pill-success',
  DISBURSED:    'pill pill-info',
  NPA:          'pill pill-danger',
  CLOSED:       'pill pill-neutral',
  RESTRUCTURED: 'pill pill-warning',
}

function StatusPill({ status }: { status: string }) {
  return <span className={STATUS_CLASS[status] ?? 'pill pill-neutral'}>{status}</span>
}

function LoanCard({ loan, onClick }: { loan: any; onClick: () => void }) {
  const due = loan.repayments?.[0]
  const dpd = Number(loan.dpd ?? 0)

  return (
    <button
      onClick={onClick}
      className="w-full text-left portal-card p-5 shadow-card hover:border-borderMed transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide font-medium text-muted">
            {loan.productType ?? 'Personal Loan'}
          </p>
          <p className="text-lg font-semibold text-ink tabular mt-1">
            ₹{Number(loan.outstandingBalance ?? loan.principalAmount ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-sub mt-1 font-mono">Loan ID: {loan.loanId ?? loan.id}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusPill status={loan.status} />
          <ChevronRight size={16} className="text-muted group-hover:text-sub transition-colors" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-divider flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">Tenure</p>
          <p className="text-[13px] font-medium text-ink mt-1">{loan.tenure ?? '—'} months</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">DPD</p>
          <p className={clsx('text-[13px] font-medium mt-1 tabular', dpd > 0 ? 'text-risk' : 'text-ink')}>
            {dpd} days
          </p>
        </div>
        {due && (
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted">Next EMI</p>
            <p className="text-[13px] font-medium text-ink mt-1 tabular truncate">
              ₹{Number(due.installmentAmount ?? due.amount ?? 0).toLocaleString('en-IN')}
              {' · '}
              {new Date(due.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        )}
      </div>

      {dpd > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-risk">
          <AlertCircle size={12} />
          Payment overdue — please contact your branch
        </div>
      )}
    </button>
  )
}

export default function LoansPage() {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => portalClient.get('/portal/loans/my').then((r: any) => r.body ?? []),
  })

  const loans = Array.isArray(data) ? data : []

  return (
    <PageLayout title="My Loans">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Active loans</h2>
            <p className="text-xs text-sub mt-1">View loan details and upcoming EMI schedules</p>
          </div>
          <button onClick={() => navigate('/apply')} className="btn-primary w-full sm:w-auto">
            <Plus size={14} />
            Apply for a loan
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-36 bg-surface border border-divider rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="portal-card p-10 text-center">
            <p className="text-sm text-sub">Unable to load loans. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && loans.length === 0 && (
          <div className="portal-card border-dashed py-16 text-center">
            <p className="text-sm text-sub">No active loans found.</p>
            <button
              onClick={() => navigate('/apply')}
              className="btn-secondary mt-4"
            >
              Apply for your first loan
            </button>
          </div>
        )}

        <div className="space-y-3">
          {loans.map((loan: any) => (
            <LoanCard key={loan.id} loan={loan} onClick={() => navigate(`/loans/${loan.id}`)} />
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
