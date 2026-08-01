import { useEffect, useState } from 'react'
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
  notes: '',
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
      .get<{ data: User[] }>('/users', { params: { role: 'tecnico' } })
      .then(({ data }) => setTechnicians(data.data))
      .catch(() => {})
  }, [open])

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
    <Modal title="Nova Ordem de Serviço" open={open} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4">
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
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <Field label="Defeito relatado" required>
          <Textarea
            required
            rows={3}
            value={form.reported_issue}
            onChange={(e) => setForm({ ...form, reported_issue: e.target.value })}
            placeholder="Descreva o problema relatado pelo cliente..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Observações">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Opcional"
            />
          </Field>
        </div>

        {(error || serverErrors.client_id || serverErrors.reported_issue) && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error ||
              serverErrors.client_id?.[0] ||
              serverErrors.reported_issue?.[0] ||
              serverErrors.device_brand?.[0]}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Criando...' : 'Criar OS'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
