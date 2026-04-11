import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import apiClient from '@/api/client'

interface ALMSummary {
  lcr: number
  nsfr: number
  cumulativeGap: number
  totalAssets: number
  totalLiabilities: number
  netInterestIncome: number
  asOf: string
}

interface LiquidityGapRow {
  bucket: string
  inflows: number
  outflows: number
  gap: number
  cumulativeGap: number
}

interface IRRBBScenario {
  shockBps: number
  shockLabel: string
  baselineNII: number
  shockedNII: number
  deltaNII: number
  deltaEVE: number
  pctOfCapital: number
}

interface FTPPoint {
  tenor: string
  tenorMonths: number
  baseRate: number
  liquiditySpread: number
  creditSpread: number
  ftpRate: number
}

function compactINR(n: number) {
  if (Math.abs(n) >= 10_000_000_000) return `₹${(n / 10_000_000_000).toFixed(1)}KCr`
  if (Math.abs(n) >= 10_000_000)     return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (Math.abs(n) >= 100_000)        return `₹${(n / 100_000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

const GAP_COLS: Column<Record<string, unknown>>[] = [
  { key: 'bucket',       header: 'Tenor bucket', render: r => <span className="text-xs font-semibold text-ink">{String(r['bucket'])}</span> },
  { key: 'inflows',      header: 'Inflows',     align: 'right', render: r => <span className="font-mono text-xs">{compactINR(Number(r['inflows']))}</span> },
  { key: 'outflows',     header: 'Outflows',    align: 'right', render: r => <span className="font-mono text-xs">{compactINR(Number(r['outflows']))}</span> },
  { key: 'gap',          header: 'Net gap',     align: 'right', render: r => {
    const v = Number(r['gap'])
    return <span className={`font-mono text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-danger'}`}>{compactINR(v)}</span>
  } },
  { key: 'cumulativeGap',header: 'Cumulative',  align: 'right', render: r => {
    const v = Number(r['cumulativeGap'])
    return <span className={`font-mono text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-danger'}`}>{compactINR(v)}</span>
  } },
]

const IRRBB_COLS: Column<Record<string, unknown>>[] = [
  { key: 'shockLabel', header: 'Rate shock', render: r => {
    const bps = Number(r['shockBps'])
    const tone = bps === 0 ? 'info' : bps > 0 ? 'warn' : 'ok'
    return <Badge variant={tone as any}>{String(r['shockLabel'])}</Badge>
  } },
  { key: 'baselineNII', header: 'Baseline NII', align: 'right', render: r => <span className="font-mono text-xs">{compactINR(Number(r['baselineNII']))}</span> },
  { key: 'shockedNII',  header: 'Shocked NII',  align: 'right', render: r => <span className="font-mono text-xs">{compactINR(Number(r['shockedNII']))}</span> },
  { key: 'deltaNII',    header: 'Δ NII',       align: 'right', render: r => {
    const v = Number(r['deltaNII'])
    return <span className={`font-mono text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-danger'}`}>{compactINR(v)}</span>
  } },
  { key: 'deltaEVE',    header: 'Δ EVE',       align: 'right', render: r => {
    const v = Number(r['deltaEVE'])
    return <span className={`font-mono text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-danger'}`}>{compactINR(v)}</span>
  } },
  { key: 'pctOfCapital',header: '% Capital',   align: 'right', render: r => {
    const v = Number(r['pctOfCapital'])
    const tone = Math.abs(v) > 15 ? 'text-danger' : Math.abs(v) > 5 ? 'text-warning' : 'text-success'
    return <span className={`font-mono text-xs font-semibold ${tone}`}>{v.toFixed(2)}%</span>
  } },
]

