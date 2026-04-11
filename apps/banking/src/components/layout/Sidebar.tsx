import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, Shield, FileText, Briefcase, Package, BarChart2, FileBarChart, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/api/client'

const NAV = [
  { label: 'Dashboard',   path: '/dashboard', icon: LayoutDashboard },
  { label: 'EWS Alerts',  path: '/ews',       icon: AlertTriangle },
  { label: 'AML Monitor', path: '/aml',       icon: Shield },
  { label: 'Documents',   path: '/dms',       icon: FileText },
  { label: 'Loan Apps',   path: '/los',       icon: Briefcase },
  { label: 'Collections', path: '/cms',       icon: Package },
  { label: 'IFRS 9',      path: '/ifrs9',     icon: BarChart2 },
  { label: 'Reports',     path: '/reports',   icon: FileBarChart },
  { label: 'Settings',    path: '/settings',  icon: Settings },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    window.location.href = '/login'
  }

  return (
    <aside className="w-[220px] h-screen bg-brand-navy flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">DN</span>
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold leading-tight">Data Networks</p>
            <p className="text-sidebar-text text-[10px] leading-tight opacity-80">Banking Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-2 overflow-y-auto">
        {NAV.map(({ label, path, icon: Icon }) => {
          const active = pathname.startsWith(path)
          return (
            <Link key={path} to={path}>
              <div
                className={[
                  'h-8 mx-1 my-1 px-3 rounded-md flex items-center gap-2.5 transition-colors',
                  active
                    ? 'bg-brand-blue text-white font-semibold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white font-normal',
                ].join(' ')}
              >
                <Icon size={14} strokeWidth={active ? 2.25 : 1.75} className="flex-shrink-0" />
                <span className="text-[13px] leading-none">{label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-blue/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user?.name}</p>
            <p className="text-sidebar-text text-[10px] truncate opacity-80">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
          <button onClick={handleLogout} className="text-sidebar-text hover:text-white transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
