import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Search, Briefcase, Settings } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { to: '/',           label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/resume',     label: 'Resume',       icon: FileText },
  { to: '/jobs',       label: 'Find Jobs',    icon: Search },
  { to: '/applied',    label: 'Applications', icon: Briefcase },
  { to: '/settings',   label: 'Settings',     icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇦🇪</span>
          <div>
            <p className="font-bold text-white text-sm leading-tight">UAE Jobs</p>
            <p className="text-xs text-gray-400">Auto-Applicator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">Covers: LinkedIn · Indeed · Bayt · Naukrigulf · GulfTalent</p>
      </div>
    </aside>
  )
}
