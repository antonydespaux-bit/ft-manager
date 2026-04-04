export function formatEuro(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function formatPct(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function formatQte(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}
