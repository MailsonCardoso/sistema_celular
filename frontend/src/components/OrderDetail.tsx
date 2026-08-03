import { useEffect, useState, type FormEvent } from 'react'
import { api, errorMessage } from '../lib/api'
import { currency, dateBR, datetimeBR } from '../lib/format'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import { Field, Select } from './form'
import { useAuth } from '../context/AuthContext'
import type {
  Client,
  Product,
  ServiceHistory,
  ServiceOrder,
  ServiceOrderStatusValue,
} from '../types'

interface Props {
  orderId: number | null
  onClose: () => void
  onChanged: (order: ServiceOrder) => void
}

const transitions: Record<ServiceOrderStatusValue, ServiceOrderStatusValue[]> = {
  opened: ['in_progress', 'awaiting_parts', 'awaiting_approval', 'completed', 'cancelled'],
  awaiting_parts: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['awaiting_parts', 'awaiting_approval', 'completed', 'cancelled'],
  awaiting_approval: ['in_progress', 'awaiting_parts', 'completed', 'cancelled'],
  completed: ['delivered'],
  delivered: [],
  cancelled: [],
}

export default function OrderDetail({ orderId, onClose, onChanged }: Props) {
  const { user, limits } = useAuth()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [comment, setComment] = useState('')
  const [newStatus, setNewStatus] = useState<ServiceOrderStatusValue>('opened')
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<ServiceHistory[]>([])

  const load = async (id: number) => {
    setLoadError('')
    try {
      const { data } = await api.get<{ data: ServiceOrder }>(`/service-orders/${id}`)
      setOrder(data.data)
      setHistory(data.data.history ?? [])
    } catch (err) {
      setOrder(null)
      setLoadError(errorMessage(err))
    }
  }

  useEffect(() => {
    if (!orderId) return
    setError('')
    setOrder(null)
    setNewStatus('opened')
    void load(orderId)
    api.get<{ data: Product[] }>('/products/options').then(({ data }) => setProducts(data.data)).catch(() => {})
  }, [orderId])

  useEffect(() => {
    if (order) {
      const next = transitions[order.status][0]
      if (next) setNewStatus(next)
    }
  }, [order?.status])

  if (!orderId) return null

  const reload = async () => {
    if (orderId) await load(orderId)
  }

  const notify = (updated: ServiceOrder) => {
    setOrder(updated)
    onChanged(updated)
  }

  const changeStatus = async (status: ServiceOrderStatusValue) => {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch<{ data: ServiceOrder }>(`/service-orders/${orderId}/status`, {
        status,
        comment: comment.trim() || null,
      })
      setComment('')
      notify(data.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const addItem = async (e: FormEvent) => {
    e.preventDefault()
    if (!productId) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<{ data: ServiceOrder['items'][number] }>(`/service-orders/${orderId}/items`, {
        product_id: Number(productId),
        quantity: Number(quantity),
      })
      void data
      setProductId('')
      setQuantity('1')
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const removeItem = async (itemId: number) => {
    setBusy(true)
    setError('')
    try {
      await api.delete(`/service-orders/${orderId}/items/${itemId}`)
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const addComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/service-orders/${orderId}/comments`, { comment: comment.trim() })
      setComment('')
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const editable = order && !['delivered', 'cancelled'].includes(order.status)
  const canChangeStatus = !!user && ['admin', 'tecnico', 'atendente'].includes(user.role) && editable

  return (
    <Modal title={order ? `OS #${order.id} - ${order.device_brand} ${order.device_model}` : 'Carregando...'} open={!!orderId} onClose={onClose} wide>
      {!order ? (
        loadError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-rose-600">{loadError}</p>
            <button
              onClick={() => orderId && void load(orderId)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={order.status} label={order.status_label} />
            <div className="text-right">
              <p className="text-xs uppercase text-slate-400">Total da OS</p>
              <p className="text-xl font-bold text-slate-800">{currency(order.total_amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-400">Cliente</p>
              <p className="mt-1 font-medium text-slate-700">{(order.client as Client | null)?.name ?? `#${order.client_id}`}</p>
              <p className="text-xs text-slate-500">{(order.client as Client | null)?.phone ?? ''}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-400">Técnico</p>
              <p className="mt-1 font-medium text-slate-700">{order.technician?.name ?? 'Não atribuído'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-400">Entrada</p>
              <p className="mt-1 font-medium text-slate-700">{dateBR(order.entry_date)}</p>
              {order.delivery_date && <p className="text-xs text-slate-500">Entrega: {dateBR(order.delivery_date)}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-400">Defeito relatado</p>
              <p className="mt-1 text-slate-700">{order.reported_issue}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Diagnóstico técnico</p>
              <p className="mt-1 text-slate-700">{order.technical_diagnosis ?? '—'}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Peças utilizadas</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Peça</th>
                    <th className="px-4 py-2 text-center">Qtd</th>
                    <th className="px-4 py-2 text-right">Unit.</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                    {editable && <th className="px-4 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700">{item.product_name ?? `#${item.product_id}`}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{currency(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-800">{currency(item.subtotal)}</td>
                      {editable && (
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => void removeItem(item.id)}
                            disabled={busy}
                            className="text-xs text-rose-500 hover:underline disabled:opacity-50"
                          >
                            Remover
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {order.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                        Nenhuma peça vinculada.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-xs text-slate-500">
                      Mão de obra: {currency(order.service_cost)} · Peças: {currency(order.parts_total)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-800">{currency(order.total_amount)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {editable && (
              <form onSubmit={addItem} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Peça">
                  <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} ({p.stock_quantity} disp.)
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Qtd">
                  <Select value={quantity} onChange={(e) => setQuantity(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={busy || !productId}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            )}
          </div>

          {canChangeStatus && (
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Mudar status</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-48">
                  <Field label="Novo status">
                    <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ServiceOrderStatusValue)}>
                      {transitions[order.status].map((s) => (
                        <option key={s} value={s}>
                          {labelFor(s)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Observação do status (opcional)">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Ex: aguardando cliente aprovar orçamento..."
                    />
                  </Field>
                </div>
                <button
                  onClick={() => void changeStatus(newStatus)}
                  disabled={busy}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          {limits?.can_see_history && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Histórico de acompanhamento</h3>
              <div className="space-y-0">
                {history.map((h, i) => (
                  <div key={h.id} className="relative border-l-2 border-slate-200 pb-4 pl-4 last:pb-0">
                    {i === 0 && <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-indigo-500" />}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">{h.action_label}</span>
                      <span className="text-xs text-slate-400">por {h.user_name ?? 'Sistema'} · {datetimeBR(h.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-700">{h.description}</p>
                  </div>
                ))}
                {history.length === 0 && <p className="py-2 text-sm text-slate-400">Sem registros.</p>}
              </div>
            </div>
          )}

          {editable && (
            <form onSubmit={addComment} className="flex gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Adicionar comentário à OS..."
              />
              <button
                type="submit"
                disabled={busy || !comment.trim()}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Comentar
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  )
}

function labelFor(status: ServiceOrderStatusValue): string {
  const labels: Record<ServiceOrderStatusValue, string> = {
    opened: 'Aberta',
    awaiting_parts: 'Aguardando Peças',
    in_progress: 'Em Reparo',
    awaiting_approval: 'Aguardando Aprovação',
    completed: 'Concluída',
    delivered: 'Entregue',
    cancelled: 'Cancelada',
  }
  return labels[status]
}
