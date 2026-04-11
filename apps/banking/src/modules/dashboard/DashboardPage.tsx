import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow, type Stat } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { RiskBadge, Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import { format } from 'date-fns'

// ── Mock data for demonstration ───────────────────────────────────────────────
const LOAN_TREND = [
  { month: 'Jan', loans: 8200, disbursed: 7800 },
  { month: 'Feb', loans: 9100, disbursed: 8600 },
  { month: 'Mar', loans: 9800, disbursed: 9200 },
  { month: 'Apr', loans: 10400, disbursed: 9800 },
  { month: 'May', loans: 11200, disbursed: 10600 },
  { month: 'Jun', loans: 11800, disbursed: 11100 },
  { month: 'Jul', loans: 12100, disbursed: 11500 },
  { month: 'Aug', loans: 12480, disbursed: 11900 },
]

const MODULE_STATUS = [
  { name: 'CBS',   status: 'LIVE' },
  { name: 'LOS',   status: 'UAT' },
  { name: 'AML',   status: 'LIVE' },
  { name: 'EWS',   status: 'UAT' },
  { name: 'DMS',   status: 'UAT' },
  { name: 'CMS',   status: 'DEV' },
  { name: 'IFRS9', status: 'UAT' },
  { name: 'ALM',   status: 'DEV' },
]

const ALERT_COLS: Column<Record<string, unknown>>[] = [
  { key: 'customer', header: 'Customer' },
  { key: 'module',   header: 'Module' },
  { key: 'risk',     header: 'Risk',    render: r => <RiskBadge level={r['risk'] as string} /> },
  { key: 'indicator',header: 'Indicator' },
  { key: 'amount',   header: 'Amount',  align: 'right' },
  { key: 'time',     header: 'Time',    render: r => <span className="font-mono text-xs text-ink-sub">{r['time'] as string}</span> },
]

const MOCK_ALERTS = [
  { customer: 'Tshering Dorji',   module: 'EWS',  risk: 'HIGH',   indicator: 'DPD 45 days',       amount: '₹12.4L', time: '09:14' },
  { customer: 'Karma Wangchuk',   module: 'AML',  risk: 'HIGH',   indicator: 'Large cash deposit', amount: '₹25.0L', time: '09:02' },
  { customer: 'Pema Seldon',      module: 'DMS',  risk: 'MEDIUM', indicator: 'KYC expiring 7d',    amount: '—',       time: '08:45' },
  { customer: 'Ugyen Tshering',   module: 'EWS',  risk: 'MEDIUM', indicator: 'Balance drop 32%',   amount: '₹8.2L',  time: '08:31' },
  { customer: 'Sonam Phuntsho',   module: 'CMS',  risk: 'LOW',    indicator: 'DPD 15 days',        amount: '₹4.8L',  time: '08:15' },
]

interface EWSMetrics { totalActive?: number; highRisk?: number; mediumRisk?: number; lowRisk?: number }
interface LoanMetrics { active?: number; npa?: number; totalOutstanding?: number | string; buckets?: unknown[] }
interface DMSMetrics { total?: number; pending?: number; expiring?: number; uploadedToday?: number }
interface AMLMetrics { transactionsMonitored?: number; suspicious?: number; strFiled?: number; ctrGenerated?: number; casesOpen?: number }

const unwrap = (r: any) => r?.body ?? r

function formatCrore(n: number | string | undefined): string {
  const v = Number(n ?? 0)
  if (!Number.isFinite(v)) return '₹0'
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)} Cr`
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(1)} L`
  return `₹${v.toLocaleString('en-IN')}`
}

