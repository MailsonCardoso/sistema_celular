import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../lib/api'
import { Field, Input, useFormErrors } from '../components/form'
import Modal from '../components/Modal'
import LimitGate from '../components/LimitGate'
import StatCard from '../components/StatCard'
import type { Client } from '../types'

interface ClientForm {
  name: string
  cpf_cnpj: string
  email: string
  phone: string
  address: string
}

const emptyForm: ClientForm = { name: '', cpf_cnpj: '', email: '', phone: '', address: '' }

const icons = {
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  active: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  inactive: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  search: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  phone: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  mail: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  orders: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  edit: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  power: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  trash: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
}

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

  const stats = useMemo(() => {
    const total = clients.length
    const active = clients.filter((c) => c.status === 'active').length
    return { total, active, inactive: total - active }
  }, [clients])

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

  const remove = async (client: Client) => {
    if (!confirm(`Excluir "${client.name}"?`)) return
    try {
      await api.delete(`/clients/${client.id}`)
      await load(search)
    } catch (err) {
      alert(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <LimitGate limit="can_create_client" feature="Cadastrar novos clientes">
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Novo Cliente
          </button>
        </LimitGate>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Clientes" value={stats.total} icon={icons.users} gradient="violet" />
        <StatCard label="Ativos" value={stats.active} icon={icons.active} gradient="emerald" />
        <StatCard label="Inativos" value={stats.inactive} icon={icons.inactive} gradient="slate" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icons.search}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">CPF/CNPJ</th>
              <th className="px-5 py-3">Contato</th>
              <th className="px-5 py-3 text-center">OSs</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                <td className="px-5 py-3.5">
                  <Link to={`/clientes/${client.id}`} className="group flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        client.status === 'active'
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}
                    >
                      {client.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800 group-hover:text-indigo-600 group-hover:underline">
                      {client.name}
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{client.cpf_cnpj ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="space-y-1 text-xs text-slate-600">
                    {client.phone && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-400">{icons.phone}</span>
                        {client.phone}
                      </p>
                    )}
                    {client.email && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-400">{icons.mail}</span>
                        <span className="truncate">{client.email}</span>
                      </p>
                    )}
                    {!client.phone && !client.email && <p className="text-slate-400">—</p>}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                    {icons.orders}
                    {client.service_orders_count ?? 0}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => openEdit(client)}
                      title="Editar"
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {icons.edit}
                    </button>
                    <button
                      onClick={() => void toggleStatus(client)}
                      title={client.status === 'active' ? 'Inativar' : 'Ativar'}
                      className={`rounded-lg border p-2 transition ${
                        client.status === 'active'
                          ? 'border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {icons.power}
                    </button>
                    <button
                      onClick={() => void remove(client)}
                      title="Excluir"
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                      {icons.trash}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
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
