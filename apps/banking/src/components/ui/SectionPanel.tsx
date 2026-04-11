import type { ReactNode } from 'react'
import { clsx } from 'clsx'

interface Props {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPad?: boolean
}

export default function SectionPanel({ title, subtitle, action, children, className, noPad }: Props) {
  return (
    <div className={clsx('bg-white border border-gray-200 rounded-md', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            {title && <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-4'}>{children}</div>
    </div>
  )
}
