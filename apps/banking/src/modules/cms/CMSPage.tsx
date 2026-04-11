import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import apiClient from '@/api/client'
import { MapPin, PhoneCall, MessageSquare, Scale, X } from 'lucide-react'

const DPD_DATA = [
  { bucket: '0–30',  count: 428, fill: '#1D9E75' },  // success
  { bucket: '31–60', count: 89,  fill: '#EF9F27' },  // warning
  { bucket: '61–90', count: 34,  fill: '#E24B4A' },  // danger
  { bucket: '90+ NPA', count: 21, fill: '#B91C1C' }, // deep danger
]

type NbaKey = 'FIELD_VISIT' | 'PHONE_CALL' | 'EMAIL_SMS' | 'LEGAL_NOTICE'

const NBA_META: { key: NbaKey; label: string; icon: any; bg: string; fg: string; match: (v: string) => boolean }[] = [
  { key: 'FIELD_VISIT',  label: 'Field visit',  icon: MapPin,        bg: 'bg-danger-bg',      fg: 'text-danger',     match: v => v === 'FIELD_VISIT' },
  { key: 'PHONE_CALL',   label: 'Call',         icon: PhoneCall,     bg: 'bg-warning-bg',     fg: 'text-warning',    match: v => v === 'PHONE_CALL' || v === 'CALL' },
  { key: 'EMAIL_SMS',    label: 'SMS / Email',  icon: MessageSquare, bg: 'bg-brand-skyLight', fg: 'text-brand-blue', match: v => v === 'EMAIL' || v === 'SMS' || v === 'EMAIL_SMS' },
  { key: 'LEGAL_NOTICE', label: 'Legal notice', icon: Scale,         bg: 'bg-danger-bg',      fg: 'text-danger',     match: v => v === 'LEGAL_NOTICE' || v === 'LEGAL' },
]

