import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Printer, User, Wrench, ClipboardList, Cog, RefreshCw, History, MessageSquare, Smartphone } from 'lucide-react'
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

function SectionTitle({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        {icon}
      </span>
      {title}
    </h3>
  )
}

export default function OrderDetail({ orderId, onClose, onChanged }: Props) {
  const { user, limits, store } = useAuth()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [comment, setComment] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [discount, setDiscount] = useState('')
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
      setDiagnosis(data.data.technical_diagnosis ?? '')
      setDiscount(data.data.discount > 0 ? String(data.data.discount) : '')
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
      })
      notify(data.data)
      onClose()
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

  const saveDiagnosis = async () => {
    if (!order) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch<{ data: ServiceOrder }>(`/service-orders/${orderId}`, {
        technical_diagnosis: diagnosis.trim() || null,
      })
      setHistory(data.data.history ?? [])
      notify(data.data)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const saveDiscount = async () => {
    if (!order) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch<{ data: ServiceOrder }>(`/service-orders/${orderId}`, {
        discount: Number(discount) || 0,
      })
      setHistory(data.data.history ?? [])
      notify(data.data)
      setDiscount(data.data.discount > 0 ? String(data.data.discount) : '')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const editable = order && !['delivered', 'cancelled'].includes(order.status)
  const canChangeStatus = !!user && ['admin', 'tecnico', 'atendente'].includes(user.role) && editable

  return (
    <Modal title={order ? `OS #${order.id} - ${order.device_brand} ${order.device_model}` : 'Carregando...'} open={!!orderId} onClose={onClose} wide icon={<Smartphone className="h-4 w-4" />}>
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
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} label={order.status_label} />
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-slate-400">Total da OS</p>
              <p className="text-xl font-bold text-slate-800">{currency(order.total_amount)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
            <SectionTitle
              title="Cliente e responsável"
              icon={<User className="h-3.5 w-3.5" />}
            />
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs uppercase text-slate-400">Cliente</p>
                <p className="mt-1 font-medium text-slate-700">{(order.client as Client | null)?.name ?? `#${order.client_id}`}</p>
                <p className="text-xs text-slate-500">{(order.client as Client | null)?.phone ?? ''}</p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs uppercase text-slate-400">Técnico</p>
                <p className="mt-1 font-medium text-slate-700">{order.technician?.name ?? 'Não atribuído'}</p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs uppercase text-slate-400">Entrada</p>
                <p className="mt-1 font-medium text-slate-700">{dateBR(order.entry_date)}</p>
                {order.expected_delivery_at && (
                  <p className="text-xs text-slate-500">
                    Previsão: {datetimeBR(order.expected_delivery_at.replace(' ', 'T'))}
                  </p>
                )}
                {order.delivery_date && <p className="text-xs text-slate-500">Entrega: {dateBR(order.delivery_date)}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
            <SectionTitle
              title="Problema e diagnóstico"
              icon={<Wrench className="h-3.5 w-3.5" />}
            />
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-400">Defeito relatado</p>
              <p className="mt-1 text-slate-700">{order.reported_issue}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Diagnóstico técnico</p>
              {editable ? (
                <div className="mt-1 flex gap-2">
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Descreva o diagnóstico técnico..."
                  />
                  <button
                    onClick={() => void saveDiagnosis()}
                    disabled={busy || diagnosis === (order.technical_diagnosis ?? '')}
                    className="shrink-0 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-slate-700">{order.technical_diagnosis ?? '—'}</p>
              )}
            </div>
            </div>
          </div>

          {order.checklist &&
            (order.checklist.items.length > 0 || order.checklist.condition.length > 0) && (
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 text-sm">
                <SectionTitle
                  title="Checklist de entrada"
                  icon={<ClipboardList className="h-3.5 w-3.5" />}
                />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {order.checklist.items.length > 0 && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Itens deixados pelo cliente
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {order.checklist.items.map((item) => (
                          <span
                            key={item}
                            className="inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {order.checklist.condition.length > 0 && (
                    <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Estado físico do aparelho
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {order.checklist.condition.map((item) => (
                          <span
                            key={item}
                            className="inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
            <SectionTitle
              title="Peças utilizadas"
              icon={<Cog className="h-3.5 w-3.5" />}
            />
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
                      {order.discount > 0 && <> · Desconto: −{currency(order.discount)}</>}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-800">{currency(order.total_amount)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {editable && (
              <div className="mt-3 flex items-end gap-3">
                <Field label="Desconto (R$)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="0,00"
                  />
                </Field>
                <button
                  onClick={() => void saveDiscount()}
                  disabled={busy || Number(discount) === order.discount}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            )}

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
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <SectionTitle
                title="Mudar status"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              />
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
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <SectionTitle
                title="Histórico de acompanhamento"
                icon={<History className="h-3.5 w-3.5" />}
              />
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
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <SectionTitle
                title="Comentários"
                icon={<MessageSquare className="h-3.5 w-3.5" />}
              />
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
            </div>
          )}
        </div>
      )}

      {order && (
        <div id="print-os" className="hidden bg-white text-slate-900 print:block">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-3xl font-bold uppercase tracking-wide">{store?.store_name ?? 'OmniOS'}</h1>
            {store?.cnpj_cpf && <p className="mt-1 font-semibold">CNPJ/CPF: {store.cnpj_cpf}</p>}
            {store?.address && <p className="text-xs">{store.address}</p>}
            <p className="text-xs">
              {store?.phone ? `Tel: ${store.phone}` : ''}
              {store?.email ? `${store.phone ? ' · ' : ''}E-mail: ${store.email}` : ''}
            </p>
          </div>

          <div className="my-4 border border-slate-900 py-2 text-center">
            <h2 className="text-xl font-bold uppercase">Ordem de Serviço</h2>
            <p className="mt-0.5 text-sm font-semibold">
              Nº {order.os_number_formatted ?? `#${order.id}`}
            </p>
          </div>

          <table className="mb-4 w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="label-cell">Cliente</td>
                <td className="value-cell">{(order.client as Client | null)?.name ?? `#${order.client_id}`}</td>
                <td className="label-cell">CPF/CNPJ</td>
                <td className="value-cell">{(order.client as Client | null)?.cpf_cnpj ?? '—'}</td>
              </tr>
              <tr>
                <td className="label-cell">Telefone</td>
                <td className="value-cell">{(order.client as Client | null)?.phone ?? '—'}</td>
                <td className="label-cell">Data de entrada</td>
                <td className="value-cell">{dateBR(order.entry_date)}</td>
              </tr>
              <tr>
                <td className="label-cell">Aparelho</td>
                <td className="value-cell">
                  {order.device_brand} {order.device_model}
                  {order.device_imei ? ` · IMEI: ${order.device_imei}` : ''}
                </td>
                <td className="label-cell">Previsão</td>
                <td className="value-cell">
                  {order.expected_delivery_at ? datetimeBR(order.expected_delivery_at.replace(' ', 'T')) : '—'}
                </td>
              </tr>
              <tr>
                <td className="label-cell">Técnico</td>
                <td className="value-cell">{order.technician?.name ?? 'Não atribuído'}</td>
                <td className="label-cell">Status</td>
                <td className="value-cell">{order.status_label}</td>
              </tr>
              <tr>
                <td className="label-cell">Defeito relatado</td>
                <td className="value-cell" colSpan={3}>{order.reported_issue}</td>
              </tr>
              <tr>
                <td className="label-cell">Diagnóstico técnico</td>
                <td className="value-cell" colSpan={3}>{order.technical_diagnosis ?? '—'}</td>
              </tr>
            </tbody>
          </table>

          {order.checklist &&
            (order.checklist.items.length > 0 || order.checklist.condition.length > 0) && (
              <div className="mb-4 text-sm">
                <p className="mb-1 font-semibold">Checklist de entrada</p>
                <p>
                  {order.checklist.items.length > 0 && <>Itens deixados: {order.checklist.items.join(', ')}</>}
                  {order.checklist.items.length > 0 && order.checklist.condition.length > 0 && ' · '}
                  {order.checklist.condition.length > 0 && <>Estado: {order.checklist.condition.join(', ')}</>}
                </p>
              </div>
            )}

          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left">
                <th className="py-1.5">Peça</th>
                <th className="py-1.5 text-center">Qtd</th>
                <th className="py-1.5 text-right">Unit.</th>
                <th className="py-1.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-300">
                  <td className="py-1.5">{item.product_name ?? `#${item.product_id}`}</td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">{currency(item.unit_price)}</td>
                  <td className="py-1.5 text-right">{currency(item.subtotal)}</td>
                </tr>
              ))}
              {order.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-1.5 text-slate-500">
                    Nenhuma peça vinculada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mb-8 flex justify-end text-sm">
            <div className="space-y-1 text-right">
              <p>
                Mão de obra: <strong>{currency(order.service_cost)}</strong>
              </p>
              <p>
                Peças: <strong>{currency(order.parts_total)}</strong>
              </p>
              {order.discount > 0 && (
                <p>
                  Desconto: <strong>−{currency(order.discount)}</strong>
                </p>
              )}
              <p className="border-t border-slate-900 pt-1 text-base font-bold">
                TOTAL: {currency(order.total_amount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="border-t border-slate-900 pt-1 text-center">
              <span className="text-xs text-slate-600">Assinatura do cliente</span>
            </div>
            <div className="border-t border-slate-900 pt-1 text-center">
              <span className="text-xs text-slate-600">Assinatura do técnico</span>
            </div>
          </div>

          <style>{`
            #print-os .label-cell {
              width: 15%;
              border: 1px solid #94a3b8;
              background: #f1f5f9;
              padding: 4px 8px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.02em;
              white-space: nowrap;
            }
            #print-os .value-cell {
              min-width: 35%;
              border: 1px solid #94a3b8;
              padding: 4px 8px;
            }
          `}</style>
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
