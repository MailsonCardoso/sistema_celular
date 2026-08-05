import { useState, type FormEvent } from 'react'
import { Save, Building2 } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Field, Input } from '../components/form'

export default function SettingsPage() {
  const { store, refreshStore } = useAuth()
  const [storeName, setStoreName] = useState(store?.store_name ?? '')
  const [ownerName, setOwnerName] = useState(store?.owner_name ?? '')
  const [cnpjCpf, setCnpjCpf] = useState(store?.cnpj_cpf ?? '')
  const [email, setEmail] = useState(store?.email ?? '')
  const [phone, setPhone] = useState(store?.phone ?? '')
  const [address, setAddress] = useState(store?.address ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.patch('/store', {
        store_name: storeName.trim(),
        owner_name: ownerName.trim(),
        cnpj_cpf: cnpjCpf.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      })
      await refreshStore()
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Building2 className="h-6 w-6 text-indigo-600" />
          Configurações
        </h1>
        <p className="text-sm text-slate-500">
          Dados da sua loja usados no cabeçalho da OS ao imprimir.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Dados da loja salvos com sucesso.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome da loja" required>
            <Input required value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex.: TechCell Assistência" />
          </Field>
          <Field label="Responsável" required>
            <Input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Ex.: João da Silva" />
          </Field>
          <Field label="CPF / CNPJ">
            <Input value={cnpjCpf} onChange={(e) => setCnpjCpf(e.target.value)} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="E-mail" required>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@loja.com" />
          </Field>
          <Field label="Telefone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="Endereço">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </Field>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}
