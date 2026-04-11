import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import apiClient from '@/api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STAGING_COLS: Column<Record<string, unknown>>[] = [
  { key: 'loanId',    header: 'Loan ID',  render: r => <span className="font-mono text-xs">{String(r['loanId'])}</span> },
  { key: 'customerId',header: 'Customer', render: r => <span className="text-xs">{String((r['customer'] as any)?.fullName ?? r['customerId'] ?? '—')}</span> },
  { key: 'stage',     header: 'Stage',    render: r => {
    const s = Number(r['stage'])
    return <Badge variant={s === 1 ? 'ok' : s === 2 ? 'warn' : 'risk'}>Stage {s}</Badge>
  } },
  { key: 'pdScore',   header: 'PD',       align: 'right', render: r => <span className="font-mono text-xs">{Number(r['pdScore']).toFixed(2)}</span> },
  { key: 'lgd',       header: 'LGD',      align: 'right', render: r => <span className="font-mono text-xs">{Number(r['lgd']).toFixed(2)}</span> },
  { key: 'ecl',       header: 'ECL',      align: 'right', render: r => (
    <span className="font-mono">₹{Number(r['ecl']).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
  ) },
  { key: 'batchId',   header: 'Batch',    render: r => <span className="font-mono text-xs text-muted">{String(r['batchId'])}</span> },
]

function toXLSX(rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const headers = ['loanId', 'customerId', 'stage', 'pdScore', 'lgd', 'ead', 'ecl', 'batchId']
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ifrs9-staging-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function IFRS9Page() {
  const qc = useQueryClient()
  const [banner, setBanner] = useState<string | null>(null)

  const { data: summary } = useQuery<{ stage1?: number; stage2?: number; stage3?: number; totalECL?: string | number; lastBatch?: string }>({
    queryKey: ['ifrs9-summary'],
    queryFn: () => apiClient.get('/ifrs9/summary').then((r: any) => r.body ?? r),
  })

  const { data: stagingResp, isLoading } = useQuery({
    queryKey: ['ifrs9-staging'],
    queryFn: () => apiClient.get('/ifrs9/staging?limit=50').then((r: any) => r),
  })

  // `paginated()` returns { body: { items, pagination } }. The interceptor unwraps res.data
  // so `stagingResp` is already the full envelope. Be defensive about shape.
  const rawBody = (stagingResp as any)?.body ?? stagingResp
  const items = (Array.isArray(rawBody) ? rawBody : rawBody?.items ?? []) as Record<string, unknown>[]

  const totalLoans = (summary?.stage1 ?? 0) + (summary?.stage2 ?? 0) + (summary?.stage3 ?? 0)
  const pct = (n?: number) => totalLoans ? ((n ?? 0) / totalLoans * 100) : 0

  const stageData = [
    { stage: 'Stage 1 — Performing',      loans: summary?.stage1 ?? 0, pct: pct(summary?.stage1) },
    { stage: 'Stage 2 — Underperforming', loans: summary?.stage2 ?? 0, pct: pct(summary?.stage2) },
    { stage: 'Stage 3 — Non-Performing',  loans: summary?.stage3 ?? 0, pct: pct(summary?.stage3) },
  ]

  // Synthesise monthly ECL trend from staging rows' batch IDs (grouped)
  const eclTrend = (() => {
    const grouped: Record<string, number> = {}
    items.forEach(r => {
      const batch = String(r['batchId'] ?? '—')
      grouped[batch] = (grouped[batch] ?? 0) + Number(r['ecl'] ?? 0)
    })
    const list = Object.entries(grouped).slice(-8).map(([batch, ecl]) => ({
      month: batch.slice(-4),
      ecl: Number((ecl / 10_000_000).toFixed(2)),
    }))
    return list.length ? list : [{ month: '—', ecl: 0 }]
  })()

  const runBatch = useMutation({
    mutationFn: () => apiClient.post('/ifrs9/calculate', {}).then((r: any) => r.body ?? r),
    onSuccess: (res: any) => {
      setBanner(`ECL batch ${res?.batchId ?? 'complete'} · ${res?.processed ?? 0} loans processed`)
      qc.invalidateQueries({ queryKey: ['ifrs9-summary'] })
      qc.invalidateQueries({ queryKey: ['ifrs9-staging'] })
    },
    onError: () => setBanner('ECL batch failed — check backend logs'),
  })

  return (
    <AppLayout title="IFRS 9 — ECL Provisioning" module="IFRS 9">
      <StatRow className="mb-5" stats={[
        { label: 'Stage 1 Loans', value: (summary?.stage1 ?? 0).toLocaleString(), delta: `${pct(summary?.stage1).toFixed(1)}%`, deltaType: 'up' },
        { label: 'Stage 2 Loans', value: (summary?.stage2 ?? 0).toLocaleString(), delta: `${pct(summary?.stage2).toFixed(1)}% watch`, deltaType: 'neutral' },
        { label: 'Stage 3 / NPA', value: (summary?.stage3 ?? 0).toLocaleString(), delta: `${pct(summary?.stage3).toFixed(1)}% NPA`, deltaType: 'down' },
        { label: 'Total ECL',     value: `₹${Number(summary?.totalECL ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, delta: 'Provisioned', deltaType: 'neutral' },
        { label: 'Last Batch',    value: summary?.lastBatch ?? '—', delta: 'Latest run', deltaType: 'neutral' },
      ]} />

      {banner && (
        <div className="mb-3 px-4 py-2.5 rounded-card text-xs font-medium bg-success-bg text-success">
          {banner}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Stage distribution */}
        <div className="col-span-5">
          <Panel title="Stage Distribution" subtitle="IFRS 9 Stage 1 / 2 / 3 classification">
            <div className="space-y-3">
              {stageData.map(s => (
                <div key={s.stage}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-sub truncate flex-1">{s.stage}</span>
                    <span className="text-xs font-semibold text-ink ml-2">{s.loans.toLocaleString()} loans</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.pct >= 90 ? 'bg-ok' : s.pct >= 7 ? 'bg-warn' : 'bg-risk'}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ECL trend */}
        <div className="col-span-7">
          <Panel title="ECL Movement Trend (₹ Cr)" subtitle="Aggregated by batch · GET /api/v1/ifrs9/staging">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={eclTrend} barSize={18} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4 }} />
                <Bar dataKey="ecl" fill="#2563EB" radius={[2, 2, 0, 0]} name="ECL (₹ Cr)" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>

      <Panel
        title="Loan Staging Detail"
        subtitle={`GET /api/v1/ifrs9/staging · Batch ${summary?.lastBatch ?? '—'}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => toXLSX(items)}>Export CSV</Button>
            <Button size="sm" onClick={() => runBatch.mutate()} loading={runBatch.isPending}>
              Run ECL Batch
            </Button>
          </div>
        }
      >
        <DataTable
          columns={STAGING_COLS}
          data={items}
          loading={isLoading}
          emptyMessage="No IFRS 9 staging data — run an ECL batch to populate"
        />
      </Panel>
    </AppLayout>
  )
}
