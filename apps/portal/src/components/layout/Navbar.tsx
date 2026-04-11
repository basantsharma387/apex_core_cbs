import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Bell, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePortalAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { label: 'Overview',   path: '/dashboard'  },
  { label: 'My Loans',   path: '/loans'      },
  { label: 'Apply',      path: '/apply'      },
  { label: 'Documents',  path: '/documents'  },
  { label: 'Statements', path: '/statements' },
  { label: 'Profile',    path: '/profile'    },
]

export function Navbar() {
  const { user, logout } = usePortalAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const firstName = user?.name?.split(' ')[0] ?? 'Customer'
  const initial = firstName[0]?.toUpperCase() ?? 'U'

  // Close drawer on route change
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [open])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleLogout() {
    try { await apiClient.post('/portal/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-card pt-[env(safe-area-inset-top)]">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 h-16 flex items-center justify-between gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-sub hover:text-ink hover:bg-surface transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-1 md:flex-initial min-w-0">
          <div className="w-8 h-8 bg-action rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">DN</span>
          </div>
          <span className="text-base font-semibold text-ink truncate">Data Networks</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <NavLink key={l.path} to={l.path}>
              {({ isActive }) => (
                <span
                  className={clsx(
                    'px-3 py-2 text-sm rounded-lg transition-colors',
                    isActive
                      ? 'bg-actionLight text-action font-semibold'
                      : 'text-sub font-medium hover:text-ink hover:bg-surface',
                  )}
                >
                  {l.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            aria-label="Notifications"
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-sub hover:text-ink hover:border-borderMed transition-colors relative"
          >
            <Bell size={15} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-risk rounded-pill" />
          </button>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l border-border">
            <div className="w-9 h-9 rounded-pill bg-actionLight flex items-center justify-center">
              <span className="text-action text-xs font-semibold">{initial}</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-semibold text-ink leading-tight truncate max-w-[120px]">{firstName}</p>
              <p className="text-[10px] text-muted leading-tight">Customer</p>
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-1.5 text-muted hover:text-sub rounded transition-colors items-center"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-ink/40 z-40 animate-in fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <aside className="md:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            {/* Drawer header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-divider flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-action rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">DN</span>
                </div>
                <span className="text-base font-semibold text-ink">Data Networks</span>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-sub hover:text-ink hover:bg-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {NAV_LINKS.map(l => (
                <NavLink
                  key={l.path}
                  to={l.path}
                  onClick={() => setOpen(false)}
                >
                  {({ isActive }) => (
                    <div
                      className={clsx(
                        'h-12 px-4 rounded-lg flex items-center text-sm transition-colors',
                        isActive
                          ? 'bg-actionLight text-action font-semibold'
                          : 'text-sub font-medium hover:text-ink hover:bg-surface',
                      )}
                    >
                      {l.label}
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Drawer footer */}
            <div className="border-t border-divider p-4 flex-shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-pill bg-actionLight flex items-center justify-center">
                  <span className="text-action text-sm font-semibold">{initial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{firstName}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-sub hover:text-ink hover:border-borderMed transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}
    </header>
  )
}
