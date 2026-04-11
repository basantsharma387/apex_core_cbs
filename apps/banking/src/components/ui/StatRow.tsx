/**
 * StatRow — horizontal grid of MetricCards (Figma: 5-card row).
 * Each card is a white panel with a label, big value, and a colored
 * pill at the bottom showing the delta/status.
 */
import { clsx } from 'clsx'

type Tone = 'success' | 'warning' | 'danger' | 'blue' | 'purple' | 'neutral'

export interface Stat {
  label: string
  value: string | number
  delta?: string
  note?: string
  tone?: Tone
  deltaType?: 'up' | 'down' | 'neutral'
}

interface StatRowProps {
  stats: Stat[]
  className?: string
}

// Maps tone → colored pill classes (bg + text)
const pillTone: Record<Tone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger:  'bg-danger-bg  text-danger',
  blue:    'bg-brand-skyLight text-brand-blue',
  purple:  'bg-purple-bg  text-purple',
  neutral: 'bg-divider    text-ink-sub',
}

// If caller didn't specify tone, derive from deltaType
function deriveTone(s: Stat): Tone {
  if (s.tone) return s.tone
  if (s.deltaType === 'up') return 'success'
  if (s.deltaType === 'down') return 'danger'
  return 'neutral'
}

export function StatRow({ stats, className }: StatRowProps) {
  return (
    <div
      className={clsx(
        'grid gap-3',
        stats.length === 5 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
        stats.length === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        stats.length === 3 && 'grid-cols-1 sm:grid-cols-3',
        stats.length === 2 && 'grid-cols-1 sm:grid-cols-2',
        className,
      )}
    >
      {stats.map((s, i) => {
        const tone = deriveTone(s)
        return (
          <div
            key={i}
            className="bg-surface border border-divider rounded-card px-4 py-4 shadow-card"
          >
            <p className="text-xs text-muted mb-1.5">{s.label}</p>
            <p className="text-2xl font-bold text-ink leading-none">{s.value}</p>
            {(s.delta || s.note) && (
              <span
                className={clsx(
                  'inline-block mt-3 px-2 py-[3px] rounded-badge text-[10px] font-medium',
                  pillTone[tone],
                )}
              >
                {s.delta ?? s.note}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
