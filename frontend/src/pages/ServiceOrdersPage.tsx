import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import NewOrderModal from '../components/NewOrderModal'
import OrderDetail from '../components/OrderDetail'
import LimitGate from '../components/LimitGate'
import { useAuth } from '../context/AuthContext'
import type { ServiceOrder, ServiceOrderStatusValue } from '../types'

interface KanbanColumn {
  status: ServiceOrderStatusValue
  label: string
  orders: ServiceOrder[]
}

const columnOrder: ServiceOrderStatusValue[] = [
  'opened',
  'awaiting_parts',
  'in_progress',
  'awaiting_approval',
  'completed',
]

const columnColors: Record<string, { dot: string; text: string }> = {
  opened: { dot: 'bg-sky-500', text: 'text-sky-700' },
  awaiting_parts: { dot: 'bg-amber-500', text: 'text-amber-700' },
  in_progress: { dot: 'bg-violet-500', text: 'text-violet-700' },
  awaiting_approval: { dot: 'bg-orange-500', text: 'text-orange-700' },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
}

const accentByStatus: Record<string, string> = {
  opened: 'border-l-sky-400',
  awaiting_parts: 'border-l-amber-400',
  in_progress: 'border-l-violet-400',
  awaiting_approval: 'border-l-orange-400',
  completed: 'border-l-emerald-400',
}

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
}

function daysOpen(entryDate: string): number {
  const diff = Date.now() - new Date(entryDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function ServiceOrdersPage() {
  const { user } = useAuth()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await api.get<{ columns: Record<string, KanbanColumn> }>('/service-orders/kanban')
    setColumns(columnOrder.map((status) => data.columns[status]).filter(Boolean))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const canCreate = !!user && ['admin', 'atendente'].includes(user.role)

  const filteredColumns = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return columns
    return columns.map((column) => ({
      ...column,
      orders: column.orders.filter(
        (o) =>
          o.id.toString().includes(term) ||
          `${o.device_brand} ${o.device_model}`.toLowerCase().includes(term) ||
          (o.client?.name ?? '').toLowerCase().includes(term) ||
          (o.technician?.name ?? '').toLowerCase().includes(term),
      ),
    }))
  }, [columns, search])

  const totalOpen = useMemo(
    () =>
      filteredColumns
        .filter((c) => c.status !== 'completed')
        .reduce((acc, c) => acc + c.orders.length, 0),
    [filteredColumns],
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
            placeholder="Buscar por OS, cliente, aparelho ou técnico..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
        {search && (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {totalOpen} em andamento
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {filteredColumns.map((column) => {
            const color = columnColors[column.status] ?? columnColors.opened
            const total = column.orders.reduce((acc, o) => acc + o.total_amount, 0)
            return (
              <div key={column.status} className="w-72 shrink-0 rounded-2xl border border-slate-200/60 bg-slate-100/80 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                    <span className="text-sm font-semibold text-slate-700">{column.label}</span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-600 shadow-sm">
                    {column.orders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {column.orders.map((order) => {
                    const days = daysOpen(order.entry_date)
                    return (
                      <button
                        key={order.id}
                        onClick={() => setDetailId(order.id)}
                        className={`w-full rounded-xl border border-slate-200/70 border-l-4 bg-white p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${accentByStatus[order.status] ?? 'border-l-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600">OS #{order.id}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              {icons.clock}
                              {dateBR(order.entry_date)}
                            </span>
                            {days > 1 && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                {days}d
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          <span className="text-slate-400">{icons.device}</span>
                          {order.device_brand} {order.device_model}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                          <span className="text-slate-400">{icons.user}</span>
                          {order.client?.name ?? `Cliente #${order.client_id}`}
                        </p>
                        {order.technician && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="text-slate-400">{icons.wrench}</span>
                            Técnico: {order.technician.name}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
                          <span className="text-sm font-bold text-slate-700">{currency(order.total_amount)}</span>
                          <StatusBadge status={order.status} label={order.status_label} />
                        </div>
                      </button>
                    )
                  })}
                  {column.orders.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
                      <p className="text-xs font-medium text-slate-400">Sem OSs nesta etapa</p>
                      {search && <p className="mt-0.5 text-[11px] text-slate-400">nada corresponde à busca</p>}
                    </div>
                  )}
                </div>

                {total > 0 && (
                  <div className="mt-3 flex justify-between rounded-lg bg-white/70 px-3 py-2 text-[11px] font-semibold text-slate-500">
                    <span>Total</span>
                    <span className={`${color.text}`}>{currency(total)}</span>
                  </div>
                )}
              </div>
            )
          })}
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
