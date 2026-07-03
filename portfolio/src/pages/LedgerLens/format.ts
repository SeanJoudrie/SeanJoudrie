/** Money in the receipt's currency; falls back to a bare number if the code is odd. */
export function fmtMoney(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase().slice(0, 3),
    }).format(n)
  } catch {
    return n.toFixed(2)
  }
}

export const fmtPct = (x: number) => `${Math.round(x * 100)}%`

/** A human date if parseable, else the raw string the model returned. */
export function fmtDate(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s || '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
