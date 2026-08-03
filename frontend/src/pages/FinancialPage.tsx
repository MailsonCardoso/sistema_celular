import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShoppingBag, History, ArrowUpRight, ArrowDownLeft, Layers, Clock, RefreshCw, Search, ArrowUp, ArrowDown, CircleCheck, Trash2, CircleDollarSign } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import { Field, Input, Select, useFormErrors } from '../components/form'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import SimplePaginator from '../components/SimplePaginator'
import StatCard from '../components/StatCard'
import type { Client, FinancialTransaction, Product } from '../types'

interface TxForm {
  description: string
  type: 'income' | 'expense'
  category: 'service_payment' | 'parts_payment' | 'expense' | 'other'
  amount: string
  payment_method: string
  status: 'pending' | 'paid' | 'cancelled'
  due_date: string
  client_id: string
}

const emptyForm: TxForm = {
  description: '',
  type: 'income',
  category: 'service_payment',
  amount: '',
  payment_method: '',
  status: 'pending',
  due_date: new Date().toISOString().slice(0, 10),
  client_id: '',
}

export default function FinancialPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number; per_page: number } | null>(
    null,
  )
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState<{
    income: number
    expense: number
    balance: number
    previous_balance: number
    accrued_balance: number
    pending_receivables: number
  } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<TxForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<FinancialTransaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [saleOpen, setSaleOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selProduct, setSelProduct] = useState('')
  const [selQuantity, setSelQuantity] = useState('1')
  const [selPaymentMethod, setSelPaymentMethod] = useState('')
  const [selStatus, setSelStatus] = useState('pending')
  const [selDueDate, setSelDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [selClient, setSelClient] = useState('')
  const [selDescription, setSelDescription] = useState('')
  const selProductObj = products.find((p) => p.id === Number(selProduct))
  const selAmount = selProductObj ? selProductObj.selling_price * Number(selQuantity || 1) : 0
  const { serverErrors, setServerErrors, handleSubmit } = useFormErrors()

  const load = useCallback(async () => {
    const params: Record<string, string | number> = { per_page: 10, page }
    if (type) params.type = type
    if (status) params.status = status
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    if (search.trim()) params.search = search.trim()
    const { data } = await api.get<{
      data: FinancialTransaction[]
      meta: { current_page: number; last_page: number; total: number; per_page: number }
    }>(
      '/financial-transactions',
      { params },
    )
    setTransactions(data.data)
    setMeta(data.meta)

    const reportParams: Record<string, string> = {}
    if (dateFrom) reportParams.date_from = dateFrom
    if (dateTo) reportParams.date_to = dateTo
    const report = await api.get<{
      income: number
      expense: number
      balance: number
      previous_balance: number
      accrued_balance: number
      pending_receivables: number
    }>('/financial/report', {
      params: reportParams,
    })
    setSummary(report.data)
  }, [type, status, dateFrom, dateTo, page, search])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

  // volta para a primeira página ao trocar filtros
  useEffect(() => {
    const reset = () => setPage(1)
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, dateFrom, dateTo])

  const pendingTotal = summary?.pending_receivables ?? 0

  const monthOptions = useMemo(() => {
    const names = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    const options: { value: string; label: string }[] = []
    // todos os meses de 2026 + janeiro de 2027
    for (let m = 1; m <= 12; m++) {
      options.push({ value: `2026-${String(m).padStart(2, '0')}`, label: `${names[m - 1]}/2026` })
    }
    options.push({ value: '2027-01', label: `${names[0]}/2027` })
    return options
  }, [])

  const selectedMonth = useMemo(() => {
    if (!dateFrom || !dateTo) return ''
    const [y, m, d] = dateFrom.split('-').map(Number)
    if (!y || !m || d !== 1) return ''
    const [ty, tm, td] = dateTo.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    if (ty !== y || tm !== m || td !== lastDay) return ''
    return `${y}-${String(m).padStart(2, '0')}`
  }, [dateFrom, dateTo])

  const applyMonth = (value: string) => {
    if (!value) {
      setDateFrom('')
      setDateTo('')
      return
    }
    const [y, m] = value.split('-').map(Number)
    const padded = `${y}-${String(m).padStart(2, '0')}`
    setDateFrom(`${padded}-01`)
    setDateTo(`${padded}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`)
  }

  const openCreate = () => {
    setForm({ ...emptyForm, due_date: new Date().toISOString().slice(0, 10) })
    setServerErrors({})
    setError('')
    setModalOpen(true)
    api.get<{ data: Client[] }>('/clients/options').then(({ data }) => setClients(data.data)).catch(() => {})
  }

  const openSale = () => {
    setSaleOpen(true)
    setError('')
    setSelProduct('')
    setSelQuantity('1')
    setSelPaymentMethod('')
    setSelStatus('pending')
    setSelDueDate(new Date().toISOString().slice(0, 10))
    setSelClient('')
    setSelDescription('')
    api
      .get<{ data: Product[] }>('/products/options')
      .then(({ data }) => setProducts(data.data.filter((p) => p.category === 'acessorio' && p.stock_quantity > 0)))
      .catch(() => setProducts([]))
    if (clients.length === 0) {
      api.get<{ data: Client[] }>('/clients/options').then(({ data }) => setClients(data.data)).catch(() => {})
    }
  }

  const saveSale = handleSubmit(async (e) => {
    e.preventDefault()
    if (!selProduct || !selQuantity || !selDueDate) return
    setSaving(true)
    setError('')
    try {
      await api.post('/financial-sales', {
        product_id: Number(selProduct),
        quantity: Number(selQuantity),
        client_id: selClient ? Number(selClient) : null,
        payment_method: selPaymentMethod || null,
        status: selStatus,
        due_date: selDueDate,
        paid_date: selStatus === 'paid' ? selDueDate : null,
        description: selDescription || null,
      })
      setSaleOpen(false)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  })

  const save = handleSubmit(async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        description: form.description,
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        payment_method: form.payment_method || null,
        status: form.status,
        due_date: form.due_date,
        paid_date: form.status === 'paid' ? form.due_date : null,
        client_id: form.client_id ? Number(form.client_id) : null,
      }
      await api.post('/financial-transactions', payload)
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  })

  const markPaid = async (tx: FinancialTransaction) => {
    if (tx.type === 'expense') return
    await api.patch(`/financial-transactions/${tx.id}`, {
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10),
    })
    await load()
  }

  const remove = async (tx: FinancialTransaction) => {
    setDeleting(true)
    try {
      await api.delete(`/financial-transactions/${tx.id}`)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      alert(errorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openSale}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Vender acessório
            </span>
          </button>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Novo Lançamento
          </button>
        </div>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Saldo anterior"
            value={currency(summary.previous_balance)}
            hint="Pagas antes do período"
            icon={<History className="h-5 w-5" />}
            gradient="violet"
          />
          <StatCard
            label="Entradas"
            value={currency(summary.income)}
            icon={<ArrowUpRight className="h-5 w-5" />}
            gradient="green"
          />
          <StatCard
            label="Saídas"
            value={currency(summary.expense)}
            icon={<ArrowDownLeft className="h-5 w-5" />}
            gradient="rose"
          />
          <StatCard
            label="Saldo do período"
            value={currency(summary.balance)}
            icon={<Layers className="h-5 w-5" />}
            gradient="slate"
          />
          <StatCard
            label="A receber"
            value={currency(pendingTotal)}
            hint={pendingTotal > 0 ? 'Lançamentos pendentes' : 'Nenhum pendente'}
            icon={<Clock className="h-5 w-5" />}
            gradient="amber"
          />
          <StatCard
            label="Saldo acumulado"
            value={currency(summary.accrued_balance)}
            hint="Saldo anterior + período"
            icon={<RefreshCw className="h-5 w-5" />}
            gradient="blue"
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lançamento, cliente..."
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="income">Entradas</option>
            <option value="expense">Saídas</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Mês/Ano</label>
          <select
            value={selectedMonth}
            onChange={(e) => applyMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos os períodos</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Lançamento</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3 text-center">Pagamento</th>
              <th className="px-5 py-3">Vencimento</th>
              <th className="px-5 py-3 text-right">Valor</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{tx.description}</p>
                      {tx.service_order_id && (
                        <p className="text-xs text-slate-400">OS #{tx.service_order_id}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {tx.client ? (
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                        {tx.client.name.slice(0, 1).toUpperCase()}
                      </span>
                      {tx.client.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.category === 'expense'
                        ? 'bg-rose-50 text-rose-700'
                        : tx.category === 'service_payment'
                          ? 'bg-emerald-50 text-emerald-700'
                          : tx.category === 'parts_payment'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tx.category_label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {tx.payment_method_label ?? '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{dateBR(tx.due_date)}</td>
                <td
                  className={`px-5 py-3.5 text-right font-bold ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '−'} {currency(tx.amount)}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : tx.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        tx.status === 'paid'
                          ? 'bg-emerald-500'
                          : tx.status === 'pending'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                      }`}
                    />
                    {tx.status_label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    {tx.type === 'income' && tx.status === 'pending' && (
                      <button
                        onClick={() => void markPaid(tx)}
                        title="Marcar como recebido"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <CircleCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(tx)}
                      title="Excluir"
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                  Nenhuma transação encontrada.
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

      <Modal title="Novo Lançamento" open={modalOpen} onClose={() => setModalOpen(false)} icon={<CircleDollarSign className="h-4 w-4" />}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo" required>
              <Select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as TxForm['type']
                  setForm({
                    ...form,
                    type,
                    category: type === 'expense' ? 'expense' : 'service_payment',
                  })
                }}
              >
                <option value="income">Entrada</option>
                <option value="expense">Saída</option>
              </Select>
            </Field>
            <Field label="Categoria" required>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TxForm['category'] })}>
                {form.type === 'income' ? (
                  <>
                    <option value="service_payment">Pagamento de Serviço</option>
                    <option value="parts_payment">Pagamento de Peças</option>
                    <option value="other">Outro</option>
                  </>
                ) : (
                  <>
                    <option value="expense">Despesa</option>
                    <option value="other">Outro</option>
                  </>
                )}
              </Select>
            </Field>
          </div>

          <Field label="Descrição" required>
            <Input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Serviço iPhone 12 - João"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)" required>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Forma de pagamento">
              <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="">Selecione...</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="pix">Pix</option>
                <option value="bank_transfer">Transferência</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" required>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TxForm['status'] })}>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </Select>
            </Field>
            <Field label="Vencimento" required>
              <Input
                required
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Cliente (opcional)">
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Sem cliente vinculado</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          {(error || serverErrors.description) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error || serverErrors.description?.[0] || serverErrors.amount?.[0]}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal title="Vender acessório" open={saleOpen} onClose={() => setSaleOpen(false)} wide icon={<ShoppingBag className="h-4 w-4" />}>
        <form onSubmit={saveSale} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Produto (acessório)" required>
            <Select
              required
              value={selProduct}
              onChange={(e) => setSelProduct(e.target.value)}
            >
              <option value="">Selecione um acessório...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.brand ?? ''} ({p.stock_quantity} disp.)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade" required>
            <Input
              required
              type="number"
              min={1}
              max={selProductObj?.stock_quantity ?? 1}
              value={selQuantity}
              onChange={(e) => setSelQuantity(e.target.value)}
              placeholder="1"
            />
          </Field>

          <Field label="Valor unitário">
            <Input
              type="text"
              value={currency(selAmount / Number(selQuantity || 1))}
              readOnly
              placeholder="automático"
              className="bg-slate-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              Produto: {selProductObj ? currency(selProductObj.selling_price) : '-'}
            </p>
          </Field>
          <Field label="Total (R$)">
            <Input type="text" value={currency(selAmount)} readOnly placeholder="automático" className="font-semibold" />
          </Field>

          <Field label="Cliente (opcional)">
            <Select value={selClient} onChange={(e) => setSelClient(e.target.value)}>
              <option value="">Sem cliente vinculado</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Forma de pagamento">
            <Select value={selPaymentMethod} onChange={(e) => setSelPaymentMethod(e.target.value)}>
              <option value="">Selecione...</option>
              <option value="cash">Dinheiro</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="debit_card">Cartão de Débito</option>
              <option value="pix">Pix</option>
              <option value="bank_transfer">Transferência</option>
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Observação">
              <Input
                value={selDescription}
                onChange={(e) => setSelDescription(e.target.value)}
                placeholder="Ex: Venda de capa iPhone — opcional"
              />
            </Field>
          </div>

          <Field label="Status" required>
            <Select value={selStatus} onChange={(e) => setSelStatus(e.target.value)}>
              <option value="paid">Pago</option>
              <option value="pending">Pendente (a receber)</option>
            </Select>
          </Field>
          <Field label="Vencimento" required>
            <Input required type="date" value={selDueDate} onChange={(e) => setSelDueDate(e.target.value)} />
          </Field>

          {error && (
            <div className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSaleOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selProduct || !selQuantity || !selDueDate}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Confirmar venda'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDelete !== null}
        title="Excluir lançamento"
        loading={deleting}
        message={
          <>
            Tem certeza que deseja excluir a transação{' '}
            <strong className="text-slate-900">{confirmDelete?.description}</strong> de{' '}
            {confirmDelete ? currency(confirmDelete.amount) : ''}?
            <br />
            <span className="font-medium text-rose-600">Esta ação não pode ser desfeita.</span>
          </>
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void remove(confirmDelete)}
      />
    </div>
  )
}
