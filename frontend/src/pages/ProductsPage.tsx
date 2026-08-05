import { useCallback, useEffect, useMemo, useState } from 'react'
import { Package, TriangleAlert, CreditCard, Search, Pencil, Zap, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { currency } from '../lib/format'
import { Field, Input, Select, Textarea, useFormErrors } from '../components/form'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import LimitGate from '../components/LimitGate'
import SimplePaginator from '../components/SimplePaginator'
import StatCard from '../components/StatCard'
import type { Product } from '../types'

interface ProductForm {
  name: string
  description: string
  category: 'peca' | 'acessorio'
  brand: string
  cost_price: string
  selling_price: string
  stock_quantity: string
  min_stock_quantity: string
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  category: 'peca',
  brand: '',
  cost_price: '',
  selling_price: '',
  stock_quantity: '0',
  min_stock_quantity: '0',
}

const icons = {
  box: <Package className="h-5 w-5" />,
  alert: <TriangleAlert className="h-5 w-5" />,
  value: <CreditCard className="h-5 w-5" />,
  search: <Search className="h-4 w-4" />,
  edit: <Pencil className="h-4 w-4" />,
  power: <Zap className="h-4 w-4" />,
  trash: <Trash2 className="h-4 w-4" />,
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<{ stock_value: number; total_items: number } | null>(null)
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number; per_page: number } | null>(
    null,
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { serverErrors, setServerErrors, handleSubmit } = useFormErrors()

  const load = useCallback(async () => {
    const params: Record<string, string | number | undefined> = { per_page: 10, page }
    if (search) params.search = search
    if (category) params.category = category
    if (onlyLowStock) params.low_stock = '1'
    const { data } = await api.get<{
      data: Product[]
      meta: { current_page: number; last_page: number; total: number; per_page: number }
    }>('/products', { params })
    setProducts(data.data)
    setMeta(data.meta)
    api
      .get<{ stock_value: number; total_items: number }>('/products/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => {})
  }, [search, category, onlyLowStock, page])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.is_low_stock).length
    return {
      totalItems: summary?.total_items ?? 0,
      lowStock,
      stockValue: summary?.stock_value ?? 0,
    }
  }, [products, summary])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setServerErrors({})
    setError('')
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      brand: product.brand ?? '',
      cost_price: String(product.cost_price),
      selling_price: String(product.selling_price),
      stock_quantity: String(product.stock_quantity),
      min_stock_quantity: String(product.min_stock_quantity),
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
        name: form.name,
        description: form.description || null,
        category: form.category,
        brand: form.brand || null,
        cost_price: form.cost_price ? Number(form.cost_price) : 0,
        selling_price: Number(form.selling_price),
        stock_quantity: Number(form.stock_quantity) || 0,
        min_stock_quantity: Number(form.min_stock_quantity) || 0,
      }
      if (editing) {
        await api.patch(`/products/${editing.id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  })

  const toggleStatus = async (product: Product) => {
    await api.patch(`/products/${product.id}`, { status: product.status === 'active' ? 'inactive' : 'active' })
    await load()
  }

  const remove = async (product: Product) => {
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/products/${product.id}`)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      alert(errorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Estoque</h1>
        <LimitGate limit="can_create_product" feature="Cadastrar novas peças no estoque">
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Nova Peça
          </button>
        </LimitGate>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Itens em estoque" value={stats.totalItems} icon={icons.box} gradient="blue" />
        <StatCard
          label="Estoque baixo"
          value={stats.lowStock}
          hint={stats.lowStock > 0 ? 'Necessita reposição' : 'Tudo em ordem'}
          icon={icons.alert}
          gradient="orange"
        />
        <StatCard label="Valor em estoque" value={currency(stats.stockValue)} icon={icons.value} gradient="green" />
      </div>

      {stats.lowStock > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md">
            {icons.alert}
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-800">
              {stats.lowStock} {stats.lowStock === 1 ? 'peça está' : 'peças estão'} com estoque baixo
            </p>
            <p className="text-xs text-orange-600">Ative o filtro abaixo ou cadastre novas peças para reposição.</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icons.search}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou marca..."
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todas categorias</option>
          <option value="peca">Peças</option>
          <option value="acessorio">Acessórios</option>
        </select>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Somente estoque baixo
        </label>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
          Nenhum produto encontrado.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {products.map((product) => {
              const margin =
                product.cost_price > 0
                  ? Math.round(((product.selling_price - product.cost_price) / product.cost_price) * 100)
                  : null
              const stockMax = Math.max(product.min_stock_quantity * 2, product.stock_quantity, 1)
              return (
                <div key={product.id} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{product.name}</p>
                      {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.category === 'peca' ? 'bg-indigo-50 text-indigo-700' : 'bg-violet-50 text-violet-700'
                      }`}
                    >
                      {product.category_label}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Custo</p>
                      <p className="text-sm text-slate-600">{currency(product.cost_price)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Venda</p>
                      <p className="text-sm font-semibold text-slate-800">{currency(product.selling_price)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Margem</p>
                      {margin !== null ? (
                        <p
                          className={`text-sm font-semibold ${
                            margin >= 50 ? 'text-emerald-700' : margin >= 20 ? 'text-blue-700' : 'text-amber-700'
                          }`}
                        >
                          {margin}%
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400">—</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Estoque</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-bold ${
                          product.is_low_stock ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-1.5 rounded-full ${product.is_low_stock ? 'bg-orange-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (product.stock_quantity / stockMax) * 100)}%` }}
                      />
                    </div>
                    {product.is_low_stock && (
                      <p className="mt-1 text-xs font-semibold text-orange-600">min {product.min_stock_quantity}</p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(product)}
                        title="Editar"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {icons.edit}
                      </button>
                      <button
                        onClick={() => void toggleStatus(product)}
                        title={product.status === 'active' ? 'Inativar' : 'Ativar'}
                        className={`rounded-lg border p-2 transition ${
                          product.status === 'active'
                            ? 'border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {icons.power}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product)}
                        title="Excluir"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        {icons.trash}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Produto</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3 text-right">Custo</th>
              <th className="px-5 py-3 text-right">Venda</th>
              <th className="px-5 py-3 text-right">Margem</th>
              <th className="px-5 py-3">Estoque</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const margin =
                product.cost_price > 0 ? Math.round(((product.selling_price - product.cost_price) / product.cost_price) * 100) : null
              const stockMax = Math.max(product.min_stock_quantity * 2, product.stock_quantity, 1)
              return (
                <tr key={product.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{product.name}</p>
                    {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.category === 'peca'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}
                    >
                      {product.category_label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-500">{currency(product.cost_price)}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-800">{currency(product.selling_price)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {margin !== null && (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          margin >= 50 ? 'bg-emerald-50 text-emerald-700' : margin >= 20 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {margin}%
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${product.is_low_stock ? 'bg-orange-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (product.stock_quantity / stockMax) * 100)}%` }}
                        />
                      </div>
                      <span
                        className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          product.is_low_stock ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                      {product.is_low_stock && (
                        <span className="text-xs font-semibold text-orange-600">min {product.min_stock_quantity}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(product)}
                        title="Editar"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {icons.edit}
                      </button>
                      <button
                        onClick={() => void toggleStatus(product)}
                        title={product.status === 'active' ? 'Inativar' : 'Ativar'}
                        className={`rounded-lg border p-2 transition ${
                          product.status === 'active'
                            ? 'border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {icons.power}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product)}
                        title="Excluir"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        {icons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          </div>

          {meta && (
            <SimplePaginator
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              onPage={(p) => setPage(p)}
            />
          )}
        </>
      )}

      <Modal title={editing ? 'Editar Produto' : 'Nova Peça'} open={modalOpen} onClose={() => setModalOpen(false)} icon={<Package className="h-4 w-4" />}>
        <form onSubmit={save} className="space-y-4">
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <Field label="Nome" required>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Bateria iPhone 12"
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria" required>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as 'peca' | 'acessorio' })}
                >
                  <option value="peca">Peça</option>
                  <option value="acessorio">Acessório</option>
                </Select>
              </Field>
              <Field label="Marca">
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço de custo (R$)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                />
              </Field>
              <Field label="Preço de venda (R$)" required>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantidade em estoque">
                <Input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                />
              </Field>
              <Field label="Estoque mínimo (alerta)">
                <Input
                  type="number"
                  min="0"
                  value={form.min_stock_quantity}
                  onChange={(e) => setForm({ ...form, min_stock_quantity: e.target.value })}
                />
              </Field>
            </div>
          </div>

          {(error || serverErrors.name) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error || serverErrors.name?.[0] || serverErrors.selling_price?.[0]}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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

      <ConfirmModal
        open={confirmDelete !== null}
        title="Excluir produto"
        loading={deleting}
        message={
          <>
            Tem certeza que deseja excluir{' '}
            <strong className="text-slate-900">{confirmDelete?.name}</strong> do estoque?
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
