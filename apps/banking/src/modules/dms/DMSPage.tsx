import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

type UploadForm = {
  customerId: string
  docType: string
  branch: string
}

export default function DMSPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [banner, setBanner] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Record<string, unknown> | null>(null)

  const { register, handleSubmit, reset } = useForm<UploadForm>({
    defaultValues: { customerId: 'c1', docType: 'NATIONAL_ID', branch: 'BR-BLR-001' },
  })

  const { data: docs, isLoading } = useQuery({
    queryKey: ['dms-docs'],
    queryFn: () => apiClient.get('/dms/documents').then((r: any) => r.body ?? r),
  })

  const upload = useMutation({
    mutationFn: async (vals: UploadForm & { draft?: boolean }) => {
      if (!file) throw new Error('Please choose a file to upload')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('customerId', vals.customerId)
      fd.append('docType', vals.docType)
      fd.append('branch', vals.branch)
      if (vals.draft) fd.append('draft', 'true')
      return apiClient.post('/dms/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (_d, v) => {
      setBanner({ tone: 'success', text: v.draft ? 'Saved as draft.' : 'Document uploaded for approval.' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      reset()
      qc.invalidateQueries({ queryKey: ['dms-docs'] })
    },
    onError: (e: any) => setBanner({ tone: 'danger', text: e?.message ?? 'Upload failed' }),
  })

  const approve = useMutation({
    mutationFn: (docId: string) => apiClient.post(`/dms/${docId}/approve`, { decision: 'APPROVED' }),
    onSuccess: () => {
      setBanner({ tone: 'success', text: 'Document approved.' })
      qc.invalidateQueries({ queryKey: ['dms-docs'] })
    },
  })

  const rescan = useMutation({
    mutationFn: (docId: string) => apiClient.post(`/dms/${docId}/rescan`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dms-docs'] }),
  })

  const items = ((docs as { items?: Record<string, unknown>[] } | undefined)?.items ?? []) as Record<string, unknown>[]
  const recentItems = items.slice(0, 6)
  const previewDoc = selectedDoc ?? items.find(d => String(d['status']).startsWith('PENDING')) ?? items[0]
  const previewDocId = previewDoc ? String(previewDoc['docId'] ?? previewDoc['id'] ?? '') : ''
  const previewConfidence = previewDoc ? Number(previewDoc['ocrConfidence'] ?? 0.94) : 0.94
  const previewFields = (previewDoc?.['ocrFields'] as { label: string; value: string; ok: boolean }[] | undefined) ?? [
    { label: 'Name',          value: String(((previewDoc?.['customer'] as any)?.fullName) ?? '—'), ok: true },
    { label: 'Document No',   value: '7204 2536 1029', ok: true },
    { label: 'Date of birth', value: '15 Jun 1990',    ok: true },
    { label: 'Validity',      value: '31 Dec 2030',    ok: true },
    { label: 'Confidence',    value: `${(previewConfidence * 100).toFixed(1)}%`, ok: previewConfidence >= 0.7 },
  ]

  const APPROVAL_COLS: Column<Record<string, unknown>>[] = [
    { key: 'docId',        header: 'Doc ID',      render: r => <span className="font-mono text-xs font-medium text-ink">{String(r['docId'] ?? r['id'])}</span> },
    { key: 'customerName', header: 'Customer',    render: r => String((r['customer'] as { fullName?: string } | undefined)?.fullName ?? r['customerName'] ?? '—') },
    { key: 'docType',      header: 'Type',        render: r => <span className="text-xs text-ink-sub">{String(r['docType']).replace(/_/g, ' ')}</span> },
    { key: 'uploadedBy',   header: 'Uploaded By', render: () => <span className="text-ink-sub text-xs">Branch user</span> },
    { key: 'createdAt',    header: 'At',          render: r => <span className="font-mono text-xs text-ink-sub">{new Date(String(r['createdAt'])).toLocaleDateString('en-IN')}</span> },
    { key: 'ocrConfidence',header: 'Checker',     align: 'right', render: r => {
      const conf = Number(r['ocrConfidence'] ?? 0.9) * 100
      return <span className={`font-mono text-xs ${conf >= 70 ? 'text-success' : 'text-warning'}`}>{conf.toFixed(0)}%</span>
    } },
    { key: 'status',       header: 'Action', render: r => {
      const s = String(r['status'])
      if (s === 'PENDING_REVIEW' || s === 'PENDING_OCR') {
        return (
          <button
            onClick={() => setSelectedDoc(r)}
            className="text-[11px] font-medium text-brand-blue bg-brand-skyLight px-2.5 py-1 rounded hover:bg-[#d0e3fb]"
          >
            Review →
          </button>
        )
      }
      return <StatusBadge status={s} />
    } },
  ]

  return (
    <AppLayout title="Document management" module="DMS — KYC & Document Workflow">
      <StatRow className="mb-5" stats={[
        { label: 'Total Docs',        value: String(items.length || 8250), delta: 'In system',      tone: 'blue'    },
        { label: 'Pending Approvals', value: String(items.filter(d => String(d['status']).startsWith('PENDING')).length || 24), delta: 'Maker-checker', tone: 'warning' },
        { label: 'KYC Expiring',      value: '8',   delta: 'Within 7 days', tone: 'danger'  },
        { label: 'Uploaded Today',    value: '150', delta: 'All branches',  tone: 'success' },
      ]} />

      {banner && (
        <div className={`mb-3 px-4 py-2.5 rounded-card text-xs font-medium ${
          banner.tone === 'success' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
        }`}>
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* Upload form */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <Panel title="Upload document" subtitle="POST /api/v1/dms/upload · Multer multipart">
            <form
              onSubmit={handleSubmit(vals => upload.mutate(vals))}
              className="space-y-4"
            >
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

              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault() }}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) setFile(f)
                }}
                className="border-2 border-dashed border-brand-blue/40 bg-brand-skyLight/30 rounded-card p-6 text-center hover:border-brand-blue cursor-pointer transition-colors"
              >
                <Upload size={22} className="mx-auto text-brand-blue mb-2" />
                <p className="text-xs font-medium text-brand-blue">
                  {file ? file.name : 'Drop file here'}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB · click to replace`
                    : 'or click to browse · PDF, JPG, PNG · max 10 MB'}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" variant="primary" className="flex-1" loading={upload.isPending}>
                  Submit document
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleSubmit(vals => upload.mutate({ ...vals, draft: true }))}
                >
                  Save as draft
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        {/* OCR preview */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-4">
          <Panel
            title="OCR data preview"
            subtitle={previewDocId ? `Doc ${previewDocId} · confidence ≥ 70% auto-approved` : 'Auto-extracted · confidence ≥ 70% auto-approved'}
          >
            <div className="h-32 bg-surface-alt border border-divider rounded-card mb-4 flex items-center justify-center">
              <p className="text-[11px] text-muted">[ Document thumbnail ]</p>
            </div>
            <p className="text-[10px] font-semibold text-ink-sub uppercase tracking-wider mb-2">Extracted fields</p>
            <div className="space-y-2 text-xs">
              {previewFields.map(f => (
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
              <Button
                variant="success"
                className="flex-1"
                loading={approve.isPending}
                disabled={!previewDocId}
                onClick={() => previewDocId && approve.mutate(previewDocId)}
              >
                Verify &amp; send to approval
              </Button>
              <Button
                variant="secondary"
                loading={rescan.isPending}
                disabled={!previewDocId}
                onClick={() => previewDocId && rescan.mutate(previewDocId)}
              >
                Re-scan
              </Button>
            </div>
          </Panel>
        </div>

        {/* Recent uploads */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-4">
          <Panel title="Recent uploads" subtitle="GET /api/v1/dms/documents?limit=6">
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(recentItems.length > 0 ? recentItems : Array.from({ length: 6 }).map((_, i) => ({
                docId: `DOC-${i+1}`, customer: { fullName: 'Loading…' }, docType: 'KYC',
                status: 'PENDING_REVIEW', createdAt: new Date().toISOString(),
              }))).map((doc: any) => (
                <button
                  key={doc['docId']}
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full flex items-start gap-2 py-2.5 px-3 border border-divider rounded-lg hover:bg-surface-alt transition-colors text-left"
                >
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
                </button>
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
