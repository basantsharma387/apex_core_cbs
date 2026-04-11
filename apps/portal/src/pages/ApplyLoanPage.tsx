import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { portalClient } from '@/api/client'
import { clsx } from 'clsx'

const ApplySchema = z.object({
  productType:     z.enum(['PERSONAL', 'BUSINESS', 'HOME', 'VEHICLE', 'EDUCATION', 'GOLD']),
  purpose:         z.string().min(5, 'Describe the purpose (min 5 chars)'),
  requestedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  requestedTenure: z.coerce.number().int().min(3).max(360),
})
type ApplyForm = z.infer<typeof ApplySchema>

const STEPS = ['Loan Details', 'Review', 'Submitted']

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="portal-label">{label}</label>
      {children}
      {error && <p className="portal-error">{error}</p>}
    </div>
  )
}

export default function ApplyLoanPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(ApplySchema),
    defaultValues: { productType: 'PERSONAL', requestedTenure: 12 },
  })

  const mut = useMutation({
    mutationFn: (d: ApplyForm) => portalClient.post('/portal/los/apply', d),
    onSuccess: () => setStep(2),
  })

  const values = watch()

  return (
    <PageLayout title="Loan Application">
      <div className="max-w-lg mx-auto w-full">
        {/* Current step caption (mobile only) */}
        <p className="text-xs font-semibold text-action uppercase tracking-wide mb-3 sm:hidden">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>

        {/* Steps indicator */}
        <div className="flex items-center mb-6 sm:mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center">
                <div className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-pill text-xs font-semibold border-2 transition-colors flex-shrink-0',
                  i <  step && 'border-action bg-action text-white',
                  i === step && 'border-action text-action bg-actionLight',
                  i >  step && 'border-border text-muted bg-white',
                )}>
                  {i < step ? <CheckCircle2 size={15} /> : i + 1}
                </div>
                <span className={clsx(
                  'ml-2 text-xs font-medium whitespace-nowrap hidden sm:inline',
                  i === step ? 'text-ink' : 'text-muted',
                )}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-px mx-3', i < step ? 'bg-action' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <form onSubmit={handleSubmit(() => setStep(1))} className="portal-card p-6 space-y-5 shadow-card">
            <Field label="Loan product" error={errors.productType?.message}>
              <select {...register('productType')} className="portal-select">
                {['PERSONAL','BUSINESS','HOME','VEHICLE','EDUCATION','GOLD'].map(p => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()} Loan</option>
                ))}
              </select>
            </Field>

            <Field label="Loan purpose" error={errors.purpose?.message}>
              <textarea
                {...register('purpose')}
                rows={3}
                placeholder="Briefly describe why you need this loan"
                className="portal-textarea"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Loan amount (₹)" error={errors.requestedAmount?.message}>
                <input {...register('requestedAmount')} placeholder="500000" className="portal-input" />
              </Field>
              <Field label="Tenure (months)" error={errors.requestedTenure?.message}>
                <input
                  {...register('requestedTenure')}
                  type="number"
                  min={3}
                  max={360}
                  className="portal-input"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-divider">
              <button type="button" onClick={() => navigate('/loans')} className="btn-ghost h-9 px-3 text-xs">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Review application →
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="portal-card p-6 shadow-card">
            <h3 className="text-sm font-semibold text-ink mb-5">Review your application</h3>
            <dl className="divide-y divide-divider mb-6">
              {[
                ['Product', values.productType],
                ['Purpose', values.purpose],
                ['Amount',  `₹${Number(values.requestedAmount || 0).toLocaleString('en-IN')}`],
                ['Tenure',  `${values.requestedTenure} months`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-3">
                  <dt className="text-xs text-sub">{l}</dt>
                  <dd className="text-xs font-medium text-ink text-right max-w-[60%]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-muted mb-5 leading-relaxed">
              By submitting, you confirm the information is accurate. Our team will review and contact you within 2 business days.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">Edit</button>
              <button
                onClick={() => mut.mutate(values)}
                disabled={mut.isPending}
                className="btn-primary flex-1"
              >
                {mut.isPending ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
            {mut.isError && (
              <p className="portal-error text-center mt-3">Submission failed. Please try again.</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="portal-card p-10 text-center shadow-card">
            <div className="w-14 h-14 bg-ok-bg rounded-pill flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-ok" />
            </div>
            <h3 className="text-base font-semibold text-ink">Application submitted</h3>
            <p className="text-xs text-sub mt-2 max-w-xs mx-auto leading-relaxed">
              Our credit team will review your application and contact you within 2 business days.
            </p>
            <button onClick={() => navigate('/loans')} className="btn-primary mt-6">
              Back to loans
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
