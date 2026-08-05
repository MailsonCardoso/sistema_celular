import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal'
import type { Store, SubscriptionStatus } from '../types'

const statusStyles: Record<SubscriptionStatus, string> = {
  trial_active: 'bg-amber-100 text-amber-700',
  full_access: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-rose-100 text-rose-700',
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmStore, setConfirmStore] = useState<Store | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get<{ data: Store[] }>(`/admin/stores?${params.toString()}`)
      setStores(data.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
  }, [load])

  const changeStatus = async (store: Store, status: SubscriptionStatus) => {
    try {
      await api.patch(`/admin/stores/${store.id}/status`, { status })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const remove = async (store: Store) => {
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/admin/stores/${store.id}`)
      setConfirmStore(null)
      await load()
    } catch (err) {
      setError(errorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lojas</h1>
          <p className="text-sm text-slate-500">Gerencie os planos e o acesso das lojas cadastradas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar loja..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-56"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="trial_active">Trial</option>
            <option value="full_access">Plano completo</option>
            <option value="expired">Suspensa</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <ConfirmModal
        open={confirmStore !== null}
        title="Excluir loja"
        loading={deleting}
        message={
          <>
            Excluir a loja{' '}
            <strong className="text-slate-900">{confirmStore?.store_name}</strong> e{' '}
            <strong>TODOS</strong> os seus dados (clientes, OSs, estoque, financeiro e usuários)?
            <br />
            <span className="font-medium text-rose-600">Esta ação não pode ser desfeita.</span>
          </>
        }
        onCancel={() => setConfirmStore(null)}
        onConfirm={() => confirmStore && void remove(confirmStore)}
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Carregando lojas...</p>
      ) : stores.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Nenhuma loja encontrada.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {stores.map((store) => (
              <div key={store.id} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{store.store_name}</p>
                    <p className="truncate text-xs text-slate-500">Responsável: {store.owner_name}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      store.subscription_status
                        ? statusStyles[store.subscription_status]
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {store.subscription_label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <p className="text-lg font-bold text-slate-800">{store.counts?.users ?? 0}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Usuários</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <p className="text-lg font-bold text-slate-800">{store.counts?.clients ?? 0}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Clientes</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <p className="text-lg font-bold text-slate-800">{store.counts?.service_orders ?? 0}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">OSs</p>
                  </div>
                </div>

                <div className="mt-3 space-y-0.5 text-xs text-slate-500">
                  <p className="truncate">{store.email}</p>
                  <p>{store.cnpj_cpf ?? 'Sem CNPJ/CPF'}</p>
                  {store.trial_limit_at && (
                    <p>Trial até {new Date(store.trial_limit_at).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {store.subscription_status !== 'full_access' && (
                    <button
                      onClick={() => changeStatus(store, 'full_access')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Liberar
                    </button>
                  )}
                  {store.subscription_status === 'full_access' && (
                    <button
                      onClick={() => changeStatus(store, 'trial_active')}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                    >
                      Reativar Trial
                    </button>
                  )}
                  {store.subscription_status !== 'expired' && (
                    <button
                      onClick={() => changeStatus(store, 'expired')}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                    >
                      Suspender
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmStore(store)}
                    title="Excluir loja e todos os dados"
                    className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Loja
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contatos
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Uso
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plano
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{store.store_name}</p>
                    <p className="text-xs text-slate-500">Responsável: {store.owner_name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{store.email}</p>
                    <p className="text-xs text-slate-500">{store.cnpj_cpf ?? 'Sem CNPJ/CPF'}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    <p>{store.counts?.users ?? 0} usuários</p>
                    <p>{store.counts?.clients ?? 0} clientes</p>
                    <p>{store.counts?.service_orders ?? 0} OSs</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        store.subscription_status ? statusStyles[store.subscription_status] : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {store.subscription_label}
                    </span>
                    {store.trial_limit_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Trial até {new Date(store.trial_limit_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {store.subscription_status !== 'full_access' && (
                      <button
                        onClick={() => changeStatus(store, 'full_access')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Liberar
                      </button>
                    )}
                    {store.subscription_status === 'full_access' && (
                      <button
                        onClick={() => changeStatus(store, 'trial_active')}
                        className="mr-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                      >
                        Reativar Trial
                      </button>
                    )}
                    {store.subscription_status !== 'expired' && (
                      <button
                        onClick={() => changeStatus(store, 'expired')}
                        className="ml-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                      >
                        Suspender
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmStore(store)}
                      title="Excluir loja e todos os dados"
                      className="ml-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  )
}
