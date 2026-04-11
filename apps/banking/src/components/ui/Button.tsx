import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary:   'bg-brand-blue text-white hover:bg-brand-blueHover border-transparent',
  secondary: 'bg-brand-skyLight text-brand-blue hover:bg-[#d0e3fb] border-transparent',
  success:   'bg-success text-white hover:bg-[#158766] border-transparent',
  danger:    'bg-danger  text-white hover:bg-[#c73b3a] border-transparent',
  warning:   'bg-warning text-white hover:bg-[#d98e1d] border-transparent',
  ghost:     'bg-transparent text-ink-sub hover:text-ink hover:bg-surface-alt border-transparent',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8  px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-input border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  )
}
