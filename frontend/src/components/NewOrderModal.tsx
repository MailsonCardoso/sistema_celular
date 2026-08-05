import { useEffect, useState, type ReactNode } from 'react'
import { User as UserIcon, Smartphone, ClipboardList, Package, CircleDollarSign } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { Field, Input, Select, Textarea, useFormErrors } from './form'
import Modal from './Modal'
import type { Client, ServiceOrder, User } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (order: ServiceOrder) => void
}

interface OrderForm {
  client_id: string
  technician_id: string
  device_brand: string
  device_model: string
  device_imei: string
  device_password: string
  reported_issue: string
  service_cost: string
  discount: string
  expected_delivery_at: string
  checklistItems: string[]
  checklistCondition: string[]
  notes: string
}

const emptyForm: OrderForm = {
  client_id: '',
  technician_id: '',
  device_brand: '',
  device_model: '',
  device_imei: '',
  device_password: '',
  reported_issue: '',
  service_cost: '',
  discount: '',
  expected_delivery_at: '',
  checklistItems: [],
  checklistCondition: [],
  notes: '',
}

const LEFT_ITEMS = ['Capa', 'Carregador', 'Chip', 'Caixa', 'Nota Fiscal', 'Fone/Headset', 'Cartão de memória']
const CONDITIONS = [
  'Tela trincada',
  'Risco/arranhão',
  'Molhado',
  'Bateria viciada',
  'Botões não funcionam',
  'Sem danos aparentes',
]

function SectionTitle({ number, title, icon }: { number: number; title: string; icon: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        {icon}
      </span>
      {number}. {title}
    </h3>
  )
}

function CheckChip({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  )
}

export default function NewOrderModal({ open, onClose, onCreated }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { serverErrors, setServerErrors, handleSubmit } = useFormErrors()

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setServerErrors({})
    setError('')
    api.get<{ data: Client[] }>('/clients/options').then(({ data }) => setClients(data.data)).catch(() => {})
  }, [open, setServerErrors])

  useEffect(() => {
    if (!open) return
    api
      .get<{ data: User[] }>('/users')
      .then(({ data }) =>
        setTechnicians(data.data.filter((u) => u.role === 'tecnico' || u.role === 'admin')),
      )
      .catch(() => {})
  }, [open])

  const toggleItem = (item: string) => {
    setForm((f) => ({
      ...f,
      checklistItems: f.checklistItems.includes(item)
        ? f.checklistItems.filter((i) => i !== item)
        : [...f.checklistItems, item],
    }))
  }

  const toggleCondition = (item: string) => {
    setForm((f) => ({
      ...f,
      checklistCondition: f.checklistCondition.includes(item)
        ? f.checklistCondition.filter((i) => i !== item)
        : [...f.checklistCondition, item],
    }))
  }

  const save = handleSubmit(async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        client_id: Number(form.client_id),
        technician_id: form.technician_id ? Number(form.technician_id) : null,
        device_brand: form.device_brand,
        device_model: form.device_model,
        device_imei: form.device_imei || null,
        device_password: form.device_password || null,
        reported_issue: form.reported_issue,
        service_cost: form.service_cost ? Number(form.service_cost) : 0,
        discount: form.discount ? Number(form.discount) : 0,
        expected_delivery_at: form.expected_delivery_at
          ? form.expected_delivery_at.replace('T', ' ')
          : null,
        checklist:
          form.checklistItems.length > 0 || form.checklistCondition.length > 0
            ? { items: form.checklistItems, condition: form.checklistCondition }
            : null,
        notes: form.notes || null,
      }
      const { data } = await api.post<{ data: ServiceOrder }>('/service-orders', payload)
      onCreated(data.data)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  })

  return (
    <Modal title="Nova Ordem de Serviço" open={open} onClose={onClose} wide icon={<ClipboardList className="h-4 w-4" />}>
      <form onSubmit={save} className="space-y-4">
        <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <SectionTitle
            number={1}
            title="Cliente e Responsável"
            icon={<UserIcon className="h-3.5 w-3.5" />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente" required>
              <Select
                required
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              >
                <option value="">Selecione...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Técnico responsável">
              <Select
                value={form.technician_id}
                onChange={(e) => setForm({ ...form, technician_id: e.target.value })}
              >
                <option value="">Não atribuído</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.role === 'admin' ? ' (Administrador)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <SectionTitle
            number={2}
            title="Dados do Dispositivo"
            icon={<Smartphone className="h-3.5 w-3.5" />}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca do aparelho" required>
              <Input
                required
                value={form.device_brand}
                onChange={(e) => setForm({ ...form, device_brand: e.target.value })}
                placeholder="Ex: Samsung"
              />
            </Field>
            <Field label="Modelo" required>
              <Input
                required
                value={form.device_model}
                onChange={(e) => setForm({ ...form, device_model: e.target.value })}
                placeholder="Ex: Galaxy S21"
              />
            </Field>
            <Field label="IMEI">
              <Input
                value={form.device_imei}
                onChange={(e) => setForm({ ...form, device_imei: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
            <Field label="Senha do aparelho">
              <Input
                value={form.device_password}
                onChange={(e) => setForm({ ...form, device_password: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <SectionTitle
            number={3}
            title="Problema e Checklist"
            icon={<ClipboardList className="h-3.5 w-3.5" />}
          />
          <Field label="Defeito relatado" required>
            <Textarea
              required
              rows={3}
              value={form.reported_issue}
              onChange={(e) => setForm({ ...form, reported_issue: e.target.value })}
              placeholder="Descreva o problema relatado pelo cliente..."
            />
          </Field>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Package className="h-3.5 w-3.5" />
                Itens deixados pelo cliente
              </p>
              <div className="flex flex-wrap gap-2">
                {LEFT_ITEMS.map((item) => (
                  <CheckChip
                    key={item}
                    label={item}
                    checked={form.checklistItems.includes(item)}
                    onChange={() => toggleItem(item)}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <Smartphone className="h-3.5 w-3.5" />
                Estado físico do aparelho
              </p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((item) => (
                  <CheckChip
                    key={item}
                    label={item}
                    checked={form.checklistCondition.includes(item)}
                    onChange={() => toggleCondition(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <SectionTitle
            number={4}
            title="Financeiro e Prazos"
            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor da mão de obra (R$)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.service_cost}
                onChange={(e) => setForm({ ...form, service_cost: e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Desconto (R$)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Previsão de entrega (data/hora)">
              <Input
                type="datetime-local"
                value={form.expected_delivery_at}
                onChange={(e) => setForm({ ...form, expected_delivery_at: e.target.value })}
              />
            </Field>
            <Field label="Observações">
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
          </div>
        </div>

        {(error || serverErrors.client_id || serverErrors.reported_issue) && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error ||
              serverErrors.client_id?.[0] ||
              serverErrors.reported_issue?.[0] ||
              serverErrors.device_brand?.[0]}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-400 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Criando...' : 'Criar OS'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
