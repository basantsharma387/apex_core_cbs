import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, ChevronDown } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { portalClient } from '@/api/client'
import { clsx } from 'clsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface TxnRow {
  id: string
  date: string
  description: string
  debit?: number
  credit?: number
  balance: number
  type: string
}

const TYPE_CLASS: Record<string, string> = {
  CREDIT:   'text-ok',
  DEBIT:    'text-risk',
  EMI:      'text-warn',
  TRANSFER: 'text-action',
  PENDING:  'text-muted',
}

function TxnTypePill({ type }: { type: string }) {
  return (
    <span className={clsx('text-[10px] font-semibold uppercase tracking-wide', TYPE_CLASS[type] ?? 'text-sub')}>
      {type}
    </span>
  )
}

export default function StatementsPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { data, isLoading } = useQuery({
    queryKey: ['statements', year, month],
    queryFn: () =>
      portalClient
        .get(`/portal/statements?year=${year}&month=${month + 1}`)
        .then((r: any) => r.body ?? []),
  })

  const txns: TxnRow[] = Array.isArray(data) ? data : []
  const totalCredit = txns.reduce((s, t) => s + (t.credit ?? 0), 0)
  const totalDebit  = txns.reduce((s, t) => s + (t.debit  ?? 0), 0)

  return (
    <PageLayout title="Account Statement">
      <div className="space-y-5">
        {/* Period selector */}
        <div className="portal-card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-card">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 h-9 border border-border rounded-lg text-xs text-ink bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-action/20"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 h-9 border border-border rounded-lg text-xs text-ink bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-action/20"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          <button className="btn-secondary h-9 px-3 text-xs">
            <Download size={12} />
            Download PDF
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: 'Total credits', value: totalCredit, color: 'text-ok' },
            { label: 'Total debits',  value: totalDebit,  color: 'text-risk' },
            { label: 'Transactions',  value: txns.length, color: 'text-ink', noFormat: true },
          ] as const).map(s => (
            <div key={s.label} className="portal-card px-4 py-4 text-center shadow-card">
              <p className="text-[10px] text-muted uppercase tracking-wide">{s.label}</p>
              <p className={clsx('text-lg font-semibold mt-1 tabular', s.color)}>
                {s.noFormat ? s.value : `₹${Number(s.value).toLocaleString('en-IN')}`}
              </p>
            </div>
          ))}
        </div>

        {/* Transaction list */}
        <div className="portal-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface border-b border-divider">
                  {['Date', 'Description', 'Type', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-muted uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-surface rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

                {!isLoading && txns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                      No transactions for this period
                    </td>
                  </tr>
                )}

                {txns.map(t => (
                  <tr key={t.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sub whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-ink font-medium max-w-[220px] truncate">{t.description}</td>
                    <td className="px-4 py-3"><TxnTypePill type={t.type} /></td>
                    <td className="px-4 py-3 font-mono tabular text-right text-risk">
                      {t.debit ? t.debit.toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-right text-ok">
                      {t.credit ? t.credit.toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono tabular text-right font-semibold text-ink">
                      {t.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
