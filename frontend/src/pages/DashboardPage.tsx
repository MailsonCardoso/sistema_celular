import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import type { DashboardData } from '../types'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'

const icons = {
  clipboard: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  check: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  income: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  expense: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  balance: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l9 5 9-5-9-5-9 5zm0 6l9 5 9-5M3 18l9 5 9-5" />
    </svg>
  ),
  stock: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
}

export default function DashboardPage() {
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

  const cards = [
    { label: 'OS em aberto', value: data.open_orders, icon: icons.clipboard, gradient: 'blue' },
    { label: 'Concluídas no mês', value: data.completed_this_month, icon: icons.check, gradient: 'emerald' },
    { label: 'Clientes ativos', value: data.active_clients, icon: icons.users, gradient: 'violet' },
    ...(data.is_trial
      ? []
      : [
          { label: 'Receita do mês', value: currency(data.monthly_income ?? 0), icon: icons.income, gradient: 'green' },
          { label: 'Despesas do mês', value: currency(data.monthly_expense ?? 0), icon: icons.expense, gradient: 'rose' },
          { label: 'A receber', value: currency(data.pending_receivables ?? 0), icon: icons.pending, gradient: 'amber' },
          { label: 'Saldo do mês', value: currency(data.monthly_balance ?? 0), icon: icons.balance, gradient: 'slate' },
          { label: 'Estoque baixo', value: data.low_stock_count ?? 0, icon: icons.stock, gradient: 'orange' },
        ]),
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} gradient={card.gradient} />
        ))}
      </div>

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
