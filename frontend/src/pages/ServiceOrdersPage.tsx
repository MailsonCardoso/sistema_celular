import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import NewOrderModal from '../components/NewOrderModal'
import OrderDetail from '../components/OrderDetail'
import LimitGate from '../components/LimitGate'
import SimplePaginator from '../components/SimplePaginator'
import { useAuth } from '../context/AuthContext'
import type { ServiceOrder, ServiceOrderStatusValue } from '../types'

const statusFilters: { value: ServiceOrderStatusValue | 'all'; label: string; dot: string }[] = [
  { value: 'all', label: 'Todas', dot: 'bg-slate-400' },
  { value: 'opened', label: 'Abertas', dot: 'bg-sky-500' },
  { value: 'awaiting_parts', label: 'Aguardando Peças', dot: 'bg-amber-500' },
  { value: 'in_progress', label: 'Em Reparo', dot: 'bg-violet-500' },
  { value: 'awaiting_approval', label: 'Aguardando Aprovação', dot: 'bg-orange-500' },
  { value: 'completed', label: 'Concluídas', dot: 'bg-emerald-500' },
  { value: 'delivered', label: 'Entregues', dot: 'bg-teal-500' },
  { value: 'cancelled', label: 'Canceladas', dot: 'bg-rose-500' },
]

const icons = {
  device: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  user: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  wrench: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
      />
    </svg>
  ),
  search: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  clock: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  eye: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
}

function daysOpen(entryDate: string): number {
  const diff = Date.now() - new Date(entryDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function ServiceOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number; per_page: number } | null>(
    null,
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ServiceOrderStatusValue | 'all'>('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await api.get<{
      data: ServiceOrder[]
      meta: { current_page: number; last_page: number; total: number; per_page: number }
    }>('/service-orders', {
      params: {
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
        per_page: 10,
        page,
      },
    })
    setOrders(data.data)
    setMeta(data.meta)
    setLoading(false)
  }, [search, status, page])

  // reinicia para a primeira página ao trocar filtro (search/status)
  useEffect(() => {
    if (search !== '' || status !== 'all') setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

  const canCreate = !!user && ['admin', 'atendente'].includes(user.role)

  const openCount = useMemo(
    () => orders.filter((o) => !['completed', 'delivered', 'cancelled'].includes(o.status)).length,
    [orders],
  )
  const totalValue = useMemo(
    () => orders.filter((o) => o.status === 'completed').reduce((acc, o) => acc + o.total_amount, 0),
    [orders],
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Ordens de Serviço</h1>
        {canCreate && (
          <LimitGate limit="can_create_os" feature="Criar novas ordens de serviço">
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Nova OS
            </button>
          </LimitGate>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icons.search}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por aparelho, IMEI ou cliente..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatus(filter.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                status === filter.value
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${filter.dot} ${status === filter.value ? 'opacity-90' : ''}`} />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {orders.length} OSs na página{meta && ` de ${meta.total} no total`}
        </span>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {openCount} em andamento
        </span>
        {totalValue > 0 && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Concluídas: {currency(totalValue)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-400">
                <th className="px-5 py-3">OS #</th>
                <th className="px-5 py-3">Aparelho</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Técnico</th>
                <th className="px-5 py-3">Entrada</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const days = daysOpen(order.entry_date)
                return (
                  <tr
                    key={order.id}
                    onClick={() => setDetailId(order.id)}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-indigo-50/40"
                  >
                    <td className="px-5 py-3.5 font-bold text-indigo-600">#{order.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="text-slate-400">{icons.device}</span>
                        {order.device_brand} {order.device_model}
                      </p>
                      {order.device_imei && <p className="mt-0.5 text-xs text-slate-400">IMEI: {order.device_imei}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-400">{icons.user}</span>
                        {order.client?.name ?? `Cliente #${order.client_id}`}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {order.technician ? (
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400">{icons.wrench}</span>
                          {order.technician.name}
                        </p>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1.5 whitespace-nowrap text-slate-600">
                        <span className="text-slate-400">{icons.clock}</span>
                        {dateBR(order.entry_date)}
                      </p>
                      {days > 1 && (
                        <span className="mt-0.5 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {days} dias
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-700">{currency(order.total_amount)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} label={order.status_label} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetailId(order.id)
                          }}
                          title="Ver detalhes"
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          {icons.eye}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    Nenhuma ordem de serviço encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {meta && (
            <SimplePaginator
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              onPage={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {canCreate && (
        <NewOrderModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            void load()
          }}
        />
      )}
      <OrderDetail
        orderId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => {
          void load()
        }}
      />
    </div>
  )
}
