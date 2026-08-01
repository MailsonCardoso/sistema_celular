interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: React.ReactNode
  gradient: string
}

const gradientMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  green: 'from-green-500 to-green-600',
  rose: 'from-rose-500 to-rose-600',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-600 to-slate-700',
  orange: 'from-orange-500 to-orange-600',
}

export default function StatCard({ label, value, hint, icon, gradient }: StatCardProps) {
  const g = gradientMap[gradient] ?? gradientMap.slate

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-white shadow-md`}
        >
          {icon}
        </div>
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${g} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
    </div>
  )
}
