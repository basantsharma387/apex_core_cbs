import { useQuery } from '@tanstack/react-query'
import { Upload, CheckCircle, XCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatRow } from '@/components/ui/StatRow'
import { Panel } from '@/components/ui/Panel'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import apiClient from '@/api/client'

const APPROVAL_COLS: Column<Record<string, unknown>>[] = [
  { key: 'docId',        header: 'Doc ID',      render: r => <span className="font-mono text-xs font-medium text-ink">{String(r['docId'])}</span> },
  { key: 'customerName', header: 'Customer',    render: r => String((r['customer'] as { fullName?: string } | undefined)?.fullName ?? r['customerName'] ?? '—') },
  { key: 'docType',      header: 'Type',        render: r => <span className="text-xs text-ink-sub">{String(r['docType']).replace(/_/g, ' ')}</span> },
  { key: 'uploadedBy',   header: 'Uploaded By', render: r => <span className="text-ink-sub text-xs">Branch user</span> },
  { key: 'createdAt',    header: 'At',          render: r => <span className="font-mono text-xs text-ink-sub">{new Date(String(r['createdAt'])).toLocaleDateString('en-IN')}</span> },
  { key: 'ocrConfidence',header: 'Checker',     align: 'right', render: r => {
    const conf = Number(r['ocrConfidence'] ?? 0.9) * 100
    return <span className={`font-mono text-xs ${conf >= 70 ? 'text-success' : 'text-warning'}`}>{conf.toFixed(0)}%</span>
  } },
  { key: 'status',       header: 'Action', render: r => {
    const s = String(r['status'])
    if (s === 'PENDING_REVIEW' || s === 'PENDING_OCR') {
      return <button className="text-[11px] font-medium text-brand-blue bg-brand-skyLight px-2.5 py-1 rounded hover:bg-[#d0e3fb]">Review →</button>
    }
    return <StatusBadge status={s} />
  } },
]

export default function DMSPage() {
  const { register } = useForm()

  const { data: docs, isLoading } = useQuery({
    queryKey: ['dms-docs'],
    queryFn: () => apiClient.get('/dms/documents').then((r: any) => r.body ?? r),
  })

  const items = ((docs as { items?: Record<string, unknown>[] } | undefined)?.items ?? []) as Record<string, unknown>[]
  const recentItems = items.slice(0, 6)

  return (
    <AppLayout title="Document management" module="DMS — KYC & Document Workflow">
      <StatRow className="mb-5" stats={[
        { label: 'Total Docs',        value: '8,250', delta: 'In system',          tone: 'blue'    },
        { label: 'Pending Approvals', value: '24',    delta: 'Maker-checker',      tone: 'warning' },
        { label: 'KYC Expiring',      value: '8',     delta: 'Within 7 days',      tone: 'danger'  },
        { label: 'Uploaded Today',    value: '150',   delta: 'All branches',       tone: 'success' },
      ]} />

      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* Upload form (36%) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <Panel title="Upload document" subtitle="POST /api/v1/dms/upload · Multer multipart">
            <div className="space-y-4">
              <Select {...register('customerId')} label="Customer ID" options={[
                { value: 'c1', label: 'CUS-0001 — Asha Verma' },
                { value: 'c2', label: 'CUS-0002 — Rahul Mehta' },
                { value: 'c3', label: 'CUS-0003 — Priya Nair' },
              ]} />
              <Select {...register('docType')} label="Document Type" options={[
                { value: 'NATIONAL_ID',    label: 'National ID / Aadhaar' },
                { value: 'PASSPORT',       label: 'Passport' },
                { value: 'ADDRESS_PROOF',  label: 'Address Proof' },
                { value: 'INCOME_PROOF',   label: 'Income Proof' },
                { value: 'BANK_STATEMENT', label: 'Bank Statement' },
                { value: 'LOAN_FORM',      label: 'Loan Application Form' },
              ]} />
              <Select {...register('branch')} label="Branch" options={[
                { value: 'BR-BLR-001', label: 'Bengaluru — Head Office' },
                { value: 'BR-MUM-002', label: 'Mumbai — Fort' },
              ]} />

              {/* Drop zone */}
              <div className="border-2 border-dashed border-brand-blue/40 bg-brand-skyLight/30 rounded-card p-6 text-center hover:border-brand-blue cursor-pointer transition-colors">
                <Upload size={22} className="mx-auto text-brand-blue mb-2" />
                <p className="text-xs font-medium text-brand-blue">Drop file here</p>
                <p className="text-[10px] text-muted mt-0.5">or click to browse · PDF, JPG, PNG · max 10 MB</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="primary" className="flex-1">Submit document</Button>
                <Button variant="secondary" className="flex-1">Save as draft</Button>
              </div>
            </div>
          </Panel>
        </div>

        {/* OCR preview (36%) */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-4">
          <Panel title="OCR data preview" subtitle="Auto-extracted · confidence ≥ 70% auto-approved">
            <div className="h-32 bg-surface-alt border border-divider rounded-card mb-4 flex items-center justify-center">
              <p className="text-[11px] text-muted">[ Document thumbnail ]</p>
            </div>
            <p className="text-[10px] font-semibold text-ink-sub uppercase tracking-wider mb-2">Extracted fields</p>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Name',        value: 'Asha Verma',   ok: true },
                { label: 'Document No', value: '7204 2536 1029', ok: true },
                { label: 'Date of birth', value: '15 Jun 1990',  ok: true },
                { label: 'Validity',    value: '31 Dec 2030',  ok: true },
                { label: 'Confidence',  value: '94.2%',         ok: true },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="text-muted">{f.label}</span>
                  <span className="flex items-center gap-1 font-mono text-ink">
                    {f.ok ? <CheckCircle size={11} className="text-success" /> : <XCircle size={11} className="text-danger" />}
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-divider">
              <Button variant="success" className="flex-1">Verify &amp; send to approval</Button>
              <Button variant="secondary">Re-scan</Button>
            </div>
          </Panel>
        </div>

        {/* Recent uploads (28%) */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-4">
          <Panel title="Recent uploads" subtitle="GET /api/v1/dms/documents?limit=6">
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(recentItems.length > 0 ? recentItems : Array.from({ length: 6 }).map((_, i) => ({
                docId: `DOC-${i+1}`, customer: { fullName: 'Loading…' }, docType: 'KYC',
                status: 'PENDING_REVIEW', createdAt: new Date().toISOString(),
              }))).map((doc: any) => (
                <div key={doc['docId']} className="flex items-start gap-2 py-2.5 px-3 border border-divider rounded-lg hover:bg-surface-alt transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    doc.status === 'APPROVED' ? 'bg-success' :
                    doc.status === 'PENDING_REVIEW' ? 'bg-warning' :
                    doc.status === 'REJECTED' ? 'bg-danger' : 'bg-muted'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-ink truncate">
                      {String(doc.customer?.fullName ?? doc.customerName ?? 'Customer')}
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      {String(doc.docType).replace(/_/g, ' ')} · {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <StatusBadge status={String(doc.status)} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Approval queue */}
      <Panel
        title="Approval queue — maker-checker"
        subtitle="POST /api/v1/dms/:id/approve · 4-eyes principle"
        noPadding
      >
        <DataTable
          columns={APPROVAL_COLS}
          data={items}
          loading={isLoading}
          emptyMessage="No documents pending approval"
        />
      </Panel>
    </AppLayout>
  )
}
