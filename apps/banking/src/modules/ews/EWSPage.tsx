import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import apiClient from '@/api/client'
import type { EWSAlert } from '@apex/shared'

type AlertRow = EWSAlert & Record<string, unknown>

const COLUMNS: Column<AlertRow>[] = [
  { key: 'customerId',   header: 'Customer',   render: r => (
    <span className="font-mono text-xs font-medium text-ink">
      {String(r['customerName'] ?? r['customerId']).slice(0, 12)}
    </span>
  ) },
  { key: 'pdScore',      header: 'PD Score',   render: r => {
    const pd = Number(r['pdScore'])
    const color = pd >= 0.7 ? 'text-danger' : pd >= 0.45 ? 'text-warning' : 'text-success'
    return <span className={`font-mono font-semibold ${color}`}>{pd.toFixed(2)}</span>
  } },
  { key: 'indicators',   header: 'Indicators', render: r => {
    const arr = r['indicators'] as string[]
    return <span className="text-xs text-ink-sub">{arr?.[0] ?? '—'}{arr?.length > 1 ? ` +${arr.length - 1}` : ''}</span>
  } },
  { key: 'riskLevel',    header: 'Severity',   render: r => <RiskBadge level={String(r['riskLevel'])} /> },
  { key: 'dpd',          header: 'DPD',        align: 'right', render: r => <span className="font-mono text-ink">{String(r['dpd'])}</span> },
  { key: 'action',       header: '', render: () => (
    <button className="text-[11px] font-medium text-brand-blue bg-brand-skyLight px-2.5 py-1 rounded hover:bg-[#d0e3fb] transition-colors">
      View →
    </button>
  ) },
]

