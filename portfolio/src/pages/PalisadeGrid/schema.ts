/* Palisade schema — the shipment-manifest row, its column metadata, and the
   type-aware format + parse/validate helpers every cell and editor share.
   One place defines what a column IS; renderers, editors, sort, filter, CSV
   and TSV all read from here. */

export const HUBS = [
  'Seattle', 'Portland', 'Oakland', 'Sacramento', 'Boise', 'Spokane',
  'Reno', 'Salt Lake City', 'Denver', 'Phoenix', 'Vancouver BC', 'Los Angeles',
] as const
export type Hub = (typeof HUBS)[number]

export const SERVICES = ['Standard', 'Expedited', 'Overnight', 'Freight'] as const
export type Service = (typeof SERVICES)[number]

export const STATUSES = ['Scheduled', 'In Transit', 'Delayed', 'Delivered', 'Exception'] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export type Priority = (typeof PRIORITIES)[number]

export type Row = {
  id: string          // 'CFS-100000' … unique, read-only
  customer: string    // free text, editable
  origin: Hub
  destination: Hub
  service: Service
  status: Status
  priority: Priority
  pieces: number      // integer ≥ 1
  weight: number      // kg, > 0
  freightValue: number // USD, ≥ 0
  shipDate: string    // ISO 'YYYY-MM-DD'
  eta: string         // ISO 'YYYY-MM-DD', ≥ shipDate
}

export type ColId = keyof Row
export type ColType = 'text' | 'enum' | 'status' | 'priority' | 'number' | 'currency' | 'date'

export type ColDef = {
  id: ColId
  header: string
  type: ColType
  width: number                 // default px
  editable: boolean
  align?: 'left' | 'right'
  options?: readonly string[]   // enum/status/priority
  min?: number                  // numeric floor
  integer?: boolean
}

/* Authoring order (== initial column order). `id` is pinned by default. */
export const COLUMNS: ColDef[] = [
  { id: 'id', header: 'Shipment', type: 'text', width: 116, editable: false },
  { id: 'customer', header: 'Customer', type: 'text', width: 190, editable: true },
  { id: 'origin', header: 'Origin', type: 'enum', width: 130, editable: true, options: HUBS },
  { id: 'destination', header: 'Destination', type: 'enum', width: 130, editable: true, options: HUBS },
  { id: 'service', header: 'Service', type: 'enum', width: 120, editable: true, options: SERVICES },
  { id: 'status', header: 'Status', type: 'status', width: 130, editable: true, options: STATUSES },
  { id: 'priority', header: 'Priority', type: 'priority', width: 110, editable: true, options: PRIORITIES },
  { id: 'pieces', header: 'Pieces', type: 'number', width: 92, editable: true, align: 'right', min: 1, integer: true },
  { id: 'weight', header: 'Weight (kg)', type: 'number', width: 116, editable: true, align: 'right', min: 0.1 },
  { id: 'freightValue', header: 'Freight Value', type: 'currency', width: 132, editable: true, align: 'right', min: 0 },
  { id: 'shipDate', header: 'Ship Date', type: 'date', width: 124, editable: true },
  { id: 'eta', header: 'ETA', type: 'date', width: 124, editable: true },
]

export const COLUMN_BY_ID: Record<ColId, ColDef> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c]),
) as Record<ColId, ColDef>

export const DEFAULT_PINNED: ColId[] = ['id']
export const ROW_COUNT = 10_000
/** Fixed "today" the dataset is authored around (UTC midnight). */
export const DATA_TODAY = '2026-06-30'

/* ---- Formatting ---- */
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const int = new Intl.NumberFormat('en-US')
const num1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** Human display for a cell value (used in <CellView>). */
export function formatValue(type: ColType, v: unknown): string {
  if (v == null || v === '') return ''
  switch (type) {
    case 'currency': return usd.format(Number(v))
    case 'number': return Number.isInteger(Number(v)) ? int.format(Number(v)) : num1.format(Number(v))
    case 'date': return dateFmt.format(new Date(`${v}T00:00:00Z`))
    default: return String(v)
  }
}

/** Raw value for CSV/TSV — numbers unformatted, dates ISO, strings as-is. */
export function rawValue(_type: ColType, v: unknown): string {
  if (v == null) return ''
  return String(v)
}

/** Comparable key for sorting. */
export function sortKey(type: ColType, v: unknown): number | string {
  switch (type) {
    case 'number':
    case 'currency': return Number(v)
    case 'date': return Date.parse(`${v}T00:00:00Z`)
    case 'priority': return PRIORITIES.indexOf(v as Priority)
    default: return String(v).toLowerCase()
  }
}

export type ParseResult =
  | { ok: true; value: Row[ColId] }
  | { ok: false; error: string }

/**
 * Coerce + validate a raw string (from a text editor or a pasted TSV cell)
 * into a typed value for `col`. `row` is the *current* row so cross-field
 * checks (eta ≥ shipDate) can run. Returns a typed value or an error string.
 */
export function parseValue(col: ColDef, raw: string, row: Row): ParseResult {
  const s = raw.trim()
  switch (col.type) {
    case 'text': {
      if (col.id === 'customer' && s.length === 0) return { ok: false, error: 'Customer cannot be empty' }
      return { ok: true, value: s }
    }
    case 'enum':
    case 'status':
    case 'priority': {
      const opts = col.options ?? []
      const hit = opts.find((o) => o.toLowerCase() === s.toLowerCase())
      if (!hit) return { ok: false, error: `Must be one of: ${opts.join(', ')}` }
      if ((col.id === 'origin' || col.id === 'destination')) {
        const other = col.id === 'origin' ? row.destination : row.origin
        if (hit === other) return { ok: false, error: 'Origin and destination must differ' }
      }
      return { ok: true, value: hit as Row[ColId] }
    }
    case 'number':
    case 'currency': {
      const n = Number(s.replace(/[$,\s]/g, ''))
      if (!Number.isFinite(n)) return { ok: false, error: 'Not a number' }
      if (col.integer && !Number.isInteger(n)) return { ok: false, error: 'Must be a whole number' }
      if (col.min != null && n < col.min) return { ok: false, error: `Must be ≥ ${col.min}` }
      return { ok: true, value: col.integer ? Math.round(n) : Math.round(n * 100) / 100 }
    }
    case 'date': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`)))
        return { ok: false, error: 'Use YYYY-MM-DD' }
      if (col.id === 'eta' && Date.parse(`${s}T00:00:00Z`) < Date.parse(`${row.shipDate}T00:00:00Z`))
        return { ok: false, error: 'ETA cannot precede ship date' }
      if (col.id === 'shipDate' && Date.parse(`${s}T00:00:00Z`) > Date.parse(`${row.eta}T00:00:00Z`))
        return { ok: false, error: 'Ship date cannot follow ETA' }
      return { ok: true, value: s }
    }
  }
}