export default function CMSPage() {
  const qc = useQueryClient()
  const [nbaFilter, setNbaFilter] = useState<NbaKey | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)

  const { data: cases, isLoading } = useQuery({
    queryKey: ['cms-cases'],
    queryFn: () => apiClient.get('/collection/cases').then((r: any) => r.body ?? r),
    refetchInterval: 30_000,
  })

  const allItems = ((cases as { items?: Record<string, unknown>[] } | undefined)?.items ?? []) as Record<string, unknown>[]

  const items = useMemo(() => {
    if (!nbaFilter) return allItems
    const meta = NBA_META.find(m => m.key === nbaFilter)!
    return allItems.filter(r => meta.match(String(r['nba'] ?? '')))
  }, [allItems, nbaFilter])

  const nbaCounts = useMemo(() => {
    const counts: Record<NbaKey, number> = { FIELD_VISIT: 0, PHONE_CALL: 0, EMAIL_SMS: 0, LEGAL_NOTICE: 0 }
    allItems.forEach(r => {
      const v = String(r['nba'] ?? '')
      NBA_META.forEach(m => { if (m.match(v)) counts[m.key]++ })
    })
    return counts
  }, [allItems])

  const assignAgent = useMutation({
    mutationFn: ({ caseId, action }: { caseId: string; action: string }) =>
      apiClient.post(`/collection/case/${caseId}/action`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-cases'] }),
  })

  const CASE_COLS: Column<Record<string, unknown>>[] = [
    { key: 'customerName', header: 'Customer', render: r => {
      const name = String((r['customer'] as { fullName?: string } | undefined)?.fullName ?? r['customerName'] ?? '—')
      return <span className="font-medium text-ink">{name}</span>
    } },
    { key: 'loanId',  header: 'Loan ID', render: r => <span className="font-mono text-xs text-ink-sub">{String(r['loanId'] ?? r['caseId'])}</span> },
    { key: 'dpd',     header: 'DPD', align: 'right', render: r => {
      const d = Number(r['dpd'])
      return <span className={`font-mono font-semibold ${d >= 90 ? 'text-danger' : d >= 60 ? 'text-warning' : 'text-success'}`}>{d}</span>
    } },
    { key: 'outstandingAmount', header: 'Amount', align: 'right', render: r => (
      <span className="font-mono tabular text-ink">₹{Number(r['outstandingAmount']).toLocaleString('en-IN')}</span>
    ) },
    { key: 'nba', header: 'NBA', render: r => {
      const nba = String(r['nba'] ?? 'PHONE_CALL')
      const variant = nba === 'FIELD_VISIT' || nba.startsWith('LEGAL') ? 'danger'
        : nba === 'PHONE_CALL' || nba === 'CALL' ? 'warning'
        : nba === 'EMAIL' || nba === 'SMS' || nba === 'EMAIL_SMS' ? 'info'
        : 'success'
      return <Badge variant={variant as any}>{nba.replace(/_/g, ' ')}</Badge>
    } },
    { key: 'assignedAgentName', header: 'Assigned to', render: r => (
      <span className="text-ink-sub text-xs">{String(r['assignedAgentName'] ?? '—')}</span>
    ) },
    { key: 'action', header: '', render: r => (
      <button
        onClick={() => setDetail(r)}
        className="text-[11px] font-medium text-brand-blue bg-brand-skyLight px-2.5 py-1 rounded hover:bg-[#d0e3fb]"
      >
        View →
      </button>
    ) },
  ]

  return (
    <AppLayout title="Collection dashboard" module="CMS — Loan Recovery & NPA Control">
      <StatRow className="mb-5" stats={[
        { label: 'Total Overdue',  value: '₹18.4 Cr', delta: 'Active portfolio',    tone: 'danger'  },
        { label: 'NPA %',          value: '3.2%',     delta: 'Below 5% target',      tone: 'success' },
        { label: 'Recovery Rate',  value: '68%',      delta: '▲ 4% MoM',             tone: 'success' },
        { label: 'Field Agents',   value: '24',       delta: 'Active today',         tone: 'blue'    },
        { label: 'Cases Assigned', value: '156',      delta: 'Open cases',           tone: 'warning' },
      ]} />

      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* DPD bucket chart (35%) */}
        <div className="col-span-12 lg:col-span-4">
          <Panel title="DPD bucket distribution" subtitle="POST /api/v1/collection/case">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DPD_DATA} barSize={40} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F7F6F2' }}
                  contentStyle={{ fontSize: 12, border: '1px solid #D3D1C7', borderRadius: 8, color: '#2C2C2A' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {DPD_DATA.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Case list (55%) */}
        <div className="col-span-12 lg:col-span-7">
          <Panel
            title="Case list"
            subtitle="AI-NBA (next best action) · POST /api/v1/collection/case"
            noPadding
          >
            <DataTable
              columns={CASE_COLS}
              data={items}
              loading={isLoading}
              emptyMessage="No open collection cases"
            />
          </Panel>
        </div>

        {/* NBA action panel (10%) */}
        <div className="col-span-12 lg:col-span-1">
          <Panel title="NBA" noPadding>
            <div className="p-2 space-y-2">
              {NBA_META.map(n => {
                const Icon = n.icon
                const active = nbaFilter === n.key
                return (
                  <button
                    key={n.key}
                    onClick={() => setNbaFilter(active ? null : n.key)}
                    className={`w-full ${n.bg} rounded-lg p-2 text-center transition-all ${
                      active ? 'ring-2 ring-brand-blue scale-[1.02]' : 'hover:opacity-80'
                    }`}
                  >
                    <Icon size={14} className={`mx-auto mb-1 ${n.fg}`} />
                    <p className={`text-base font-bold ${n.fg} tabular leading-none`}>{nbaCounts[n.key]}</p>
                    <p className="text-[9px] text-ink-sub leading-tight mt-0.5">{n.label}</p>
                  </button>
                )
              })}
              {nbaFilter && (
                <button
                  onClick={() => setNbaFilter(null)}
                  className="w-full text-[10px] text-muted hover:text-ink py-1 flex items-center justify-center gap-1"
                >
                  <X size={10} /> Clear
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Case detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={() => setDetail(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className="w-[420px] bg-white h-full shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">Collection case</p>
                <p className="text-base font-semibold text-ink mt-1 font-mono">
                  {String(detail['loanId'] ?? detail['caseId'])}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-divider">
                <span className="text-muted">Customer</span>
                <span className="text-ink font-medium">
                  {String((detail['customer'] as any)?.fullName ?? detail['customerName'] ?? '—')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-divider">
                <span className="text-muted">Outstanding</span>
                <span className="text-ink font-mono tabular font-semibold">
                  ₹{Number(detail['outstandingAmount']).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-divider">
                <span className="text-muted">DPD</span>
                <span className="text-danger font-semibold">{Number(detail['dpd'])} days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-divider">
                <span className="text-muted">Suggested NBA</span>
                <Badge variant="warning">{String(detail['nba'] ?? 'PHONE_CALL').replace(/_/g, ' ')}</Badge>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-muted mb-2">Actions</p>
              {['PHONE_CALL', 'FIELD_VISIT', 'EMAIL_SMS', 'LEGAL_NOTICE'].map(a => (
                <Button
                  key={a}
                  variant={a === 'LEGAL_NOTICE' ? 'danger' : 'secondary'}
                  className="w-full justify-start"
                  loading={assignAgent.isPending}
                  onClick={() => assignAgent.mutate({
                    caseId: String(detail['caseId'] ?? detail['loanId']),
                    action: a,
                  })}
                >
                  Trigger: {a.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent map placeholder */}
      <Panel
        title="Field agent map view"
        subtitle="GPS field tracking · React Leaflet · Express /api/v1/collection/agent"
      >
        <div className="h-44 bg-brand-skyLight/30 rounded-card border border-dashed border-brand-blue/20 flex items-center justify-center relative overflow-hidden">
          {/* Mock agent pins */}
          <div className="absolute top-[25%] left-[15%] bg-brand-blue text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-card">Agent 01</div>
          <div className="absolute top-[45%] left-[35%] bg-brand-blue text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-card">Agent 03</div>
          <div className="absolute top-[30%] right-[28%] bg-brand-blue text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-card">Agent 07</div>
          <div className="absolute bottom-[20%] right-[15%] bg-brand-blue text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-card">Agent 11</div>
          <div className="absolute bottom-[30%] left-[45%] bg-brand-blue text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-card">Agent 05</div>
          <div className="text-center">
            <p className="text-xs text-ink-sub">24 field agents tracked live · GPS updates every 30s</p>
          </div>
        </div>
      </Panel>
    </AppLayout>
  )
}
