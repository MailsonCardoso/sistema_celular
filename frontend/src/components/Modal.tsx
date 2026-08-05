import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  wide?: boolean
  icon?: ReactNode
}

export default function Modal({ title, open, onClose, children, wide, icon }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`custom-scrollbar relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-200/60 bg-slate-50 shadow-2xl shadow-violet-900/10 sm:rounded-2xl ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-white via-white to-violet-50/60 px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-2.5 text-base font-semibold text-slate-800">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/30">
                {icon}
              </span>
            )}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  )
}
