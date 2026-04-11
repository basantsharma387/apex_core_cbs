import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STAGE_DATA = [
  { stage: 'Stage 1 — Performing',       loans: 11240, ecl: '₹0.8 Cr',  pct: 90.1 },
  { stage: 'Stage 2 — Underperforming',  loans: 892,   ecl: '₹2.4 Cr',  pct: 7.1  },
  { stage: 'Stage 3 — Non-Performing',   loans: 348,   ecl: '₹12.8 Cr', pct: 2.8  },
]

const ECL_TREND = [
  { month: 'Jan', ecl: 12.4 },
  { month: 'Feb', ecl: 13.1 },
  { month: 'Mar', ecl: 12.8 },
  { month: 'Apr', ecl: 14.2 },
  { month: 'May', ecl: 15.6 },
  { month: 'Jun', ecl: 14.9 },
  { month: 'Jul', ecl: 15.2 },
  { month: 'Aug', ecl: 16.0 },
]

const STAGING_COLS: Column<Record<string, unknown>>[] = [
  { key: 'loanId',    header: 'Loan ID',  render: r => <span className="font-mono text-xs">{String(r['loanId'])}</span> },
  { key: 'customer',  header: 'Customer' },
  { key: 'stage',     header: 'Stage',    render: r => {
    const s = Number(r['stage'])
    return <Badge variant={s === 1 ? 'ok' : s === 2 ? 'warn' : 'risk'}>Stage {s}</Badge>
  }},
  { key: 'pdScore',   header: 'PD',       align: 'right', render: r => <span className="font-mono text-xs">{String(r['pdScore'])}</span> },
  { key: 'lgd',       header: 'LGD',      align: 'right', render: r => <span className="font-mono text-xs">{String(r['lgd'])}</span> },
  { key: 'ecl',       header: 'ECL',      align: 'right', render: r => <span className="font-mono">{String(r['ecl'])}</span> },
  { key: 'batchId',   header: 'Batch',    render: r => <span className="font-mono text-xs text-muted">{String(r['batchId'])}</span> },
]

const MOCK_STAGING = [
  { loanId: 'LN-00124', customer: 'Tshering Dorji',  stage: 3, pdScore: '0.78', lgd: '0.45', ecl: '₹8.2L',  batchId: 'B-2026-04' },
  { loanId: 'LN-00218', customer: 'Karma Wangchuk',  stage: 2, pdScore: '0.52', lgd: '0.35', ecl: '₹3.4L',  batchId: 'B-2026-04' },
  { loanId: 'LN-00341', customer: 'Pema Choden',     stage: 1, pdScore: '0.12', lgd: '0.25', ecl: '₹0.8L',  batchId: 'B-2026-04' },
  { loanId: 'LN-00457', customer: 'Rinzin Wangmo',   stage: 2, pdScore: '0.48', lgd: '0.30', ecl: '₹2.1L',  batchId: 'B-2026-04' },
  { loanId: 'LN-00502', customer: 'Ugyen Dorji',     stage: 3, pdScore: '0.85', lgd: '0.50', ecl: '₹14.8L', batchId: 'B-2026-04' },
]

export default function IFRS9Page() {
  return (
    <AppLayout title="IFRS 9 — ECL Provisioning" module="IFRS 9">
      <StatRow className="mb-5" stats={[
        { label: 'Stage 1 Loans',    value: '11,240', delta: '90.1% of portfolio',  deltaType: 'up'      },
        { label: 'Stage 2 Loans',    value: '892',    delta: '7.1% watch list',     deltaType: 'neutral' },
        { label: 'Stage 3 / NPA',    value: '348',    delta: '2.8% non-performing', deltaType: 'down'    },
        { label: 'Total ECL',        value: '₹16 Cr', delta: 'Provisioned amount',  deltaType: 'neutral' },
        { label: 'Last Batch',       value: 'Apr 2026',delta: 'Monthly run',        deltaType: 'neutral' },
      ]} />

      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Stage distribution */}
        <div className="col-span-5">
          <Panel title="Stage Distribution" subtitle="IFRS 9 Stage 1 / 2 / 3 classification">
            <div className="space-y-3">
              {STAGE_DATA.map(s => (
                <div key={s.stage}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-sub truncate flex-1">{s.stage}</span>
                    <span className="text-xs font-semibold text-ink ml-2">{s.loans.toLocaleString()} loans · {s.ecl}</span>
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
          <Panel title="ECL Movement Trend (₹ Cr)" subtitle="Monthly ECL recalculation — BullMQ scheduled job">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ECL_TREND} barSize={18} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
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

      {/* Staging table */}
      <Panel
        title="Loan Staging Detail"
        subtitle="GET /api/v1/ifrs9/staging · Batch B-2026-04"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">Export XLSX</Button>
            <Button size="sm">Run ECL Batch</Button>
          </div>
        }
      >
        <DataTable columns={STAGING_COLS} data={MOCK_STAGING as unknown as Record<string, unknown>[]} />
      </Panel>
    </AppLayout>
  )
}