export default function DashboardPage() {
  const { data: ewsRes } = useQuery({
    queryKey: ['ews-metrics'],
    queryFn: () => apiClient.get<EWSMetrics>('/ews/metrics').then(unwrap),
    refetchInterval: 30_000,
  })
  const { data: loanRes } = useQuery({
    queryKey: ['loan-metrics'],
    queryFn: () => apiClient.get<LoanMetrics>('/loans/metrics').then(unwrap),
    refetchInterval: 60_000,
  })
  const { data: amlRes } = useQuery({
    queryKey: ['aml-metrics'],
    queryFn: () => apiClient.get<AMLMetrics>('/aml/metrics').then(unwrap),
    refetchInterval: 60_000,
  })
  const { data: dmsRes } = useQuery({
    queryKey: ['dms-metrics'],
    queryFn: () => apiClient.get<DMSMetrics>('/dms/metrics').then(unwrap),
    refetchInterval: 60_000,
  })

  const ewsMetrics  = (ewsRes  ?? {}) as EWSMetrics
  const loanMetrics = (loanRes ?? {}) as LoanMetrics
  const amlMetrics  = (amlRes  ?? {}) as AMLMetrics
  const dmsMetrics  = (dmsRes  ?? {}) as DMSMetrics

  const user = useAuthStore(s => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const today = format(new Date(), 'MMMM d, yyyy')

  const stats: Stat[] = [
    {
      label: 'Active Loans',
      value: (loanMetrics.active ?? 0).toLocaleString('en-IN'),
      delta: formatCrore(loanMetrics.totalOutstanding),
      tone: 'success',
    },
    {
      label: 'NPA Portfolio',
      value: loanMetrics.npa ?? 0,
      delta: 'Stage 3 loans',
      tone: (loanMetrics.npa ?? 0) > 0 ? 'danger' : 'success',
    },
    {
      label: 'EWS Alerts',
      value: ewsMetrics.totalActive ?? 0,
      delta: `${ewsMetrics.highRisk ?? 0} high risk`,
      tone: (ewsMetrics.highRisk ?? 0) > 0 ? 'danger' : 'success',
    },
    {
      label: 'AML Flagged',
      value: amlMetrics.suspicious ?? 0,
      delta: `${amlMetrics.strFiled ?? 0} STR filed`,
      tone: (amlMetrics.suspicious ?? 0) > 10 ? 'warning' : 'success',
    },
    {
      label: 'Pending DMS',
      value: dmsMetrics.pending ?? 0,
      delta: `${dmsMetrics.expiring ?? 0} KYC expiring`,
      tone: (dmsMetrics.pending ?? 0) > 0 ? 'warning' : 'success',
    },
  ]

  return (
    <AppLayout title="Executive Dashboard" module="Data Networks Banking Platform">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ink">Good morning, {firstName}</h2>
        <p className="text-xs text-muted mt-1">
          Platform overview · {today} · React 18 + Express.js microservices
        </p>
      </div>

      {/* KPI row */}
      <StatRow stats={stats} className="mb-5" />

      {/* Mid row — 55% chart · 25% EWS risk · 20% module status */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <div className="col-span-12 lg:col-span-7">
          <Panel
            title="Loan portfolio trend — CBS data"
            subtitle="Express GET /api/v1/dwh/query · Recharts"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={LOAN_TREND} barSize={28} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: '#F7F6F2' }}
                  contentStyle={{ border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 12, color: '#2C2C2A' }}
                  formatter={(v: number) => [v.toLocaleString(), '']}
                />
                <Bar dataKey="loans" fill="#1565C0" radius={[4, 4, 0, 0]} name="Active loans" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <Panel title="EWS risk distribution" subtitle="AI PD model · 30s polling">
            <div className="space-y-4">
              {[
                { label: 'High risk',   count: ewsMetrics.highRisk   ?? 32,  pct: 10, tone: 'danger' as const,  bg: 'bg-danger-bg',  bar: 'bg-danger'  },
                { label: 'Medium risk', count: ewsMetrics.mediumRisk ?? 89,  pct: 27, tone: 'warning' as const, bg: 'bg-warning-bg', bar: 'bg-warning' },
                { label: 'Low risk',    count: ewsMetrics.lowRisk    ?? 214, pct: 64, tone: 'success' as const, bg: 'bg-success-bg', bar: 'bg-success' },
              ].map(r => (
                <div key={r.label} className={`${r.bg} rounded-lg px-3 py-2.5`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-ink-sub">{r.label}</span>
                    <span className="text-base font-bold text-ink tabular">{r.count}</span>
                  </div>
                  <div className="h-1 bg-white rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <Panel title="Module status">
            <div className="space-y-2.5">
              {MODULE_STATUS.map(m => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink">{m.name}</span>
                  <Badge
                    variant={m.status === 'LIVE' ? 'live' : m.status === 'UAT' ? 'uat' : 'dev'}
                    dot
                  >
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Alert feed */}
      <Panel
        title="Recent platform alerts"
        subtitle="React Query · Express /api/v1/ews/alerts"
        noPadding
      >
        <DataTable
          columns={ALERT_COLS}
          data={MOCK_ALERTS as unknown as Record<string, unknown>[]}
          emptyMessage="No alerts"
        />
      </Panel>
    </AppLayout>
  )
}
