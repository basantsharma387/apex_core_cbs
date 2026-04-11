import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, AlertCircle } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { portalClient } from '@/api/client'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface Repayment {
  id?: string
  dueDate: string
  paidDate?: string | null
  installmentAmount?: number
  amount?: number
  principalPortion?: number
  interestPortion?: number
  status: 'PAID' | 'DUE' | 'OVERDUE' | 'UPCOMING' | string
}

interface LoanDetail {
  loanId?: string
  id?: string
  productType?: string
  principalAmount?: number
  outstandingBalance?: number
  tenure?: number
  interestRate?: number
  disbursedAt?: string
  status?: string
  dpd?: number
  repayments?: Repayment[]
}

function formatINR(n?: number | string) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN')}`
}

export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery<LoanDetail>({
    queryKey: ['portal-loan', loanId],
    queryFn: () => portalClient.get(`/portal/loans/${loanId}`).then((r: any) => r.body ?? r),
    enabled: !!loanId,
  })

  if (isLoading) {
    return (
      <PageLayout title="Loan details">
        <div className="space-y-3">
          <div className="h-24 bg-surface border border-border rounded-xl animate-pulse" />
          <div className="h-48 bg-surface border border-border rounded-xl animate-pulse" />
        </div>
      </PageLayout>
    )
  }

  if (isError || !data) {
    return (
      <PageLayout title="Loan details">
        <div className="portal-card p-10 text-center">
          <AlertCircle className="mx-auto text-risk mb-3" size={28} />
          <p className="text-sm text-sub">Unable to load loan {loanId}.</p>
          <button onClick={() => navigate('/loans')} className="btn-secondary mt-4">
            Back to loans
          </button>
        </div>
      </PageLayout>
    )
  }

  const repayments = data.repayments ?? []
  const paid = repayments.filter(r => r.status === 'PAID')
  const upcoming = repayments.filter(r => r.status !== 'PAID').slice(0, 6)
  const progress = repayments.length > 0 ? (paid.length / repayments.length) * 100 : 0

  return (
    <PageLayout title={`Loan ${data.loanId ?? data.id}`}>
      <Link to="/loans" className="inline-flex items-center gap-1 text-xs text-sub hover:text-ink mb-4">
        <ArrowLeft size={12} /> Back to my loans
      </Link>

      <div className="portal-card p-5 shadow-card mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">{data.productType ?? 'Loan'}</p>
            <p className="text-2xl font-semibold text-ink mt-1 tabular">
              {formatINR(data.outstandingBalance)}
            </p>
            <p className="text-xs text-sub mt-1">Outstanding · Principal {formatINR(data.principalAmount)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={clsx(
              'pill',
              data.status === 'ACTIVE' || data.status === 'DISBURSED' ? 'pill-success' : 'pill-warning'
            )}>
              {data.status ?? 'ACTIVE'}
            </span>
            <button className="btn-secondary h-8 px-3 text-xs" onClick={() => window.print()}>
              <Download size={12} /> Download schedule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-divider text-xs">
          <div>
            <p className="text-muted mb-1">Tenure</p>
            <p className="font-semibold text-ink">{data.tenure ?? '—'} months</p>
          </div>
          <div>
            <p className="text-muted mb-1">Interest rate</p>
            <p className="font-semibold text-ink">{data.interestRate ? `${data.interestRate}%` : '—'}</p>
          </div>
          <div>
            <p className="text-muted mb-1">Disbursed</p>
            <p className="font-semibold text-ink">
              {data.disbursedAt ? format(new Date(data.disbursedAt), 'dd MMM yyyy') : '—'}
            </p>
          </div>
          <div>
            <p className="text-muted mb-1">DPD</p>
            <p className={clsx('font-semibold tabular', Number(data.dpd) > 0 ? 'text-risk' : 'text-ok')}>
              {Number(data.dpd ?? 0)} days
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-sub">Repayment progress</span>
            <span className="text-ink font-medium tabular">
              {paid.length} / {repayments.length} installments
            </span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-ok" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="portal-card overflow-hidden shadow-card">
        <div className="px-5 py-3 border-b border-divider">
          <h3 className="text-sm font-semibold text-ink">Upcoming repayments</h3>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted px-5 py-6 text-center">No upcoming repayments.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface border-b border-divider">
                {['Due date', 'Status', 'Principal', 'Interest', 'Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {upcoming.map((r, i) => {
                const total = Number(r.installmentAmount ?? r.amount ?? 0)
                return (
                  <tr key={r.id ?? i}>
                    <td className="px-4 py-3 text-ink">
                      {format(new Date(r.dueDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'pill',
                        r.status === 'OVERDUE' ? 'pill-danger' :
                        r.status === 'DUE' ? 'pill-warning' : 'pill-neutral'
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-right text-sub">
                      {formatINR(r.principalPortion)}
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-right text-sub">
                      {formatINR(r.interestPortion)}
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-right font-semibold text-ink">
                      {formatINR(total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  )
}
