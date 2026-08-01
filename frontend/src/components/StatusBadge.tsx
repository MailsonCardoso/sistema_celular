import type { ServiceOrderStatusValue } from '../types'

const styles: Record<ServiceOrderStatusValue, { badge: string; dot: string; accent: string }> = {
  opened: { badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', accent: 'border-l-sky-400' },
  awaiting_parts: { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', accent: 'border-l-amber-400' },
  in_progress: { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', accent: 'border-l-violet-400' },
  awaiting_approval: { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', accent: 'border-l-orange-400' },
  completed: { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', accent: 'border-l-emerald-400' },
  delivered: { badge: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500', accent: 'border-l-teal-400' },
  cancelled: { badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', accent: 'border-l-rose-400' },
}

export default function StatusBadge({ status, label }: { status: ServiceOrderStatusValue; label: string }) {
  const s = styles[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  )
}
