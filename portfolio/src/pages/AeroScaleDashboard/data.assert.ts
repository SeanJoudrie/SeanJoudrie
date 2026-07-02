import type { Dataset } from './data'
import { TIER_ORDER } from './data'

/**
 * The dataset's contract, enforced: fintech reviewers sanity-check demo
 * numbers, so the numbers prove themselves instead. Runs in dev (imported
 * dynamically from data.ts) and in the standalone data check — never in the
 * production bundle.
 */
export function assertInvariants(ds: Dataset): void {
  const errs: string[] = []
  const fail = (msg: string) => errs.push(`  · ${msg}`)
  const pct = (x: number) => `${(x * 100).toFixed(2)}%`

  const { months, transactions } = ds
  if (months.length !== 12) fail(`expected 12 months, got ${months.length}`)

  months.forEach((row, m) => {
    const at = `${row.label}:`

    // Tiers sum to the headline, ARR is exactly MRR × 12.
    const tierSum = TIER_ORDER.reduce((s, id) => s + row.tiers[id].mrr, 0)
    if (Math.abs(tierSum - row.mrr) > 0.01) fail(`${at} tiers sum ${tierSum} ≠ MRR ${row.mrr}`)
    if (Math.abs(row.arr - row.mrr * 12) > 1e-6) fail(`${at} ARR ≠ MRR × 12`)

    // The ledger identity: closing = opening + new + expansion − contraction − churn.
    for (const id of TIER_ORDER) {
      const t = row.tiers[id]
      const closing = t.openingMrr + t.newMrr + t.expansionMrr - t.contractionMrr - t.churnedMrr
      if (Math.abs(closing - t.mrr) > 0.01) fail(`${at} ${id} ledger identity broken`)
      if (t.customers < 0 || !Number.isInteger(t.customers)) fail(`${at} ${id} customers not a whole number`)
      const prevMrr = m > 0 ? months[m - 1].tiers[id].mrr : null
      if (prevMrr !== null && Math.abs(t.openingMrr - prevMrr) > 0.01) fail(`${at} ${id} opening ≠ prior close`)
    }

    // Churn stays plausible every single month.
    if (row.churnRate < 0.012 || row.churnRate > 0.042) fail(`${at} churn ${pct(row.churnRate)} out of range`)

    // Unit economics stay in the healthy band.
    const ratio = row.ltv / row.cac
    if (ratio < 3.2 || ratio > 5) fail(`${at} LTV:CAC ${ratio.toFixed(2)} outside 3.2–5`)
    if (row.netRevenue <= 0) fail(`${at} net revenue not positive`)

    // Enterprise launches in October — zero before, real after.
    if (m < 3 && row.tiers.ent.mrr !== 0) fail(`${at} Enterprise has revenue before launch`)
    if (m >= 3 && row.tiers.ent.mrr <= 0) fail(`${at} Enterprise flat after launch`)
  })

  // The headline story: MRR $100k → $200k (ARR $1.2M → $2.4M).
  const first = months[0]
  const last = months[months.length - 1]
  if (first.mrr < 95_000 || first.mrr > 106_000) fail(`opening MRR ${Math.round(first.mrr)} misses ~$100k`)
  if (last.mrr < 190_000 || last.mrr > 212_000) fail(`closing MRR ${Math.round(last.mrr)} misses ~$200k`)

  const avgChurn = months.reduce((s, r) => s + r.churnRate, 0) / months.length
  if (avgChurn < 0.018 || avgChurn > 0.025) fail(`average churn ${pct(avgChurn)} outside 1.8–2.5%`)

  const entShare = last.tiers.ent.mrr / last.mrr
  if (entShare < 0.4 || entShare > 0.5) fail(`Enterprise ends at ${pct(entShare)} of revenue, wanted ~45%`)

  const spike = months[7].churnRate
  const around = (months[6].churnRate + months[8].churnRate) / 2
  if (spike <= around * 1.3) fail(`February churn spike missing (${pct(spike)} vs ${pct(around)} around it)`)

  if (transactions.length !== 10) fail(`expected 10 transactions, got ${transactions.length}`)
  if (new Set(transactions.map((t) => t.company)).size !== transactions.length) fail('duplicate transaction companies')
  transactions.forEach((t) => {
    if (t.mrr <= 0) fail(`${t.company}: non-positive MRR`)
  })

  if (errs.length) {
    throw new Error(`AeroScale dataset invariants failed:\n${errs.join('\n')}`)
  }
}