const FTP_COLS: Column<Record<string, unknown>>[] = [
  { key: 'tenor',           header: 'Tenor', render: r => <span className="text-xs font-semibold text-ink">{String(r['tenor'])}</span> },
  { key: 'baseRate',        header: 'Base',      align: 'right', render: r => <span className="font-mono text-xs">{Number(r['baseRate']).toFixed(3)}%</span> },
  { key: 'liquiditySpread', header: 'Liquidity', align: 'right', render: r => <span className="font-mono text-xs">{Number(r['liquiditySpread']).toFixed(3)}%</span> },
  { key: 'creditSpread',    header: 'Credit',    align: 'right', render: r => <span className="font-mono text-xs">{Number(r['creditSpread']).toFixed(3)}%</span> },
  { key: 'ftpRate',         header: 'FTP',       align: 'right', render: r => (
    <span className="font-mono text-xs font-semibold text-brand-blue">{Number(r['ftpRate']).toFixed(3)}%</span>
  ) },
]

export default function ALMPage() {
  const [customShock, setCustomShock] = useState(150)
  const [banner, setBanner] = useState<string | null>(null)

  const summaryQ = useQuery<ALMSummary>({
    queryKey: ['alm-summary'],
    queryFn: () => apiClient.get('/alm/summary').then((r: any) => r.body ?? r),
    refetchInterval: 60_000,
  })

  const gapQ = useQuery<{ items: LiquidityGapRow[] }>({
    queryKey: ['alm-gap'],
    queryFn: () => apiClient.get('/alm/liquidity-gap').then((r: any) => r.body ?? r),
  })

  const irrbbQ = useQuery<{ scenarios: IRRBBScenario[] }>({
    queryKey: ['alm-irrbb'],
    queryFn: () => apiClient.get('/alm/irrbb').then((r: any) => r.body ?? r),
  })

  const ftpQ = useQuery<{ items: FTPPoint[] }>({
    queryKey: ['alm-ftp'],
    queryFn: () => apiClient.get('/alm/ftp-curve').then((r: any) => r.body ?? r),
  })

  const simulate = useMutation({
    mutationFn: (shockBps: number) =>
      apiClient.post('/alm/simulate', { shockBps }).then((r: any) => r.body ?? r),
    onSuccess: (res: IRRBBScenario) => {
      setBanner(
        `Custom shock ${res.shockLabel}: Δ NII ${compactINR(res.deltaNII)} · Δ EVE ${compactINR(res.deltaEVE)} · ${res.pctOfCapital.toFixed(2)}% of capital`
      )
    },
    onError: () => setBanner('Simulation failed — check backend logs'),
  })

  const summary = summaryQ.data
  const gapRows = gapQ.data?.items ?? []
  const scenarios = irrbbQ.data?.scenarios ?? []
  const ftpPoints = ftpQ.data?.items ?? []

  const lcrOk = (summary?.lcr ?? 0) >= 100
  const nsfrOk = (summary?.nsfr ?? 0) >= 100

  return (
    <AppLayout title="Asset-Liability & FTP" module="ALM — Treasury & Liquidity Risk">
      <StatRow className="mb-5" stats={[
        {
          label: 'LCR',
          value: summary ? `${summary.lcr.toFixed(0)}%` : '—',
          delta: lcrOk ? '≥ 100% regulatory' : 'BELOW minimum',
          tone: lcrOk ? 'success' : 'danger',
        },
        {
          label: 'NSFR',
          value: summary ? `${summary.nsfr.toFixed(0)}%` : '—',
          delta: nsfrOk ? '≥ 100% regulatory' : 'BELOW minimum',
          tone: nsfrOk ? 'success' : 'danger',
        },
        {
          label: 'Cumulative gap',
          value: summary ? compactINR(summary.cumulativeGap) : '—',
          delta: 'All buckets',
          tone: (summary?.cumulativeGap ?? 0) >= 0 ? 'success' : 'warning',
        },
        {
          label: 'Total assets',
          value: summary ? compactINR(summary.totalAssets) : '—',
          delta: 'Balance sheet',
          tone: 'blue',
        },
        {
          label: 'Net interest income',
          value: summary ? compactINR(summary.netInterestIncome) : '—',
          delta: 'Annualised',
          tone: 'success',
        },
      ]} />

      {banner && (
        <div className="mb-4 px-4 py-2.5 rounded-card text-xs font-medium bg-brand-skyLight text-brand-blue">
          {banner}
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* Liquidity gap chart */}
        <div className="col-span-12 lg:col-span-7">
          <Panel
            title="Liquidity gap by bucket"
            subtitle="GET /api/v1/alm/liquidity-gap · Inflows vs outflows"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={gapRows} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} tickFormatter={v => compactINR(v)} />
                <Tooltip
                  cursor={{ fill: '#F7F6F2' }}
                  contentStyle={{ fontSize: 12, border: '1px solid #D3D1C7', borderRadius: 8 }}
                  formatter={(v: any) => compactINR(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="inflows"  fill="#1D9E75" name="Inflows"  radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflows" fill="#E24B4A" name="Outflows" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* FTP curve */}
        <div className="col-span-12 lg:col-span-5">
          <Panel
            title="FTP transfer curve"
            subtitle="GET /api/v1/alm/ftp-curve · Base + liquidity + credit spreads"
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ftpPoints} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" vertical={false} />
                <XAxis dataKey="tenor" tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888780' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid #D3D1C7', borderRadius: 8 }}
                  formatter={(v: any) => `${Number(v).toFixed(3)}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="baseRate" stroke="#1565C0" name="Base" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ftpRate"  stroke="#0D2B6A" name="FTP"  strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>

      {/* Liquidity gap table */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <div className="col-span-12 lg:col-span-7">
          <Panel title="Liquidity gap detail" subtitle="Time-bucketed inflows, outflows, gap, cumulative" noPadding>
            <DataTable
              columns={GAP_COLS}
              data={gapRows as unknown as Record<string, unknown>[]}
              loading={gapQ.isLoading}
              emptyMessage="No ALM gap data"
            />
          </Panel>
        </div>

        {/* Simulator */}
        <div className="col-span-12 lg:col-span-5">
          <Panel
            title="IRRBB shock simulator"
            subtitle="POST /api/v1/alm/simulate · Parallel rate shock"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-ink-sub mb-2">
                  Shock size: <span className="font-mono text-ink">{customShock > 0 ? '+' : ''}{customShock} bps</span>
                </label>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  step={25}
                  value={customShock}
                  onChange={e => setCustomShock(Number(e.target.value))}
                  className="w-full accent-brand-blue"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>-500</span>
                  <span>0</span>
                  <span>+500</span>
                </div>
              </div>

              <Button
                className="w-full"
                loading={simulate.isPending}
                onClick={() => simulate.mutate(customShock)}
              >
                Run simulation
              </Button>

              {simulate.data && (
                <div className="space-y-2 pt-3 border-t border-divider text-xs">
                  {[
                    ['Δ NII',     compactINR(simulate.data.deltaNII)],
                    ['Δ EVE',     compactINR(simulate.data.deltaEVE)],
                    ['% capital', `${simulate.data.pctOfCapital.toFixed(2)}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted">{k}</span>
                      <span className="font-mono font-semibold text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* IRRBB scenarios table */}
      <Panel
        title="IRRBB rate-shock scenarios"
        subtitle="Pre-computed parallel shocks · -200 to +200 bps"
        noPadding
      >
        <DataTable
          columns={IRRBB_COLS}
          data={scenarios as unknown as Record<string, unknown>[]}
          loading={irrbbQ.isLoading}
          emptyMessage="No IRRBB data"
        />
      </Panel>

      <div className="mt-4">
        <Panel title="FTP curve detail" subtitle="Base rate + spreads by tenor" noPadding>
          <DataTable
            columns={FTP_COLS}
            data={ftpPoints as unknown as Record<string, unknown>[]}
            loading={ftpQ.isLoading}
            emptyMessage="No FTP curve"
          />
        </Panel>
      </div>
    </AppLayout>
  )
}