function RiskProfile({ alert }: { alert: AlertRow }) {
  const qc = useQueryClient()
  const resolve = useMutation({
    mutationFn: (data: { resolution: string }) =>
      apiClient.put(`/ews/alerts/${alert.id}/resolve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ews-alerts'] })
      qc.invalidateQueries({ queryKey: ['ews-metrics'] })
    },
  })

  const pd = Number(alert.pdScore)
  const initials = String(alert.customerName ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-brand-skyLight flex items-center justify-center flex-shrink-0">
          <span className="text-brand-blue font-semibold text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{String(alert.customerName ?? 'Customer')}</p>
          <p className="text-xs font-mono text-muted truncate">Customer {String(alert.customerId).slice(0, 12)}</p>
          <p className="text-[11px] text-muted mt-0.5">Retail banking</p>
        </div>
        <RiskBadge level={String(alert.riskLevel)} />
      </div>

      {/* Risk indicators */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-ink-sub uppercase tracking-wider mb-2">Risk indicators</p>
        <div className="space-y-2">
          {(alert.indicators as string[] | undefined)?.slice(0, 5).map((ind, i) => (
            <div key={i} className="bg-danger-bg rounded-md px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-ink">{ind.replace(/_/g, ' ')}</span>
              <span className="text-[10px] text-danger">Triggered</span>
            </div>
          ))}
        </div>
      </div>

      {/* PD Score gauge */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-ink-sub uppercase tracking-wider mb-2">PD Score — AI prediction model</p>
        <div className="bg-surface-alt rounded-md p-3">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[11px] text-muted">Probability of default</span>
            <span className={`text-xl font-bold font-mono tabular ${pd >= 0.7 ? 'text-danger' : pd >= 0.45 ? 'text-warning' : 'text-success'}`}>
              {pd.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pd >= 0.7 ? 'bg-danger' : pd >= 0.45 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${Math.min(pd * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scenario simulation */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-ink-sub uppercase tracking-wider mb-2">Scenario simulation</p>
        <div className="space-y-1.5 text-[11px]">
          {[
            ['GDP drop -2%',        `${Math.min(pd + 0.12, 1).toFixed(2)}`],
            ['Rate hike +100 bps',  `${Math.min(pd + 0.08, 1).toFixed(2)}`],
            ['Recovery scenario',   `${Math.max(pd - 0.15, 0).toFixed(2)}`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between px-3 py-1.5 bg-surface-alt rounded">
              <span className="text-ink-sub">{label}</span>
              <span className="font-mono font-semibold text-ink">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {(alert.status === 'OPEN' || alert.status === 'ASSIGNED') ? (
        <div className="flex gap-2 pt-4 border-t border-divider">
          <Button
            variant="danger" size="md" className="flex-1"
            onClick={() => resolve.mutate({ resolution: 'Assigned to collection' })}
            loading={resolve.isPending}
          >
            Assign to collection
          </Button>
          <Button
            variant="secondary" size="md" className="flex-1"
            onClick={() => resolve.mutate({ resolution: 'Added to watchlist' })}
            loading={resolve.isPending}
          >
            Add to watchlist
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted pt-4 border-t border-divider">
          Resolved by {String(alert.resolvedBy ?? '—')}
        </p>
      )}
    </div>
  )
}

export default function EWSPage() {
  const [selected, setSelected] = useState<AlertRow | null>(null)
  const [filter, setFilter] = useState<string>('')

  const { data: metrics } = useQuery({
    queryKey: ['ews-metrics'],
    queryFn: () => apiClient.get('/ews/metrics').then((r: any) => r.body ?? r),
    refetchInterval: 30_000,
  })

  const m = metrics as { totalActive?: number; highRisk?: number; avgPDScore?: string; resolvedToday?: number } | undefined

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['ews-alerts', filter],
    queryFn: () => apiClient.get(`/ews/alerts${filter ? `?riskLevel=${filter}` : ''}`).then((r: any) => r.body ?? r),
    refetchInterval: 30_000,
  })

  const items = (alerts as { items?: AlertRow[] } | undefined)?.items ?? []

  return (
    <AppLayout title="EWS alert monitor" module="EWS — AI Risk Monitoring">
      <StatRow className="mb-5" stats={[
        { label: 'Total Alerts',   value: m?.totalActive    ?? 335, delta: 'Active',        tone: 'danger'  },
        { label: 'High Risk',      value: m?.highRisk       ?? 32,  delta: 'Customers',     tone: 'danger'  },
        { label: 'Avg PD Score',   value: m?.avgPDScore     ?? '0.68', delta: 'Risk index',  tone: 'warning' },
        { label: 'Auto Cases',     value: 28,                       delta: 'Linked to CMS', tone: 'success' },
        { label: 'Resolved Today', value: m?.resolvedToday  ?? 14,  delta: 'Today',         tone: 'success' },
      ]} />

      <div className="grid grid-cols-12 gap-3">
        {/* Alert table (55%) */}
        <div className="col-span-12 lg:col-span-7">
          <Panel
            title="Alert list — sorted by severity"
            subtitle="GET /api/v1/ews/alerts · 30s polling"
            actions={
              <div className="flex gap-1">
                {['', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
                  <button
                    key={f || 'all'}
                    onClick={() => setFilter(f)}
                    className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                      filter === f
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'text-ink-sub border-divider hover:border-border'
                    }`}
                  >
                    {f || 'All'}
                  </button>
                ))}
              </div>
            }
            noPadding
          >
            <DataTable
              columns={COLUMNS}
              data={items}
              onRowClick={(r) => setSelected(r as AlertRow)}
              loading={isLoading}
              emptyMessage="No EWS alerts"
            />
          </Panel>
        </div>

        {/* Risk profile panel (45%) */}
        <div className="col-span-12 lg:col-span-5">
          <Panel title={selected ? 'Customer risk profile' : 'Customer risk profile'}>
            {selected ? (
              <RiskProfile alert={selected} />
            ) : (
              <div className="py-16 text-center">
                <p className="text-xs text-muted">Select a customer to view their risk profile</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppLayout>
  )
}
