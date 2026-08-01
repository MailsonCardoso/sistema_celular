import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import type { Client, FinancialTransaction, ServiceOrder } from '../types'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { limits } = useAuth()
  const [client, setClient] = useState<Client | null>(null)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])

  useEffect(() => {
    api
      .get<{ client: Client; service_orders: ServiceOrder[]; financial_transactions: FinancialTransaction[] }>(
        `/clients/${id}`,
      )
      .then(({ data }) => {
        setClient(data.client)
        setOrders(data.service_orders)
        setTransactions(data.financial_transactions)
      })
      .catch(() => {})
  }, [id])

  if (!client) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  const totalPaid = transactions
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalPending = transactions
    .filter((t) => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div>
      <Link to="/clientes" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Voltar para clientes
      </Link>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{client.cpf_cnpj ?? '—'}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {client.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-slate-400">Telefone</p>
            <p className="mt-0.5">{client.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">E-mail</p>
            <p className="mt-0.5">{client.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Endereço</p>
            <p className="mt-0.5">{client.address ?? '—'}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm">
          {limits?.can_see_financial && (
            <>
              <div>
                <span className="text-xs uppercase text-slate-400">Total pago</span>
                <p className="font-semibold text-emerald-600">{currency(totalPaid)}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-slate-400">Em aberto</span>
                <p className="font-semibold text-amber-600">{currency(totalPending)}</p>
              </div>
            </>
          )}
          <div>
            <span className="text-xs uppercase text-slate-400">OSs realizadas</span>
            <p className="font-semibold text-slate-700">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Histórico de Ordens de Serviço</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to="/ordens"
                className="block rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-600">OS #{order.id}</span>
                  <StatusBadge status={order.status} label={order.status_label} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {order.device_brand} {order.device_model}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>Entrada: {dateBR(order.entry_date)}</span>
                  <span className="font-semibold text-slate-700">{currency(order.total_amount)}</span>
                </div>
              </Link>
            ))}
            {orders.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Nenhuma OS.</p>}
          </div>
        </div>

        {limits?.can_see_financial && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Histórico Financeiro</h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {tx.category_label} · {tx.payment_method_label ?? '—'} · {dateBR(tx.due_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '−'} {currency(tx.amount)}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      tx.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {tx.status_label}
                  </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Nenhuma transação.</p>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
