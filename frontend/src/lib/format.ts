export const currency = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))

export const dateBR = (value: string | null | undefined): string => {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const datetimeBR = (value: string | null | undefined): string => {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
