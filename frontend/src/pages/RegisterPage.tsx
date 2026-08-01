import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api, errorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
      await api.post('/register', {
        store_name: storeName,
        owner_name: ownerName,
        cnpj_cpf: cnpjCpf || null,
        phone: phone || null,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-teal-600/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white">OmniOS</p>
            <p className="text-xs text-emerald-300">Gestão para assistências técnicas</p>
          </div>
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Trial grátis de 30 dias
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight text-white">
            Monte sua loja em <span className="text-emerald-400">menos de 2 minutos</span>
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Sem cartão de crédito e sem compromisso
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Sistema completo: OS, estoque, financeiro e clientes
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Adicione sua equipe (técnicos e atendentes) quando quiser
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          Já é cliente?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Fazer login
          </button>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Criar minha loja</h1>
            <p className="mt-1 text-sm text-slate-400">Plano Trial de 30 dias — sem cartão de crédito</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="store_name">
                  Nome da loja
                </label>
                <input
                  id="store_name"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ex.: CellFix Express"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="owner_name">
                  Seu nome
                </label>
                <input
                  id="owner_name"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cnpj_cpf">
                    CNPJ/CPF
                  </label>
                  <input
                    id="cnpj_cpf"
                    value={cnpjCpf}
                    onChange={(e) => setCnpjCpf(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">
                    Telefone
                  </label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                  E-mail de acesso
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password_confirmation">
                    Confirmar senha
                  </label>
                  <input
                    id="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Criando conta...' : 'Criar minha loja grátis'}
              </button>

              <p className="text-center text-xs">
                <span className="text-slate-400">Já tem uma loja? </span>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
