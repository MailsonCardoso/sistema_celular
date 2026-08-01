import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import type { DashboardData } from '../types'
import StatusBadge from '../components/StatusBadge'

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
    { label: 'OS em aberto', value: data.open_orders, icon: '📋', color: 'bg-blue-50 text-blue-700' },
    { label: 'Concluídas no mês', value: data.completed_this_month, icon: '✅', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Clientes ativos', value: data.active_clients, icon: '👥', color: 'bg-violet-50 text-violet-700' },
    ...(data.is_trial
      ? []
      : [
          { label: 'Receita do mês', value: currency(data.monthly_income ?? 0), icon: '💰', color: 'bg-green-50 text-green-700' },
          { label: 'Despesas do mês', value: currency(data.monthly_expense ?? 0), icon: '💸', color: 'bg-rose-50 text-rose-700' },
          { label: 'A receber', value: currency(data.pending_receivables ?? 0), icon: '⏳', color: 'bg-amber-50 text-amber-700' },
          { label: 'Saldo do mês', value: currency(data.monthly_balance ?? 0), icon: '📊', color: 'bg-slate-50 text-slate-700' },
          { label: 'Estoque baixo', value: data.low_stock_count ?? 0, icon: '⚠️', color: 'bg-orange-50 text-orange-700' },
        ]),
  ]

  const statusOrder: [string, string][] = [
    ['opened', 'Abertas'],
    ['awaiting_parts', 'Aguardando Peças'],
    ['in_progress', 'Em Reparo'],
    ['awaiting_approval', 'Aguardando Aprovação'],
    ['completed', 'Concluídas'],
    ['delivered', 'Entregues'],
    ['cancelled', 'Canceladas'],
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">OS por status</h2>
          <div className="space-y-3">
            {statusOrder.map(([status, label]) => {
              const count = data.status_counts[status] ?? 0
              const max = Math.max(...statusOrder.map(([s]) => data.status_counts[s] ?? 0), 1)
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600">
                    <span>{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Últimas ordens de serviço</h2>
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
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
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
          <p className="mt-3 text-xs text-slate-400">
            Última atualização: {dateBR(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  )
}
