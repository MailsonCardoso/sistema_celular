import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../lib/api'
import { Field, Input, useFormErrors } from '../components/form'
import Modal from '../components/Modal'
import LimitGate from '../components/LimitGate'
import type { Client } from '../types'

interface ClientForm {
  name: string
  cpf_cnpj: string
  email: string
  phone: string
  address: string
}

const emptyForm: ClientForm = { name: '', cpf_cnpj: '', email: '', phone: '', address: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { serverErrors, setServerErrors, handleSubmit } = useFormErrors()

  const load = useCallback(async (term = '') => {
    const { data } = await api.get<{ data: Client[] }>('/clients', { params: { search: term || undefined } })
    setClients(data.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => void load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setServerErrors({})
    setError('')
    setModalOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setForm({
      name: client.name,
      cpf_cnpj: client.cpf_cnpj ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
    })
    setServerErrors({})
    setError('')
    setModalOpen(true)
  }

  const save = handleSubmit(async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        cpf_cnpj: form.cpf_cnpj || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
      }
      if (editing) {
        await api.put(`/clients/${editing.id}`, payload)
      } else {
        await api.post('/clients', payload)
      }
      setModalOpen(false)
      await load(search)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
      return
    }
    setSaving(false)
  })

  const toggleStatus = async (client: Client) => {
    await api.put(`/clients/${client.id}`, {
      status: client.status === 'active' ? 'inactive' : 'active',
    })
    await load(search)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <LimitGate limit="can_create_client" feature="Cadastrar novos clientes">
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Novo Cliente
          </button>
        </LimitGate>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">CPF/CNPJ</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">E-mail</th>
              <th className="px-5 py-3">OSs</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-indigo-600">
                  <Link to={`/clientes/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{client.cpf_cnpj ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">{client.phone ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">{client.email ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">{client.service_orders_count ?? 0}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(client)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => void toggleStatus(client)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {client.status === 'active' ? 'Inativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? 'Editar Cliente' : 'Novo Cliente'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Nome completo" required>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do cliente"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="CPF/CNPJ">
              <Input
                value={form.cpf_cnpj}
                onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                placeholder="000.000.000-00"
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </Field>
          </div>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </Field>
          <Field label="Endereço">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Rua, número, bairro, cidade"
            />
          </Field>

          {(error || serverErrors.name || serverErrors.cpf_cnpj) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error ||
                serverErrors.name?.[0] ||
                serverErrors.cpf_cnpj?.[0] ||
                serverErrors.email?.[0]}
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
