import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { currency, dateBR } from '../lib/format'
import { Field, Input, Select, useFormErrors } from '../components/form'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import type { Client, FinancialTransaction } from '../types'

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
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [summary, setSummary] = useState<{ income: number; expense: number; balance: number } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<TxForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { serverErrors, setServerErrors, handleSubmit } = useFormErrors()

  const load = useCallback(async () => {
    const params: Record<string, string> = {}
    if (type) params.type = type
    if (status) params.status = status
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    const { data } = await api.get<{ data: FinancialTransaction[] }>('/financial-transactions', { params })
    setTransactions(data.data)

    const reportParams: Record<string, string> = {}
    if (dateFrom) reportParams.date_from = dateFrom
    if (dateTo) reportParams.date_to = dateTo
    const report = await api.get<{ income: number; expense: number; balance: number }>('/financial/report', {
      params: reportParams,
    })
    setSummary(report.data)
  }, [type, status, dateFrom, dateTo])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setForm({ ...emptyForm, due_date: new Date().toISOString().slice(0, 10) })
    setServerErrors({})
    setError('')
    setModalOpen(true)
    api.get<{ data: Client[] }>('/clients/options').then(({ data }) => setClients(data.data)).catch(() => {})
  }

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
    await api.put(`/financial-transactions/${tx.id}`, {
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10),
    })
    await load()
  }

  const remove = async (tx: FinancialTransaction) => {
    if (!confirm('Excluir esta transação?')) return
    await api.delete(`/financial-transactions/${tx.id}`)
    await load()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Novo Lançamento
        </button>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Entradas"
            value={currency(summary.income)}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
            gradient="green"
          />
          <StatCard
            label="Saídas"
            value={currency(summary.expense)}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            }
            gradient="rose"
          />
          <StatCard
            label="Saldo do período"
            value={currency(summary.balance)}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l9 5 9-5-9-5-9 5zm0 6l9 5 9-5M3 18l9 5 9-5" />
              </svg>
            }
            gradient="slate"
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Descrição</th>
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
              <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{tx.description}</p>
                  {tx.service_order_id && (
                    <p className="text-xs text-slate-400">OS #{tx.service_order_id}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{tx.client?.name ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">{tx.category_label}</td>
                <td className="px-5 py-3 text-center text-slate-600">{tx.payment_method_label ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">{dateBR(tx.due_date)}</td>
                <td
                  className={`px-5 py-3 text-right font-bold ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '−'} {currency(tx.amount)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {tx.status_label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    {tx.type === 'income' && tx.status === 'pending' && (
                      <button
                        onClick={() => void markPaid(tx)}
                        className="rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Receber
                      </button>
                    )}
                    <button
                      onClick={() => void remove(tx)}
                      className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Novo Lançamento" open={modalOpen} onClose={() => setModalOpen(false)}>
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
    </div>
  )
}
