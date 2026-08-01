import { useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import TrialLimitModal from './TrialLimitModal'

type LimitKey =
  | 'can_create_os'
  | 'can_create_client'
  | 'can_create_product'
  | 'can_see_history'
  | 'can_see_financial'
  | 'can_export'

interface LimitGateProps {
  limit: LimitKey
  feature: string
  children: ReactNode
  className?: string
}

export default function LimitGate({ limit, feature, children, className }: LimitGateProps) {
  const { user, limits } = useAuth()
  const [open, setOpen] = useState(false)

  const blocked = !limits?.[limit]

  if (!blocked || user?.role === 'super_admin') return <>{children}</>

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Bloqueado no plano Trial: ${feature}`}
        className={`inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 ${className ?? ''}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        {feature}
      </button>
      {open && <TrialLimitModal feature={feature} onClose={() => setOpen(false)} />}
    </>
  )
}
