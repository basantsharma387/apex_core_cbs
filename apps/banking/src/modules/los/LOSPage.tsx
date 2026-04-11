import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Check, ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { LoanApplicationSchema } from '@apex/shared'
import type { LoanApplicationInput } from '@apex/shared'
import apiClient from '@/api/client'
import { clsx } from 'clsx'

const STEPS = ['Customer Details', 'Financial Info', 'Documents', 'Credit Score', 'Review & Submit']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-6 bg-white border border-divider rounded-card shadow-card px-5 py-4">
      {STEPS.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center min-w-0">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                i < current  && 'bg-brand-blue text-white',
                i === current && 'bg-brand-blue text-white ring-4 ring-brand-skyLight',
                i > current  && 'bg-divider text-muted',
              )}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={clsx(
                'text-[11px] mt-2 text-center whitespace-nowrap',
                i === current ? 'text-ink font-semibold' : 'text-muted font-normal',
              )}
            >
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={clsx('flex-1 h-px mx-2 mb-5', i < current ? 'bg-brand-blue' : 'bg-divider')} />
          )}
        </div>
      ))}
    </div>
  )
}

function CreditScorePanel({ score }: { score: number | null }) {
  const pct = score ? score / 900 : 0
  const color = score && score >= 750 ? 'text-success' : score && score >= 650 ? 'text-warning' : 'text-danger'
  const bar = score && score >= 750 ? 'bg-success' : score && score >= 650 ? 'bg-warning' : 'bg-danger'

  return (
    <div>
      {/* Gauge */}
      <div className="bg-success-bg rounded-card p-5 text-center mb-4">
        <p className="text-[11px] font-semibold text-success uppercase tracking-wide mb-1">CIBIL Score</p>
        <p className={clsx('text-5xl font-bold tabular', color)}>{score ?? '—'}</p>
        <p className="text-[11px] text-ink-sub mt-1">/ 900 · {score && score >= 750 ? 'Excellent' : score && score >= 650 ? 'Good' : 'Fair'}</p>
        {score && (
          <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full', bar)} style={{ width: `${pct * 100}%` }} />
          </div>
        )}
      </div>

      {/* Metrics */}
      <p className="text-[10px] font-semibold text-ink-sub uppercase tracking-wider mb-2">Assessment metrics</p>
      <div className="space-y-0">
        {[
          { label: 'PD Score',       value: score ? (1 - pct).toFixed(2) : '—',  tone: score && score >= 750 ? 'text-success' : 'text-warning' },
          { label: 'LTV Ratio',      value: '72.4%',   tone: 'text-warning' },
          { label: 'FOIR',           value: '38.2%',   tone: 'text-success' },
          { label: 'Loan to Income', value: '4.2x',    tone: 'text-warning' },
          { label: 'Existing EMI',   value: '₹12,400', tone: 'text-ink' },
          { label: 'Rating',         value: score && score >= 750 ? 'A' : score && score >= 650 ? 'B' : 'C',
            tone: score && score >= 750 ? 'text-success' : 'text-warning' },
        ].map((m, i) => (
          <div key={m.label} className={clsx('flex justify-between items-center py-2', i < 5 && 'border-b border-divider')}>
            <span className="text-[11px] text-ink-sub">{m.label}</span>
            <span className={clsx('text-sm font-semibold font-mono tabular', m.tone)}>{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 mt-2 border-t border-divider">
        <Button variant="success"   className="flex-1">Recommend Approval</Button>
        <Button variant="secondary" className="flex-1">Send for Review</Button>
      </div>
    </div>
  )
}

export default function LOSPage() {
  const [step, setStep] = useState(0)
  const [creditScore, setCreditScore] = useState<number | null>(780)

  const { register, handleSubmit, formState: { errors } } = useForm<LoanApplicationInput>({
    resolver: zodResolver(LoanApplicationSchema),
  })

  const submit = useMutation({
    mutationFn: (data: LoanApplicationInput) => apiClient.post('/los/application', data),
    onSuccess: () => setStep(s => Math.min(s + 1, STEPS.length - 1)),
  })

  const scoreApp = useMutation({
    mutationFn: (customerId: string) => apiClient.post('/rating/calculate', { customerId }).then((r: any) => r.body ?? r),
    onSuccess: (res) => {
      const r = res as { creditScore?: number }
      setCreditScore(r.creditScore ?? 780)
      setStep(3)
    },
  })

  return (
    <AppLayout title="New loan application" module="LOS — Loan Origination System">
      <StepIndicator current={step} />

      <div className="grid grid-cols-12 gap-3">
        {/* Application form (55%) */}
        <div className="col-span-12 lg:col-span-7">
          <Panel
            title="Customer & loan details"
            subtitle={`Step ${step + 1} of ${STEPS.length} · React Hook Form + Zod validation`}
          >
            <form onSubmit={handleSubmit(d => submit.mutate(d))} className="space-y-4">
              {step === 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" placeholder="Asha Verma" required />
                  <Input {...register('customerId')} label="Customer ID" placeholder="CUS-0001" required error={errors.customerId?.message} />
                  <Input label="Mobile Number" placeholder="+91 98765 43210" required />
                  <Input label="Email Address" placeholder="you@example.com" required />
                  <Select {...register('productType')} label="Loan Product" required error={errors.productType?.message}
                    options={[
                      { value: 'PERSONAL',    label: 'Personal Loan'    },
                      { value: 'HOME',        label: 'Home Loan'        },
                      { value: 'VEHICLE',     label: 'Vehicle Loan'     },
                      { value: 'BUSINESS',    label: 'Business Loan'    },
                      { value: 'AGRICULTURE', label: 'Agriculture Loan' },
                    ]} />
                  <Select label="Loan Purpose" options={[
                    { value: 'home',      label: 'Home Renovation' },
                    { value: 'education', label: 'Education'       },
                    { value: 'medical',   label: 'Medical'         },
                    { value: 'business',  label: 'Business Expansion' },
                  ]} />
                  <Input {...register('requestedAmount')} label="Loan Amount (₹)" placeholder="500000" required error={errors.requestedAmount?.message} />
                  <Input {...register('requestedTenure', { valueAsNumber: true })} type="number" label="Tenure (months)" placeholder="60" required error={errors.requestedTenure?.message} />
                  <Select {...register('branchId')} label="Branch" required error={errors.branchId?.message} options={[
                    { value: 'BR-BLR-001', label: 'Bengaluru — Head Office' },
                    { value: 'BR-MUM-002', label: 'Mumbai — Fort' },
                  ]} />
                  <Select label="Relationship Manager" options={[
                    { value: 'rm1', label: 'Rohit Khanna — RM-001' },
                    { value: 'rm2', label: 'Priya Sharma — RM-002' },
                  ]} />
                  <Input {...register('purpose')} label="Purpose description" placeholder="Short description…" required error={errors.purpose?.message} className="col-span-2" />
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register('monthlyIncome')} label="Monthly Income (₹)" placeholder="80000" />
                  <Input {...register('existingEmi')} label="Existing EMI (₹)" placeholder="12000" />
                </div>
              )}

              {step === 2 && (
                <div className="py-8 text-center text-sm text-ink-sub">
                  <p>Upload KYC documents via DMS integration</p>
                  <p className="text-xs text-muted mt-1">Drag &amp; drop or click to attach</p>
                </div>
              )}

              {step >= 3 && (
                <div className="py-8 text-center text-sm text-ink-sub">
                  <p>Review in the credit panel on the right and submit →</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-divider">
                {step < 2 ? (
                  <>
                    <Button type="submit" loading={submit.isPending} icon={<ChevronRight size={14} />}>
                      Next: {STEPS[step + 1]} →
                    </Button>
                    <Button type="button" variant="secondary">Save Draft</Button>
                  </>
                ) : step === 2 ? (
                  <Button type="button" onClick={() => scoreApp.mutate('mock-customer-id')} loading={scoreApp.isPending}>
                    Run credit score →
                  </Button>
                ) : (
                  <Button type="button" variant="success">Submit application</Button>
                )}
                {step > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))}>
                    ← Back
                  </Button>
                )}
              </div>
            </form>
          </Panel>
        </div>

        {/* Credit score panel (45%) */}
        <div className="col-span-12 lg:col-span-5">
          <Panel title="AI credit scoring preview" subtitle="POST /api/v1/rating/calculate">
            <CreditScorePanel score={creditScore} />
          </Panel>
        </div>
      </div>
    </AppLayout>
  )
}
