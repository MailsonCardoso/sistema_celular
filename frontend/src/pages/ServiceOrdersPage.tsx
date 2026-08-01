import { useCallback, useEffect, useState } from 'react'
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

export default function ServiceOrdersPage() {
  const { user } = useAuth()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const { data } = await api.get<{ columns: Record<string, KanbanColumn> }>('/service-orders/kanban')
    setColumns(columnOrder.map((status) => data.columns[status]).filter(Boolean))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const canCreate = !!user && ['admin', 'atendente'].includes(user.role)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Ordens de Serviço</h1>
        {canCreate && (
          <LimitGate limit="can_create_os" feature="Criar novas ordens de serviço">
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Nova OS
            </button>
          </LimitGate>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.status} className="w-72 shrink-0 rounded-xl bg-slate-200/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-700">{column.label}</span>
              <span className="rounded-full bg-slate-300/70 px-2 py-0.5 text-xs font-medium text-slate-600">
                {column.orders.length}
              </span>
            </div>
            <div className="space-y-3">
              {column.orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setDetailId(order.id)}
                  className="w-full rounded-lg bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600">OS #{order.id}</span>
                    <span className="text-xs text-slate-400">{dateBR(order.entry_date)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800">
                    {order.device_brand} {order.device_model}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {order.client?.name ?? `Cliente #${order.client_id}`}
                  </p>
                  {order.technician && (
                    <p className="mt-0.5 text-xs text-slate-400">Técnico: {order.technician.name}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">{currency(order.total_amount)}</span>
                    <StatusBadge status={order.status} label={order.status_label} />
                  </div>
                </button>
              ))}
              {column.orders.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                  Sem OSs
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

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
