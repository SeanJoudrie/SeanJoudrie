import { DATA_TODAY, HUBS, PRIORITIES, ROW_COUNT, SERVICES, STATUSES, type Row } from './schema'

/**
 * The manifest's contract, enforced in dev only (dynamic import from
 * generate.ts, never in the production chunk). Freight reviewers gut-check
 * demo data; these prove the numbers instead of trusting them.
 */
export function assertRows(rows: Row[]): void {
  const errs: string[] = []
  const fail = (m: string) => errs.push(`  · ${m}`)
  const today = Date.parse(`${DATA_TODAY}T00:00:00Z`)
  const ms = (d: string) => Date.parse(`${d}T00:00:00Z`)

  if (rows.length !== ROW_COUNT) fail(`expected ${ROW_COUNT} rows, got ${rows.length}`)
  if (new Set(rows.map((r) => r.id)).size !== rows.length) fail('shipment ids not unique')

  const statusCount: Record<string, number> = {}
  let exceptions = 0

  rows.forEach((r, i) => {
    const at = `${r.id} (row ${i}):`
    if (r.origin === r.destination) fail(`${at} origin == destination`)
    if (!HUBS.includes(r.origin) || !HUBS.includes(r.destination)) fail(`${at} bad hub`)
    if (!SERVICES.includes(r.service)) fail(`${at} bad service`)
    if (!STATUSES.includes(r.status)) fail(`${at} bad status`)
    if (!PRIORITIES.includes(r.priority)) fail(`${at} bad priority`)
    if (!(r.pieces >= 1) || !Number.isInteger(r.pieces)) fail(`${at} pieces not int ≥1`)
    if (!(r.weight > 0)) fail(`${at} weight not > 0`)
    if (!(r.freightValue >= 0)) fail(`${at} freightValue < 0`)
    if (ms(r.eta) < ms(r.shipDate)) fail(`${at} eta < shipDate`)
    if (r.status === 'Scheduled' && ms(r.shipDate) <= today) fail(`${at} Scheduled but shipped`)
    if (r.status === 'Delivered' && ms(r.eta) > today) fail(`${at} Delivered but eta future`)
    statusCount[r.status] = (statusCount[r.status] ?? 0) + 1
    if (r.status === 'Exception') exceptions++
  })

  for (const s of STATUSES) if (!statusCount[s]) fail(`no rows with status ${s}`)
  const exRate = exceptions / rows.length
  if (exRate < 0.01 || exRate > 0.12) fail(`exception rate ${(exRate * 100).toFixed(1)}% out of 1–12% band`)

  if (errs.length) throw new Error(`Palisade dataset invariants failed:\n${errs.join('\n')}`)

  // eslint-disable-next-line no-console
  console.info(`[Palisade] ${rows.length} rows OK · statuses`, statusCount)
}
