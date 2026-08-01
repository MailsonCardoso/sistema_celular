import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { currency } from '../lib/format'
import { Field, Input, Select, Textarea, useFormErrors } from '../components/form'
import Modal from '../components/Modal'
import LimitGate from '../components/LimitGate'
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { serverErrors, setServerErrors, handleSubmit } = useFormErrors()

  const load = useCallback(async () => {
    const params: Record<string, string> = { per_page: '100' }
    if (search) params.search = search
    if (category) params.category = category
    if (onlyLowStock) params.low_stock = '1'
    const { data } = await api.get<{ data: Product[] }>('/products', { params })
    setProducts(data.data)
  }, [search, category, onlyLowStock])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

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
        await api.put(`/products/${editing.id}`, payload)
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
    await api.put(`/products/${product.id}`, { status: product.status === 'active' ? 'inactive' : 'active' })
    await load()
  }

  const remove = async (product: Product) => {
    if (!confirm(`Excluir "${product.name}"?`)) return
    setError('')
    try {
      await api.delete(`/products/${product.id}`)
      await load()
    } catch (err) {
      alert(errorMessage(err))
    }
  }

  const lowStockCount = products.filter((p) => p.is_low_stock).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque</h1>
          {lowStockCount > 0 && (
            <p className="mt-1 text-sm font-medium text-orange-600">
              ⚠️ {lowStockCount} {lowStockCount === 1 ? 'peça está' : 'peças estão'} com estoque baixo
            </p>
          )}
        </div>
        <LimitGate limit="can_create_product" feature="Cadastrar novas peças no estoque">
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Nova Peça
          </button>
        </LimitGate>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou marca..."
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todas categorias</option>
          <option value="peca">Peças</option>
          <option value="acessorio">Acessórios</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Somente estoque baixo
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Produto</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3">Marca</th>
              <th className="px-5 py-3 text-right">Custo</th>
              <th className="px-5 py-3 text-right">Venda</th>
              <th className="px-5 py-3 text-center">Estoque</th>
              <th className="px-5 py-3 text-center">Mínimo</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                  product.is_low_stock ? 'bg-orange-50/60' : ''
                }`}
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{product.name}</p>
                  {product.is_low_stock && (
                    <p className="text-xs font-semibold text-orange-600">⚠️ Estoque baixo</p>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{product.category_label}</td>
                <td className="px-5 py-3 text-slate-600">{product.brand ?? '—'}</td>
                <td className="px-5 py-3 text-right text-slate-600">{currency(product.cost_price)}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-800">{currency(product.selling_price)}</td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      product.is_low_stock ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-slate-600">{product.min_stock_quantity}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => void toggleStatus(product)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {product.status === 'active' ? 'Inativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => void remove(product)}
                      className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? 'Editar Produto' : 'Nova Peça'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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

          {(error || serverErrors.name) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error || serverErrors.name?.[0] || serverErrors.selling_price?.[0]}
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
