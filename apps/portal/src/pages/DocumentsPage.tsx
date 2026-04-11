import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, File, CheckCircle2, Clock, XCircle } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { portalClient } from '@/api/client'
import { clsx } from 'clsx'

const DOC_TYPES = ['KYC', 'INCOME_PROOF', 'ADDRESS_PROOF', 'PHOTO', 'LOAN_FORM']

function StatusIcon({ status }: { status: string }) {
  if (status === 'APPROVED') return <CheckCircle2 size={13} className="text-ok" />
  if (status === 'REJECTED') return <XCircle size={13} className="text-risk" />
  return <Clock size={13} className="text-warn" />
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: 'text-ok',
    PENDING:  'text-warn',
    PENDING_REVIEW: 'text-warn',
    PENDING_OCR:    'text-warn',
    REJECTED: 'text-risk',
  }
  return (
    <span className={clsx('text-[11px] font-medium', map[status] ?? 'text-sub')}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function DocumentsPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState('KYC')
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: docs, isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: () => portalClient.get('/portal/dms/my-docs').then((r: any) => r.body ?? []),
  })

  const uploadMut = useMutation({
    mutationFn: (formData: FormData) =>
      portalClient.post('/portal/dms/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-documents'] })
      setSelectedFile(null)
    },
  })

  function handleFile(file: File) {
    setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function submitUpload() {
    if (!selectedFile) return
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('docType', docType)
    uploadMut.mutate(fd)
  }

  const items = Array.isArray(docs) ? docs : []

  return (
    <PageLayout title="Documents">
      <div className="space-y-6">
        {/* Upload panel */}
        <div className="portal-card p-6 shadow-card">
          <h3 className="text-sm font-semibold text-ink mb-5">Upload a document</h3>

          <div className="mb-4">
            <label className="portal-label">Document type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="portal-select"
            >
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              dragging
                ? 'border-action bg-actionLight'
                : 'border-border hover:border-borderMed hover:bg-surface',
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <File size={16} className="text-action" />
                <span className="text-sm font-medium text-ink">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <Upload size={22} className="text-muted mx-auto mb-2" />
                <p className="text-sm text-sub">
                  Drop file here or <span className="text-action font-medium">browse</span>
                </p>
                <p className="text-[11px] text-muted mt-1">PDF, JPG or PNG · max 10 MB</p>
              </>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={submitUpload}
                disabled={uploadMut.isPending}
                className="btn-primary"
              >
                {uploadMut.isPending ? 'Uploading…' : 'Upload document'}
              </button>
              <button onClick={() => setSelectedFile(null)} className="btn-ghost h-9 px-3 text-xs">
                Remove
              </button>
            </div>
          )}
          {uploadMut.isSuccess && (
            <p className="text-xs text-ok mt-3">Document uploaded and pending review.</p>
          )}
        </div>

        {/* Uploaded documents list */}
        <div className="portal-card overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-divider">
            <h3 className="text-sm font-semibold text-ink">Uploaded documents</h3>
          </div>

          {isLoading && (
            <div className="divide-y divide-divider">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-6 py-4 h-16 animate-pulse bg-surface" />
              ))}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-sub">
              No documents uploaded yet.
            </div>
          )}

          {items.length > 0 && (
            <ul className="divide-y divide-divider">
              {items.map((d: any) => (
                <li key={d.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <File size={14} className="text-sub" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {d.docType?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {new Date(d.uploadedAt ?? d.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusIcon status={d.status} />
                    <StatusLabel status={d.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
