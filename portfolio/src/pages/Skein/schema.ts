/* Skein schema — the case's entity + relationship model, the enums, the
   per-relationship metadata (direction, whether it carries money / a location),
   the type→color map every view shares, and the format + date helpers. One
   place defines what an entity IS and what a relationship MEANS; graph, timeline,
   map, detail panel, and list all read from here. */

export const ENTITY_TYPES = ['person', 'org', 'account', 'location', 'vessel'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const RISKS = ['low', 'medium', 'high'] as const
export type Risk = (typeof RISKS)[number]

export const REL_TYPES = [
  'owns', 'controls', 'communicated', 'transferred', 'met',
  'travelled', 'shipped', 'registered', 'employed',
] as const
export type RelType = (typeof REL_TYPES)[number]

/** Metadata per relationship type. `carriesMoney` gates the amount field;
    `carriesLocation` gates the locationId field; `directed` picks the arrow. */
export interface RelMeta {
  label: string          // human label ("transferred funds to")
  short: string          // legend short form ("funds")
  directed: boolean
  carriesMoney: boolean
  carriesLocation: boolean
}
export const REL_META: Record<RelType, RelMeta> = {
  owns:         { label: 'owns',                 short: 'owns',    directed: true,  carriesMoney: false, carriesLocation: false },
  controls:     { label: 'controls',             short: 'controls',directed: true,  carriesMoney: false, carriesLocation: false },
  communicated: { label: 'communicated with',    short: 'comms',   directed: false, carriesMoney: false, carriesLocation: false },
  transferred:  { label: 'transferred funds to', short: 'funds',   directed: true,  carriesMoney: true,  carriesLocation: false },
  met:          { label: 'met with',             short: 'met',     directed: false, carriesMoney: false, carriesLocation: true },
  travelled:    { label: 'travelled with',       short: 'travel',  directed: false, carriesMoney: false, carriesLocation: true },
  shipped:      { label: 'shipped cargo via',    short: 'ship',    directed: true,  carriesMoney: false, carriesLocation: true },
  registered:   { label: 'registered at',        short: 'reg',     directed: true,  carriesMoney: false, carriesLocation: false },
  employed:     { label: 'employed by',          short: 'employ',  directed: true,  carriesMoney: false, carriesLocation: false },
}

export interface Entity {
  id: string
  type: EntityType
  name: string
  subtitle: string       // role / registry / flag
  risk: Risk
  aliases: string[]
  note: string
  /** Location entities only: schematic map coords in 0..1. */
  mx?: number
  my?: number
  country?: string       // location entities: jurisdiction label
}

/** A relationship IS a timeline event — it carries the date. */
export interface Rel {
  id: string
  type: RelType
  source: string         // entity id
  target: string         // entity id
  date: string           // ISO 'YYYY-MM-DD'
  amount?: number        // USD, only when REL_META[type].carriesMoney
  locationId?: string    // entity id of a location, only when carriesLocation
  note?: string
}

export interface Case {
  entities: Entity[]
  rels: Rel[]
  /** Inclusive [start, end] epoch-ms of the whole event span. */
  span: [number, number]
  name: string           // "Operation Longshore"
}

/* ---- Type → color (mirrors the @theme skein-* hexes; see §4.4) ---- */
export const TYPE_COLOR: Record<EntityType, string> = {
  person: '#6aa9f0',
  org: '#b48cf0',
  account: '#e07db4',
  location: '#57c8a0',
  vessel: '#5cc6d6',
}
export const TYPE_LABEL: Record<EntityType, string> = {
  person: 'Person',
  org: 'Organization',
  account: 'Account',
  location: 'Location',
  vessel: 'Vessel',
}
export const THREAD = '#e8635f'
export const FLAG = '#f0b64e'

/* ---- Date helpers (UTC, ISO 'YYYY-MM-DD') ---- */
export const DAY = 86_400_000
export const ms = (isoDate: string): number => Date.parse(`${isoDate}T00:00:00Z`)
export const iso = (epochMs: number): string => new Date(epochMs).toISOString().slice(0, 10)

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
export const fmtDate = (isoDate: string): string => dateFmt.format(new Date(`${isoDate}T00:00:00Z`))

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const fmtMoney = (n: number): string => usd.format(n)
