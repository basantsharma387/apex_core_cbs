import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import apiClient from '@/api/client'
import { MapPin, PhoneCall, MessageSquare, Scale } from 'lucide-react'

const DPD_DATA = [
  { bucket: '0–30',  count: 428, fill: '#1D9E75' },  // success
  { bucket: '31–60', count: 89,  fill: '#EF9F27' },  // warning
  { bucket: '61–90', count: 34,  fill: '#E24B4A' },  // danger
  { bucket: '90+ NPA', count: 21, fill: '#B91C1C' }, // deep danger
]

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
    <span className="font-mono tabular text-ink">
      ₹{Number(r['outstandingAmount']).toLocaleString('en-IN')}
    </span>
  ) },
  { key: 'nba', header: 'NBA', render: r => {
    const nba = String(r['nba'] ?? 'PHONE_CALL')
    const variant = nba === 'FIELD_VISIT' ? 'danger'
      : nba === 'LEGAL_NOTICE' ? 'danger'
      : nba === 'PHONE_CALL' ? 'warning'
      : nba === 'EMAIL' ? 'info'
      : 'success'
    return <Badge variant={variant as any}>{nba.replace(/_/g, ' ')}</Badge>
  } },
  { key: 'assignedAgentName', header: 'Assigned to', render: r => (
    <span className="text-ink-sub text-xs">
      {String(r['assignedAgentName'] ?? 'Agent ' + Math.floor(Math.random() * 5 + 1).toString().padStart(2, '0'))}
    </span>
  ) },
  { key: 'action', header: '', render: () => (
    <button className="text-[11px] font-medium text-brand-blue bg-brand-skyLight px-2.5 py-1 rounded hover:bg-[#d0e3fb]">
      View →
    </button>
  ) },
]

const NBA_CARDS = [
  { label: 'Field visit',  icon: MapPin,        bg: 'bg-danger-bg',      fg: 'text-danger',  count: 14 },
  { label: 'Call',         icon: PhoneCall,     bg: 'bg-warning-bg',     fg: 'text-warning', count: 47 },
  { label: 'SMS / Email',  icon: MessageSquare, bg: 'bg-brand-skyLight', fg: 'text-brand-blue', count: 62 },
  { label: 'Legal notice', icon: Scale,         bg: 'bg-danger-bg',      fg: 'text-danger',  count: 5  },
]

export default function CMSPage() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['cms-cases'],
    queryFn: () => apiClient.get('/collection/cases').then((r: any) => r.body ?? r),
    refetchInterval: 30_000,
  })

  const items = ((cases as { items?: Record<string, unknown>[] } | undefined)?.items ?? []) as Record<string, unknown>[]

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
              {NBA_CARDS.map(n => {
                const Icon = n.icon
                return (
                  <div key={n.label} className={`${n.bg} rounded-lg p-2 text-center`}>
                    <Icon size={14} className={`mx-auto mb-1 ${n.fg}`} />
                    <p className={`text-base font-bold ${n.fg} tabular leading-none`}>{n.count}</p>
                    <p className="text-[9px] text-ink-sub leading-tight mt-0.5">{n.label}</p>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>

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
