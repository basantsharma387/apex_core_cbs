import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import apiClient from '@/api/client'

interface AMLAlert {
  id: string
  txnId: string
  customerId: string
  amount: string | number
  currency: string
  country: string
  txnType: string
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  riskScore: number
  reasons: string[]
  status: string
  customer?: { fullName?: string }
  createdAt: string
}

const unwrap = (r: any) => r?.body ?? r

const TXN_COLS: Column<Record<string, unknown>>[] = [
  { key: 'txnId',     header: 'Txn ID',  render: r => <span className="font-mono text-xs font-medium text-ink">{String(r['txnId']).slice(0, 10)}</span> },
  { key: 'amount',    header: 'Amount',  align: 'right', render: r => <span className="font-mono tabular text-ink">₹{Number(r['amount']).toLocaleString('en-IN')}</span> },
  { key: 'country',   header: 'Country', render: r => <span className="text-ink-sub">{String(r['country'])}</span> },
  { key: 'txnType',   header: 'Type',    render: r => <span className="text-xs text-ink-sub">{String(r['txnType']).replace(/_/g, ' ')}</span> },
  { key: 'riskLevel', header: 'Risk',    render: r => <RiskBadge level={String(r['riskLevel'])} /> },
  { key: 'reasons',   header: 'Reason',  render: r => (
    <span className="text-xs text-ink-sub">
      {(r['reasons'] as string[] | undefined)?.[0]?.replace(/_/g, ' ') ?? '—'}
    </span>
  ) },
  { key: 'status',    header: 'Status',  render: r => <StatusBadge status={String(r['status'])} /> },
]

// ── STR Create dialog ────────────────────────────────────────────────────────
const STRFormSchema = z.object({
  description: z.string().min(50, 'Description must be at least 50 characters'),
})
type STRForm = z.infer<typeof STRFormSchema>

