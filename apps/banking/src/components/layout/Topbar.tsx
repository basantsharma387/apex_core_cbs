import { Bell, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface Props { title: string; module: string; breadcrumb?: string[] }

export default function Topbar({ title, module: mod, breadcrumb }: Props) {
  const user = useAuthStore(s => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'User'

  return (
    <header className="h-[58px] bg-white border-b border-divider flex items-center justify-between px-8 flex-shrink-0">
      <div className="min-w-0">
        {breadcrumb ? (
          <div className="flex items-center gap-1 text-[11px] text-muted">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} />}
                <span className={i === breadcrumb.length - 1 ? 'text-ink-sub font-medium' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="module-label">{mod}</p>
        )}
        <h1 className="text-base font-semibold text-ink leading-tight mt-0.5">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full border border-divider hover:bg-surface-alt transition-colors relative"
          aria-label="Notifications"
        >
          <Bell size={15} className="text-ink-sub" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-danger rounded-full" />
        </button>

        {/* User pill */}
        <div className="h-9 pl-1 pr-4 rounded-full bg-brand-skyLight flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center">
            <span className="text-white text-[11px] font-semibold">
              {firstName[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-xs font-medium text-brand-blue">{firstName}</span>
        </div>
      </div>
    </header>
  )
}
