import { clsx } from 'clsx'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  suffix?: React.ReactNode
  prefix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, prefix, className, ...props }, ref) => (
    <div>
      {label && <label className="field-label">{label}{props.required && <span className="text-risk ml-0.5">*</span>}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-muted text-sm">{prefix}</span>}
        <input
          ref={ref}
          {...props}
          className={clsx(
            'field-input',
            prefix && 'pl-8',
            suffix && 'pr-8',
            error && 'border-risk focus:ring-risk/20 focus:border-risk',
            className
          )}
        />
        {suffix && <span className="absolute right-3 text-muted text-sm">{suffix}</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div>
      {label && <label className="field-label">{label}{props.required && <span className="text-risk ml-0.5">*</span>}</label>}
      <select
        ref={ref}
        {...props}
        className={clsx(
          'field-input appearance-none bg-page',
          error && 'border-risk',
          className
        )}
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