function AlertDetailDrawer({
  alert, onClose,
}: { alert: AMLAlert; onClose: () => void }) {
  const qc = useQueryClient()
  const [showSTR, setShowSTR] = useState(false)

  const updateStatusMut = useMutation({
    mutationFn: (status: 'UNDER_REVIEW' | 'CLEARED') =>
      apiClient.patch(`/aml/alerts/${alert.id}/status`, { status }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aml-alerts'] })
      qc.invalidateQueries({ queryKey: ['aml-metrics'] })
      onClose()
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<STRForm>({
    resolver: zodResolver(STRFormSchema),
  })

  const strMut = useMutation({
    mutationFn: (data: STRForm) =>
      apiClient.post('/aml/str', {
        customerId: alert.customerId,
        alertId: alert.id,
        amount: String(alert.amount),
        description: data.description,
      }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aml-alerts'] })
      qc.invalidateQueries({ queryKey: ['aml-metrics'] })
      qc.invalidateQueries({ queryKey: ['aml-str-reports'] })
      onClose()
    },
  })

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <header className="h-14 px-5 flex items-center justify-between border-b border-divider">
          <div>
            <h3 className="text-sm font-semibold text-ink">Alert details</h3>
            <p className="text-[11px] font-mono text-muted">{alert.txnId}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-alt text-ink-sub">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary */}
          <div className="bg-danger-bg border border-danger/20 rounded-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-danger font-semibold">Risk score</p>
                <p className="text-3xl font-bold tabular text-danger">{alert.riskScore}</p>
              </div>
              <RiskBadge level={alert.riskLevel} />
            </div>
            <p className="text-xs text-ink-sub">
              Automated AML rule engine flagged this transaction based on {alert.reasons.length} trigger{alert.reasons.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Details */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Transaction</p>
            <dl className="divide-y divide-divider text-xs border border-divider rounded-lg">
              {[
                ['Customer',  alert.customer?.fullName ?? alert.customerId.slice(0, 12)],
                ['Amount',    `${alert.currency} ${Number(alert.amount).toLocaleString('en-IN')}`],
                ['Country',   alert.country],
                ['Type',      alert.txnType.replace(/_/g, ' ')],
                ['Status',    <StatusBadge key="s" status={alert.status} />],
                ['Created',   new Date(alert.createdAt).toLocaleString('en-IN')],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-center px-3 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-ink text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Reasons */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Trigger reasons</p>
            <ul className="space-y-1.5">
              {alert.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 flex-shrink-0" />
                  {r.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>

          {/* STR form */}
          {showSTR && (
            <form
              onSubmit={handleSubmit(d => strMut.mutate(d))}
              className="border border-divider rounded-lg p-4 space-y-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">File STR — description</p>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Describe the suspicious activity (min 50 characters)"
                className="w-full text-xs text-ink border border-divider rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none"
              />
              {errors.description && <p className="text-[11px] text-danger">{errors.description.message}</p>}
              {strMut.isError && <p className="text-[11px] text-danger">Failed to file STR. {(strMut.error as Error)?.message}</p>}
              <div className="flex gap-2">
                <Button type="submit" variant="danger" size="sm" loading={strMut.isPending}>
                  File STR report
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowSTR(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Actions footer */}
        {!showSTR && alert.status === 'OPEN' && (
          <footer className="p-5 border-t border-divider space-y-2">
            <Button
              variant="warning" size="md" className="w-full"
              onClick={() => updateStatusMut.mutate('UNDER_REVIEW')}
              loading={updateStatusMut.isPending}
            >
              Mark under review
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="success" size="md"
                onClick={() => updateStatusMut.mutate('CLEARED')}
                loading={updateStatusMut.isPending}
              >
                Clear
              </Button>
              <Button
                variant="danger" size="md"
                onClick={() => setShowSTR(true)}
              >
                File STR
              </Button>
            </div>
          </footer>
        )}
      </aside>
    </>
  )
}

// ── Case stats side panel ───────────────────────────────────────────────────
function CaseStatsPanel({ items }: { items: AMLAlert[] }) {
  const counts = items.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})
  const rows: { label: string; count: number; bar: string; text: string }[] = [
    { label: 'Open',          count: counts['OPEN']          ?? 0, bar: 'bg-danger',     text: 'text-danger'     },
    { label: 'Under Review',  count: counts['UNDER_REVIEW']  ?? 0, bar: 'bg-warning',    text: 'text-warning'    },
    { label: 'Cleared',       count: counts['CLEARED']       ?? 0, bar: 'bg-success',    text: 'text-success'    },
    { label: 'STR Filed',     count: counts['FILED_STR']     ?? 0, bar: 'bg-brand-blue', text: 'text-brand-blue' },
    { label: 'CTR Filed',     count: counts['FILED_CTR']     ?? 0, bar: 'bg-brand-blue', text: 'text-brand-blue' },
  ]
  const max = Math.max(1, ...rows.map(r => r.count))

  return (
    <div className="space-y-3">
      {rows.map(s => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11px] font-medium text-ink-sub">{s.label}</span>
            <span className={`text-base font-bold tabular ${s.text}`}>{s.count}</span>
          </div>
          <div className="h-1.5 bg-divider rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${(s.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AMLPage() {
  const [selected, setSelected] = useState<AMLAlert | null>(null)

  const { data: metrics } = useQuery({
    queryKey: ['aml-metrics'],
    queryFn: () => apiClient.get('/aml/metrics').then(unwrap),
    refetchInterval: 60_000,
  })
  const m = metrics as {
    transactionsMonitored?: number; suspicious?: number; strFiled?: number
    ctrGenerated?: number; casesOpen?: number
  } | undefined

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['aml-alerts'],
    queryFn: () => apiClient.get('/aml/alerts').then(unwrap),
    refetchInterval: 60_000,
  })
  const items = ((alerts as { items?: AMLAlert[] } | undefined)?.items ?? [])

  return (
    <AppLayout title="AML compliance monitor" module="AML — Anti-Money Laundering">
      <StatRow className="mb-5" stats={[
        { label: 'Txn Monitored', value: (m?.transactionsMonitored ?? 0).toLocaleString('en-IN'), delta: 'Today',        tone: 'blue'    },
        { label: 'Suspicious',    value: m?.suspicious   ?? 0, delta: 'Unreviewed',   tone: 'danger'  },
        { label: 'STR Filed',     value: m?.strFiled     ?? 0, delta: 'This month',   tone: 'warning' },
        { label: 'CTR Generated', value: m?.ctrGenerated ?? 0, delta: 'Auto-filed',   tone: 'success' },
        { label: 'Cases Open',    value: m?.casesOpen    ?? 0, delta: 'Pending review', tone: 'warning' },
      ]} />

      <div className="grid grid-cols-12 gap-3 mb-4">
        <div className="col-span-12 lg:col-span-9">
          <Panel
            title="Suspicious transaction alerts"
            subtitle="Click a row to review · PATCH /aml/alerts/:id/status · POST /aml/str"
            noPadding
          >
            <DataTable
              columns={TXN_COLS}
              data={items as unknown as Record<string, unknown>[]}
              loading={isLoading}
              onRowClick={(r) => setSelected(r as unknown as AMLAlert)}
              emptyMessage="No flagged transactions"
            />
          </Panel>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <Panel title="Case statistics">
            <CaseStatsPanel items={items} />
          </Panel>
        </div>
      </div>

      {selected && (
        <AlertDetailDrawer alert={selected} onClose={() => setSelected(null)} />
      )}
    </AppLayout>
  )
}
