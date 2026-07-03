import { mulberry32 } from '../../lib/rand'
import {
  DATA_TODAY, HUBS, PRIORITIES, ROW_COUNT, STATUSES,
  type Hub, type Priority, type Row, type Service, type Status,
} from './schema'

/**
 * The Cascadia Freight Systems manifest — 10,000 shipment rows from one
 * mulberry32 seed, so the whole grid is byte-identical on every device.
 * Values are correlated the way a real manifest would be: service drives
 * transit time, priority and $/kg; dates drive status. Invariants are
 * checked in dev by generate.assert.ts.
 */
export const PALISADE_SEED = 730_026

const TODAY_MS = Date.parse(`${DATA_TODAY}T00:00:00Z`)
const DAY = 86_400_000
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/* A believable roster of shippers — reused across rows (a carrier has repeat
   customers), suffixed so the column reads varied. */
const CUSTOMER_BASE = [
  'Harbor Provisions', 'Timberline Supply', 'Cascade Components', 'Rainier Foods',
  'Summit Industrial', 'Puget Paper', 'Emerald Textiles', 'Basin Agriculture',
  'Cedar Mill Works', 'Coastal Ceramics', 'Ironwood Tools', 'Sockeye Seafood',
  'Highline Electronics', 'Prairie Grain Co', 'Sierra Bottling', 'Klamath Lumber',
  'Delta Chemicals', 'Northwind Apparel', 'Cobalt Metals', 'Orchard Fresh',
  'Granite Fixtures', 'Bayshore Plastics', 'Wildfire Outdoor', 'Sound Beverage',
  'Meadowlark Dairy', 'Copper Canyon Mining', 'Tideflat Marine', 'Aurora Glass',
  'Redwood Furnishings', 'Pinecrest Nursery', 'Vantage Appliances', 'Silverton Steel',
] as const
const SUFFIX = ['', ' Inc', ' LLC', ' Co', ' Group', ' West', ' Logistics', ' Partners']

/* Per-service transit windows (days), value multiplier, and priority skew. */
const SERVICE_META: Record<Service, { tMin: number; tMax: number; mult: number; prio: number }> = {
  Overnight: { tMin: 1, tMax: 1, mult: 2.4, prio: 0.85 },
  Expedited: { tMin: 2, tMax: 3, mult: 1.6, prio: 0.55 },
  Standard: { tMin: 3, tMax: 6, mult: 1.0, prio: 0.3 },
  Freight: { tMin: 5, tMax: 10, mult: 0.75, prio: 0.2 },
}
const SERVICE_WEIGHTS: [Service, number][] = [
  ['Standard', 0.48], ['Freight', 0.27], ['Expedited', 0.17], ['Overnight', 0.08],
]

const pick = <T,>(rand: () => number, arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const weighted = <T,>(rand: () => number, table: [T, number][]): T => {
  let x = rand()
  for (const [v, w] of table) { if ((x -= w) <= 0) return v }
  return table[table.length - 1][0]
}

export function buildRows(seed: number = PALISADE_SEED): Row[] {
  const rand = mulberry32(seed)
  const rows: Row[] = new Array(ROW_COUNT)

  for (let i = 0; i < ROW_COUNT; i++) {
    const id = `CFS-${100000 + i}`

    const customer = CUSTOMER_BASE[Math.floor(rand() * CUSTOMER_BASE.length)] +
      SUFFIX[Math.floor(rand() * SUFFIX.length)]

    const origin = pick<Hub>(rand, HUBS)
    let destination = pick<Hub>(rand, HUBS)
    while (destination === origin) destination = pick<Hub>(rand, HUBS)

    const service = weighted<Service>(rand, SERVICE_WEIGHTS)
    const sm = SERVICE_META[service]

    // Ship date: uniformly across a 45-day window ending ~10 days after today,
    // so we get a healthy mix of past (delivered) and future (scheduled).
    const shipMs = TODAY_MS + Math.round((rand() * 45 - 35)) * DAY
    const transit = sm.tMin + Math.floor(rand() * (sm.tMax - sm.tMin + 1))
    const etaMs = shipMs + transit * DAY

    // Status derived from the calendar, with a realistic exception minority.
    let status: Status
    if (shipMs > TODAY_MS) status = 'Scheduled'
    else if (etaMs <= TODAY_MS) {
      const r = rand()
      status = r < 0.9 ? 'Delivered' : r < 0.96 ? 'Exception' : 'Delayed'
    } else {
      const r = rand()
      status = r < 0.82 ? 'In Transit' : r < 0.94 ? 'Delayed' : 'Exception'
    }

    // Priority skews with service; Overnight rarely Low.
    let priority: Priority
    const p = rand()
    if (p < sm.prio * 0.4) priority = 'Critical'
    else if (p < sm.prio) priority = 'High'
    else if (p < sm.prio + 0.45) priority = 'Medium'
    else priority = 'Low'

    const pieces = 1 + Math.floor(rand() * 40)
    const perPiece = 4 + rand() * 56 // kg
    const weight = Math.round(pieces * perPiece * 10) / 10
    const ratePerKg = 0.9 + rand() * 1.6 // USD/kg base lane rate
    const freightValue = Math.round(weight * ratePerKg * sm.mult + 45)

    rows[i] = {
      id, customer, origin, destination, service, status, priority,
      pieces, weight, freightValue, shipDate: iso(shipMs), eta: iso(etaMs),
    }
  }
  return rows
}

/** The grid's single, deterministic dataset (built once, never mutated). */
export const ROWS: Row[] = buildRows()

if (import.meta.env?.DEV) {
  void import('./generate.assert').then(({ assertRows }) => assertRows(ROWS))
}

/* Silence unused-import lint if PRIORITIES/STATUSES tree-shake oddly. */
void PRIORITIES
void STATUSES
