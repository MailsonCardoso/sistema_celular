import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CircleCheck, Users, CircleDollarSign, Clock, Layers, History, RefreshCw, TriangleAlert } from 'lucide-react'
import { api } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import type { DashboardData } from '../types'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'

const icons = {
  clipboard: <ClipboardList className="h-5 w-5" />,
  check: <CircleCheck className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  income: <CircleDollarSign className="h-5 w-5" />,
  expense: <CircleDollarSign className="h-5 w-5" />,
  pending: <Clock className="h-5 w-5" />,
  balance: <Layers className="h-5 w-5" />,
  previous: <History className="h-5 w-5" />,
  accrued: <RefreshCw className="h-5 w-5" />,
  stock: <TriangleAlert className="h-5 w-5" />,
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then(({ data }) => setData(data)).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  const showCards = user?.role === 'admin' || user?.role === 'super_admin'

  const cards = [
    ...(data.is_trial
      ? []
      : [
          { label: 'Saldo anterior', value: currency(data.previous_balance ?? 0), icon: icons.previous, gradient: 'violet' },
          { label: 'Receita do mês', value: currency(data.monthly_income ?? 0), icon: icons.income, gradient: 'green' },
          { label: 'Saldo do mês', value: currency(data.monthly_balance ?? 0), icon: icons.balance, gradient: 'slate' },
          { label: 'A receber', value: currency(data.pending_receivables ?? 0), icon: icons.pending, gradient: 'amber' },
          { label: 'Despesas do mês', value: currency(data.monthly_expense ?? 0), icon: icons.expense, gradient: 'rose' },
          { label: 'Saldo acumulado', value: currency(data.accrued_balance ?? 0), icon: icons.accrued, gradient: 'blue' },
        ]),
    { label: 'OS em aberto', value: data.open_orders, icon: icons.clipboard, gradient: 'blue' },
    { label: 'Concluídas no mês', value: data.completed_this_month, icon: icons.check, gradient: 'emerald' },
    { label: 'Clientes ativos', value: data.active_clients, icon: icons.users, gradient: 'violet' },
    ...(data.is_trial ? [] : [{ label: 'Estoque baixo', value: data.low_stock_count ?? 0, icon: icons.stock, gradient: 'orange' }]),
  ]

  const statusOrder: [string, string, string][] = [
    ['opened', 'Abertas', 'bg-sky-500'],
    ['awaiting_parts', 'Aguardando Peças', 'bg-amber-500'],
    ['in_progress', 'Em Reparo', 'bg-indigo-500'],
    ['awaiting_approval', 'Aguardando Aprovação', 'bg-violet-500'],
    ['completed', 'Concluídas', 'bg-emerald-500'],
    ['delivered', 'Entregues', 'bg-green-500'],
    ['cancelled', 'Canceladas', 'bg-slate-400'],
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      {showCards && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} gradient={card.gradient} />
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold text-slate-700">OS por status</h2>
          <div className="space-y-4">
            {statusOrder.map(([status, label, color]) => {
              const count = data.status_counts[status] ?? 0
              const max = Math.max(...statusOrder.map(([s]) => data.status_counts[s] ?? 0), 1)
              return (
                <div key={status}>
                  <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                    <span>{label}</span>
                    <span className="font-semibold text-slate-800">{count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-2.5 rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Últimas ordens de serviço</h2>
            <Link
              to="/ordens"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ver todas →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="pb-2 pr-3">OS</th>
                  <th className="pb-2 pr-3">Cliente</th>
                  <th className="pb-2 pr-3">Aparelho</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-medium text-indigo-600">
                      <Link to="/ordens" className="hover:underline">#{order.id}</Link>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-700">{order.client_name ?? '—'}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{order.device}</td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={order.status} label={order.status_label} />
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {currency(order.total_amount)}
                    </td>
                  </tr>
                ))}
                {data.recent_orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Nenhuma OS registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            Última atualização: {dateBR(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  )
}
