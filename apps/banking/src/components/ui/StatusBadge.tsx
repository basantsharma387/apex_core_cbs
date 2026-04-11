import { clsx } from 'clsx'

const styles: Record<string, string> = {
  HIGH:         'bg-red-50 text-red-700 border-red-100',
  MEDIUM:       'bg-amber-50 text-amber-700 border-amber-100',
  LOW:          'bg-green-50 text-green-700 border-green-100',
  OPEN:         'bg-blue-50 text-blue-700 border-blue-100',
  ASSIGNED:     'bg-violet-50 text-violet-700 border-violet-100',
  RESOLVED:     'bg-gray-100 text-gray-600 border-gray-200',
  ESCALATED:    'bg-red-50 text-red-700 border-red-100',
  ACTIVE:       'bg-green-50 text-green-700 border-green-100',
  NPA:          'bg-red-50 text-red-700 border-red-100',
  DISBURSED:    'bg-blue-50 text-blue-700 border-blue-100',
  CLOSED:       'bg-gray-100 text-gray-600 border-gray-200',
  APPROVED:     'bg-green-50 text-green-700 border-green-100',
  REJECTED:     'bg-red-50 text-red-700 border-red-100',
  SUBMITTED:    'bg-blue-50 text-blue-700 border-blue-100',
  PENDING:      'bg-amber-50 text-amber-700 border-amber-100',
  'UNDER_REVIEW':'bg-violet-50 text-violet-700 border-violet-100',
  FILED:        'bg-green-50 text-green-700 border-green-100',
  VERIFIED:     'bg-green-50 text-green-700 border-green-100',
  EXPIRED:      'bg-red-50 text-red-700 border-red-100',
  LIVE:         'bg-green-50 text-green-700 border-green-100',
  UAT:          'bg-amber-50 text-amber-700 border-amber-100',
  DEV:          'bg-violet-50 text-violet-700 border-violet-100',
}

export default function StatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={clsx('inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wide', s)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
