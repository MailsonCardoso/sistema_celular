import type { ServiceOrderStatusValue } from '../types'

const styles: Record<ServiceOrderStatusValue, string> = {
  opened: 'bg-blue-100 text-blue-700',
  awaiting_parts: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-violet-100 text-violet-700',
  awaiting_approval: 'bg-orange-100 text-orange-700',
  completed: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export default function StatusBadge({ status, label }: { status: ServiceOrderStatusValue; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {label}
    </span>
  )
}
