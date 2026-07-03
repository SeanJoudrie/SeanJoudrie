import type { ReceiptSpec } from './receipts'
import { cents } from './schema'

/** The example specs' printed math must be internally consistent — otherwise the
 *  "recompute and flag mismatches" story would fire on our own examples. Dev only. */
export function assertReceipts(specs: ReceiptSpec[]): void {
  const errs: string[] = []
  const fail = (m: string) => errs.push(`  · ${m}`)

  const ids = new Set<string>()
  for (const s of specs) {
    if (ids.has(s.id)) fail(`duplicate example id ${s.id}`)
    ids.add(s.id)
    if (!s.items.length) fail(`${s.id}: no line items`)

    let sub = 0
    for (const it of s.items) {
      const amt = cents(it.qty * it.unitPrice)
      if (Math.abs(amt - cents(it.amount)) > 0.01) fail(`${s.id}: "${it.description}" amount ${it.amount} ≠ qty×unit ${amt}`)
      sub += amt
    }
    sub = cents(sub)
    if (Math.abs(sub - cents(s.subtotal)) > 0.01) fail(`${s.id}: subtotal ${s.subtotal} ≠ Σ items ${sub}`)
    if (Math.abs(cents(s.subtotal + s.tax) - cents(s.total)) > 0.01) fail(`${s.id}: total ${s.total} ≠ subtotal+tax`)
  }

  if (errs.length) throw new Error(`Ledger Lens example specs failed:\n${errs.join('\n')}`)
}
