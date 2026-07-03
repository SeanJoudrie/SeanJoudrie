import type { EditModel } from './schema'
import { lineAmount, derivedSubtotal, derivedTotal } from './schema'

/** RFC-4180-ish CSV cell quoting. */
function q(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Export uses DERIVED amounts/subtotal/total — the numbers the visitor actually sees. */
export function toCSV(m: EditModel): string {
  const rows: string[] = []
  rows.push(['merchant', 'date', 'currency'].join(','))
  rows.push([q(m.merchant), q(m.date), q(m.currency)].join(','))
  rows.push('')
  rows.push(['description', 'qty', 'unitPrice', 'amount', 'category'].join(','))
  for (const l of m.lines) {
    rows.push([q(l.description), l.qty, l.unitPrice.toFixed(2), lineAmount(l).toFixed(2), q(l.category)].join(','))
  }
  rows.push('')
  rows.push(['subtotal', derivedSubtotal(m.lines).toFixed(2)].join(','))
  rows.push(['tax', m.tax.toFixed(2)].join(','))
  rows.push(['total', derivedTotal(m.lines, m.tax).toFixed(2)].join(','))
  return rows.join('\n')
}

export function toJSON(m: EditModel): string {
  return JSON.stringify(
    {
      merchant: m.merchant,
      date: m.date,
      currency: m.currency,
      lineItems: m.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
        amount: lineAmount(l),
        category: l.category,
      })),
      subtotal: derivedSubtotal(m.lines),
      tax: m.tax,
      total: derivedTotal(m.lines, m.tax),
    },
    null,
    2,
  )
}

export function download(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
