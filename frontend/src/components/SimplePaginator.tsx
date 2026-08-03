interface SimplePaginatorProps {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
  onPage: (page: number) => void
}

export default function SimplePaginator({ currentPage, lastPage, total, perPage, onPage }: SimplePaginatorProps) {
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, total)

  const range: (number | string)[] = []
  const maxNumbers = 3
  if (lastPage <= maxNumbers + 2) {
    for (let i = 1; i <= lastPage; i++) range.push(i)
  } else {
    range.push(1)
    if (currentPage > 3) range.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(lastPage - 1, currentPage + 1)
    for (let i = start; i <= end; i++) range.push(i)
    if (currentPage < lastPage - 2) range.push('ellipsis')
    range.push(lastPage)
  }

  if (lastPage <= 1) return null

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-4 text-sm text-slate-600 sm:flex-row">
      <p className="text-xs text-slate-500">
        {from}–{to} de {total} itens
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        {range.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                p === currentPage
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPage(Math.min(lastPage, currentPage + 1))}
          disabled={currentPage >= lastPage}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
