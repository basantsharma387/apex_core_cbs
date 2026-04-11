import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { FileText, Download, RefreshCw, Clock } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Panel } from '@/components/ui/Panel'
import { apiClient } from '@/api/client'

interface ReportDef {
  id: string
  name: string
  description: string
  endpoint: string
  frequency: string
  lastRun?: string
}

const REPORT_CATALOG: ReportDef[] = [
  { id: 'npa-summary',      name: 'NPA Summary Report',       description: 'Non-performing assets by bucket, branch and product type', endpoint: '/reports/npa-summary',      frequency: 'Daily' },
  { id: 'ifrs9-ecl',        name: 'IFRS 9 ECL Report',        description: 'Expected credit loss per stage with provision requirements',  endpoint: '/reports/ifrs9-ecl',        frequency: 'Monthly' },
  { id: 'aml-str',          name: 'AML STR/CTR Report',       description: 'Suspicious transaction and currency transaction filings',      endpoint: '/reports/aml-str',          frequency: 'Weekly' },
  { id: 'loan-portfolio',   name: 'Loan Portfolio Report',    description: 'Full portfolio snapshot: disbursements, repayments, closures', endpoint: '/reports/loan-portfolio',   frequency: 'Daily' },
  { id: 'kyc-expiry',       name: 'KYC Expiry Report',        description: 'Documents expiring within 30 / 60 / 90 days',                endpoint: '/reports/kyc-expiry',       frequency: 'Daily' },
  { id: 'collection-aging', name: 'Collection Aging Report',  description: 'Overdue accounts by DPD bucket with recovery actions',       endpoint: '/reports/collection-aging', frequency: 'Weekly' },
]

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    PENDING:   'bg-amber-50 text-amber-700',
    FAILED:    'bg-red-50 text-red-700',
    RUNNING:   'bg-blue-50 text-blue-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null)

  const { data: jobs, refetch } = useQuery({
    queryKey: ['report-jobs'],
    queryFn: () => apiClient.get('/reports/jobs').then((r: any) => r.body ?? []),
    refetchInterval: 10_000,
  })

  const generateMut = useMutation({
    mutationFn: (reportId: string) => apiClient.post('/reports/generate', { reportId }),
    onMutate: (id) => setGenerating(id),
    onSettled: () => { setGenerating(null); refetch() },
  })

  const jobMap: Record<string, any> = {}
  if (Array.isArray(jobs)) {
    jobs.forEach((j: any) => { jobMap[j.reportId] = j })
  }

  return (
    <AppLayout title="Reports" module="Regulatory & Management Reporting">
      <div className="space-y-5">
        <Panel title="Report Catalog" subtitle="Generate on-demand or view scheduled reports">
          <div className="divide-y divide-gray-100">
            {REPORT_CATALOG.map((r) => {
              const job = jobMap[r.id]
              return (
                <div key={r.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={14} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{r.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {r.frequency}
                        </span>
                        {job?.lastRun && (
                          <span className="text-[10px] text-slate-400">Last: {new Date(job.lastRun).toLocaleString()}</span>
                        )}
                        {job?.status && <StatusPill status={job.status} />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job?.status === 'COMPLETED' && (
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                        <Download size={11} /> Download
                      </button>
                    )}
                    <button
                      onClick={() => generateMut.mutate(r.id)}
                      disabled={generating === r.id || job?.status === 'RUNNING'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {generating === r.id ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      {generating === r.id ? 'Queuing…' : 'Generate'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title="Recent Jobs" subtitle="Last 20 report generation jobs">
          {!Array.isArray(jobs) || jobs.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No jobs yet. Generate a report above.</p>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Report', 'Status', 'Queued At', 'Completed At', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide first:pl-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((j: any) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 pl-4 font-medium text-slate-800">{j.reportId}</td>
                    <td className="px-3 py-3"><StatusPill status={j.status} /></td>
                    <td className="px-3 py-3 text-slate-500">{j.queuedAt ? new Date(j.queuedAt).toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-slate-500">{j.completedAt ? new Date(j.completedAt).toLocaleString() : '—'}</td>
                    <td className="px-3 py-3">
                      {j.status === 'COMPLETED' && (
                        <button className="text-blue-600 text-[11px] font-medium hover:underline flex items-center gap-1">
                          <Download size={10} /> Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </AppLayout>
  )
}
