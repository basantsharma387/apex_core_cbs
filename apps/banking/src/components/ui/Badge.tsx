import { clsx } from 'clsx'

type Variant =
  | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'
  | 'live' | 'uat' | 'dev'
  // legacy aliases — kept for backwards-compat
  | 'ok' | 'warn' | 'risk'

const styles: Record<Variant, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger:  'bg-danger-bg  text-danger',
  info:    'bg-brand-skyLight text-brand-blue',
  neutral: 'bg-divider     text-ink-sub',
  purple:  'bg-purple-bg   text-purple',
  live:    'bg-brand-skyLight text-brand-blue',
  uat:     'bg-warning-bg  text-warning',
  dev:     'bg-purple-bg   text-purple',
  // legacy
  ok:   'bg-success-bg text-success',
  warn: 'bg-warning-bg text-warning',
  risk: 'bg-danger-bg  text-danger',
}

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  const dotColor = dot ? (
    variant === 'success' || variant === 'ok' ? 'bg-success' :
    variant === 'warning' || variant === 'warn' || variant === 'uat' ? 'bg-warning' :
    variant === 'danger'  || variant === 'risk' ? 'bg-danger' :
    variant === 'info' || variant === 'live' ? 'bg-brand-blue' :
    variant === 'purple' || variant === 'dev' ? 'bg-purple' :
    'bg-muted'
  ) : null

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-[3px] rounded-badge',
        styles[variant],
        className,
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColor)} />}
      {children}
    </span>
  )
}

// Risk-level badge shorthand
const RISK_VARIANT: Record<string, Variant> = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }
const STATUS_VARIANT: Record<string, Variant> = {
  LIVE: 'live', UAT: 'uat', DEV: 'dev',
  OPEN: 'danger', ASSIGNED: 'warning', RESOLVED: 'success', ESCALATED: 'danger',
  ACTIVE: 'success', NPA: 'danger', CLOSED: 'neutral', PENDING: 'warning',
  APPROVED: 'success', REJECTED: 'danger', FILED: 'success', DRAFT: 'neutral',
  SUBMITTED: 'info', UNDER_REVIEW: 'warning', DISBURSED: 'success',
  FILED_STR: 'info', FILED_CTR: 'info', CLEARED: 'success',
  IN_PROGRESS: 'info', PAYMENT_RECEIVED: 'success', WRITTEN_OFF: 'neutral',
  PENDING_REVIEW: 'warning', PENDING_OCR: 'info', EXPIRED: 'danger',
  COMPLETED: 'success', RUNNING: 'info',
}

export function RiskBadge({ level }: { level: string }) {
  return <Badge variant={RISK_VARIANT[level] ?? 'neutral'}>{level}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>{status.replace(/_/g, ' ')}</Badge>
}
