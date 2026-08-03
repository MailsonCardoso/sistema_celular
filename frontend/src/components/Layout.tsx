import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ClipboardList, Users, Package, UserCog, CircleDollarSign, Building2, Smartphone, LogOut } from 'lucide-react'
import type { Role } from '../types'

interface NavItem {
  to: string
  label: string
  roles: Role[]
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    roles: ['admin', 'tecnico', 'atendente'],
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    to: '/ordens',
    label: 'Ordens de Serviço',
    roles: ['admin', 'tecnico', 'atendente'],
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    to: '/clientes',
    label: 'Clientes',
    roles: ['admin', 'atendente'],
    icon: <Users className="h-5 w-5" />,
  },
  {
    to: '/estoque',
    label: 'Estoque',
    roles: ['admin', 'atendente'],
    icon: <Package className="h-5 w-5" />,
  },
  {
    to: '/equipe',
    label: 'Equipe',
    roles: ['admin'],
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    to: '/financeiro',
    label: 'Financeiro',
    roles: ['admin'],
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
  {
    to: '/admin/lojas',
    label: 'Lojas',
    roles: ['super_admin'],
    icon: <Building2 className="h-5 w-5" />,
  },
]

export default function Layout() {
  const { user, store, limits, logout } = useAuth()
  const navigate = useNavigate()

  const isSuperAdmin = user?.role === 'super_admin'
  const items = navItems.filter(
    (item) => user && item.roles.includes(user.role) && (item.to !== '/financeiro' || !limits || limits.can_see_financial),
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-800/70 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/40">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {isSuperAdmin ? 'OmniOS' : (store?.store_name ?? 'OmniOS')}
            </p>
            <p className="text-xs text-slate-400">{isSuperAdmin ? 'Administração' : 'Assistência Técnica'}</p>
          </div>
        </div>

        {!isSuperAdmin && store?.is_trial && (
          <div className="border-b border-slate-800 px-6 py-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
              Trial
            </span>
            {limits && (
              <p className="mt-1.5 text-[11px] text-slate-400">
                OS: {limits.os_used}/{limits.os_limit} · Clientes: {limits.clients_used}/{limits.clients_limit}
                {store.trial_limit_at && (
                  <span>
                    {' '}
                    · até {new Date(store.trial_limit_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-slate-800/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.role_label}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
