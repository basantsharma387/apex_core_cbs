import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function Panel({ title, subtitle, actions, children, className, noPadding }: PanelProps) {
  return (
    <div className={clsx('bg-surface border border-divider rounded-card shadow-card', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-divider">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink leading-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-muted mt-1 font-mono truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-5')}>{children}</div>
    </div>
  )
}
