import { useAuth } from '../context/AuthContext'

interface TrialLimitModalProps {
  feature: string
  onClose: () => void
}

export default function TrialLimitModal({ feature, onClose }: TrialLimitModalProps) {
  const { store } = useAuth()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Recurso bloqueado no plano Trial</h2>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium">{feature}</span> está disponível somente após a assinatura do
          plano completo.
        </p>
        <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
          Sua loja está no período de avaliação até{' '}
          <span className="font-semibold text-slate-700">
            {store?.trial_limit_at ? new Date(store.trial_limit_at).toLocaleDateString('pt-BR') : '—'}
          </span>
          . Contrate o plano completo com a equipe {store?.store_name ?? 'da plataforma'} para liberar
          todos os recursos.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
