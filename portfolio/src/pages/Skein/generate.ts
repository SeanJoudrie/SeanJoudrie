import { mulberry32 } from '../../lib/rand'
import {
  DAY, ms, iso,
  type Case, type Entity, type Rel, type Risk,
} from './schema'

/** One seed drives the whole case. */
export const SKEIN_SEED = 20_240_117
export const CASE_NAME = 'Operation Longshore'

export const WINDOW_START = '2024-01-01'
export const WINDOW_END = '2025-06-30'
const T0 = ms(WINDOW_START)
const T1 = ms(WINDOW_END)
const SPAN_DAYS = Math.round((T1 - T0) / DAY) // 546

export const ENTITY_TARGET = 50 // 29 authored core + 21 seeded filler (8 shells + 8 accounts + 5 couriers)
export const REL_TARGET = 132

/* Three activity "waves" (fractions of the span) so scrubbing reveals phases. */
const WAVES: [number, number][] = [
  [0.02, 0.28], // assembly
  [0.34, 0.62], // transaction
  [0.70, 0.98], // unwind
]

/* ---------- authored core cast (the story) ---------- */

const CORE_ENTITIES: Entity[] = [
  // people
  { id: 'p.alderisle', type: 'person', name: 'Corwin Alderisle', subtitle: 'Financier · ultimate beneficial owner', risk: 'high', aliases: ['C.A.', 'Alderisle Holdings'], note: 'Sits behind every controlling stake in the lattice.' },
  { id: 'p.brant', type: 'person', name: 'Odile Brant', subtitle: 'Nominee director', risk: 'high', aliases: ['O. Brant'], note: 'Signs for the holding company; never travels.' },
  { id: 'p.sowerby', type: 'person', name: 'Reginald Sowerby', subtitle: 'Nominee director', risk: 'medium', aliases: [], note: 'Co-director on paper; retired notary.' },
  { id: 'p.vance', type: 'person', name: 'Elena Vance', subtitle: 'Accountant · bookkeeper', risk: 'high', aliases: ['E.V.'], note: 'Reconciles the invoicing spread across shells.' },
  { id: 'p.kessler', type: 'person', name: 'Milan Kessler', subtitle: 'Freight forwarder', risk: 'medium', aliases: [], note: 'Books cargo and files the manifests.' },
  { id: 'p.dray', type: 'person', name: 'Tomas Dray', subtitle: 'Master, MV Aurelian', risk: 'medium', aliases: ['Capt. Dray'], note: 'Sails the primary bulk carrier.' },
  { id: 'p.oduya', type: 'person', name: 'Grace Oduya', subtitle: 'Customs broker', risk: 'medium', aliases: [], note: 'Clears consignments through the free zone.' },
  { id: 'p.renn', type: 'person', name: 'Piotr Renn', subtitle: 'Courier', risk: 'low', aliases: ['the bagman'], note: 'Moves documents and cash between principals.' },

  // organizations
  { id: 'o.bs', type: 'org', name: 'Brant & Sowerby Holdings', subtitle: 'Holding company', risk: 'high', aliases: ['B&S'], note: 'Apex of the ownership lattice.' },
  { id: 'o.halcyon', type: 'org', name: 'Halcyon Trading Ltd', subtitle: 'Shell trading co · Kaltis FZ', risk: 'high', aliases: ['Halcyon'], note: 'Primary invoicing shell.' },
  { id: 'o.cinderbay', type: 'org', name: 'Cinder Bay Logistics', subtitle: 'Freight forwarder', risk: 'medium', aliases: [], note: 'Books the vessels and cargo slots.' },
  { id: 'o.osprey', type: 'org', name: 'Osprey Maritime SA', subtitle: 'Vessel registrant · flag of convenience', risk: 'high', aliases: [], note: 'Registers the fleet under a soft flag.' },
  { id: 'o.veridian', type: 'org', name: 'Veridian Commodity Partners', subtitle: 'Trade counterparty (front)', risk: 'medium', aliases: [], note: 'The "buyer" on the over-invoiced side.' },
  { id: 'o.stallpine', type: 'org', name: 'Stallpine Metals', subtitle: 'Consignee · mislabeled cargo', risk: 'high', aliases: [], note: 'Receives cargo declared as scrap.' },
  { id: 'o.grindwall', type: 'org', name: 'Grindwall Bank', subtitle: 'Correspondent bank', risk: 'low', aliases: [], note: 'Holds the operating and nominee accounts.' },
  { id: 'o.casselvane', type: 'org', name: 'Cassel & Vane Trust', subtitle: 'Registered agent · escrow', risk: 'medium', aliases: ['C&V'], note: 'Registers shells and holds escrow.' },

  // locations (schematic map coords in 0..1)
  { id: 'l.ferro', type: 'location', name: 'Ferro City', subtitle: 'Financial hub', risk: 'low', aliases: [], note: 'Where the banking and meetings happen.', mx: 0.30, my: 0.34, country: 'Ferran Republic' },
  { id: 'l.kaltis', type: 'location', name: 'Kaltis Free Zone', subtitle: 'Free-trade port', risk: 'high', aliases: ['Kaltis FZ'], note: 'Cargo re-labeled and re-invoiced here.', mx: 0.78, my: 0.40, country: 'Kaltis Territory' },
  { id: 'l.vantry', type: 'location', name: 'Port Vantry', subtitle: 'Bulk terminal', risk: 'medium', aliases: [], note: 'Loading port for the bulk carrier.', mx: 0.18, my: 0.62, country: 'Ferran Republic' },
  { id: 'l.cresswick', type: 'location', name: 'Cresswick Terminal', subtitle: 'Container feeder port', risk: 'medium', aliases: [], note: 'Transshipment for containers.', mx: 0.46, my: 0.70, country: 'Cress Union' },
  { id: 'l.dorne', type: 'location', name: 'Dorne Harbour', subtitle: 'Roll-on/roll-off port', risk: 'low', aliases: [], note: 'Occasional call for the Ro-Ro vessel.', mx: 0.64, my: 0.20, country: 'Dorn Coast' },
  { id: 'l.ostgate', type: 'location', name: 'Ostgate Anchorage', subtitle: 'Ship-to-ship transfer zone', risk: 'high', aliases: [], note: 'Where cargo quietly changes hulls.', mx: 0.86, my: 0.72, country: 'Intl. waters' },

  // accounts
  { id: 'a.halcyonop', type: 'account', name: 'Halcyon Operating ****4471', subtitle: 'Grindwall Bank', risk: 'high', aliases: [], note: 'Primary operating account.' },
  { id: 'a.bshold', type: 'account', name: 'B&S Holding ****0198', subtitle: 'Grindwall Bank', risk: 'high', aliases: [], note: 'Holding-company account.' },
  { id: 'a.ospreyop', type: 'account', name: 'Osprey Maritime ****7732', subtitle: 'Grindwall Bank', risk: 'medium', aliases: [], note: 'Vessel-registrant account.' },
  { id: 'a.cvescrow', type: 'account', name: 'Cassel & Vane Escrow ****5510', subtitle: 'Grindwall Bank', risk: 'medium', aliases: [], note: 'Escrow for shell registrations.' },

  // vessels
  { id: 'v.aurelian', type: 'vessel', name: 'MV Aurelian', subtitle: 'Bulk carrier · Osprey flag', risk: 'high', aliases: ['IMO 7731004'], note: 'Primary cargo hull.' },
  { id: 'v.saltmarsh', type: 'vessel', name: 'MV Saltmarsh', subtitle: 'Container feeder', risk: 'medium', aliases: ['IMO 7731188'], note: 'Feeds containers to Cresswick.' },
  { id: 'v.kettering', type: 'vessel', name: 'MV Kettering', subtitle: 'Roll-on/roll-off', risk: 'low', aliases: ['IMO 7731272'], note: 'Peripheral Ro-Ro.' },
]

/* ---------- authored core relationships (the spine of the story) ----------
   Dates here are given as a wave index + fraction so generate.assert.ts can
   prove the span is covered; the generator resolves them against the calendar. */
type CoreRel = Omit<Rel, 'id' | 'date'> & { wave: number; at: number }

const CORE_RELS: CoreRel[] = [
  // ownership lattice → resolves to the UBO
  { type: 'controls', source: 'p.alderisle', target: 'o.bs', wave: 0, at: 0.05 },
  { type: 'owns', source: 'o.bs', target: 'o.halcyon', wave: 0, at: 0.10 },
  { type: 'owns', source: 'o.bs', target: 'o.cinderbay', wave: 0, at: 0.12 },
  { type: 'owns', source: 'o.bs', target: 'o.osprey', wave: 0, at: 0.14 },
  { type: 'controls', source: 'p.brant', target: 'o.bs', wave: 0, at: 0.06 },
  { type: 'controls', source: 'p.sowerby', target: 'o.bs', wave: 0, at: 0.07 },
  { type: 'registered', source: 'o.halcyon', target: 'o.casselvane', wave: 0, at: 0.09 },
  { type: 'registered', source: 'o.cinderbay', target: 'o.casselvane', wave: 0, at: 0.11 },

  // employment / roles
  { type: 'employed', source: 'p.vance', target: 'o.bs', wave: 0, at: 0.16 },
  { type: 'employed', source: 'p.kessler', target: 'o.cinderbay', wave: 0, at: 0.18 },
  { type: 'employed', source: 'p.oduya', target: 'o.halcyon', wave: 0, at: 0.20 },
  { type: 'employed', source: 'p.dray', target: 'o.osprey', wave: 0, at: 0.22 },

  // accounts belong to orgs
  { type: 'owns', source: 'o.halcyon', target: 'a.halcyonop', wave: 0, at: 0.15 },
  { type: 'owns', source: 'o.bs', target: 'a.bshold', wave: 0, at: 0.16 },
  { type: 'owns', source: 'o.osprey', target: 'a.ospreyop', wave: 0, at: 0.17 },
  { type: 'owns', source: 'o.casselvane', target: 'a.cvescrow', wave: 0, at: 0.13 },

  // vessels registered to the flag
  { type: 'registered', source: 'v.aurelian', target: 'o.osprey', wave: 0, at: 0.19 },
  { type: 'registered', source: 'v.saltmarsh', target: 'o.osprey', wave: 0, at: 0.21 },
  { type: 'registered', source: 'v.kettering', target: 'o.osprey', wave: 0, at: 0.23 },

  // assembly meetings (carry a location)
  { type: 'met', source: 'p.alderisle', target: 'p.brant', locationId: 'l.ferro', wave: 0, at: 0.24 },
  { type: 'met', source: 'p.vance', target: 'p.kessler', locationId: 'l.ferro', wave: 0, at: 0.26 },

  // wave 1: the money moves
  { type: 'transferred', source: 'a.bshold', target: 'a.halcyonop', amount: 1_800_000, wave: 1, at: 0.10 },
  { type: 'transferred', source: 'a.halcyonop', target: 'a.ospreyop', amount: 620_000, wave: 1, at: 0.28 },
  { type: 'transferred', source: 'a.halcyonop', target: 'a.cvescrow', amount: 240_000, wave: 1, at: 0.30 },
  { type: 'communicated', source: 'p.vance', target: 'p.alderisle', wave: 1, at: 0.05 },
  { type: 'communicated', source: 'p.kessler', target: 'p.dray', wave: 1, at: 0.34 },

  // wave 1: the cargo sails (shipped carries a destination location)
  { type: 'shipped', source: 'v.aurelian', target: 'o.stallpine', locationId: 'l.kaltis', wave: 1, at: 0.20 },
  { type: 'shipped', source: 'v.saltmarsh', target: 'o.stallpine', locationId: 'l.cresswick', wave: 1, at: 0.40 },
  { type: 'travelled', source: 'p.renn', target: 'p.oduya', locationId: 'l.kaltis', wave: 1, at: 0.44 },

  // wave 1: the front counterparty (over-invoicing)
  { type: 'transferred', source: 'o.veridian', target: 'a.halcyonop', amount: 2_400_000, wave: 1, at: 0.50 },
  { type: 'communicated', source: 'p.alderisle', target: 'o.veridian', wave: 1, at: 0.48 },

  // wave 2: the unwind
  { type: 'transferred', source: 'a.halcyonop', target: 'a.bshold', amount: 960_000, wave: 2, at: 0.30 },
  { type: 'shipped', source: 'v.aurelian', target: 'o.stallpine', locationId: 'l.ostgate', wave: 2, at: 0.55 },
  { type: 'met', source: 'p.alderisle', target: 'p.vance', locationId: 'l.ferro', wave: 2, at: 0.90 },
]

/* ---------- generation ---------- */

const pick = <T,>(rnd: () => number, arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]

/** Resolve a wave-index + 0..1 fraction to an ISO date inside that wave. */
function waveDate(wave: number, at: number): string {
  const [a, b] = WAVES[wave]
  const frac = a + (b - a) * Math.max(0, Math.min(1, at))
  return iso(T0 + Math.round(frac * SPAN_DAYS) * DAY)
}

const FILLER_SHELL = ['Marlowe', 'Kestrel', 'Ansel', 'Ferro', 'Brackwater', 'Otis', 'Verrin', 'Quill', 'Saltus', 'Larkspur']
const FILLER_SUFFIX = ['Trading Ltd', 'Commodities', 'Shipping SA', 'Holdings', 'Exports', 'Freight Ltd']
const FILLER_FIRST = ['Anders', 'Lena', 'Marek', 'Sofia', 'Ivo', 'Talia', 'Bram', 'Nadia', 'Cato', 'Ruth']
const FILLER_LAST = ['Holt', 'Marsh', 'Prno', 'Vale', 'Serra', 'Dunn', 'Okafor', 'Rask', 'Lund', 'Ferre']

export function buildCase(seed: number = SKEIN_SEED): Case {
  const rnd = mulberry32(seed)
  const entities: Entity[] = CORE_ENTITIES.map((e) => ({ ...e }))
  const byId = new Map(entities.map((e) => [e.id, e]))
  const rels: Rel[] = []
  let relSeq = 0

  /** The single id authority — every relationship gets its id here. */
  const addRel = (r: Omit<Rel, 'id'>): void => {
    rels.push({ ...r, id: `r${(relSeq++).toString(36)}` })
  }

  // authored spine
  for (const c of CORE_RELS) {
    const { wave, at, ...rest } = c
    addRel({ ...rest, date: waveDate(wave, at) })
  }

  const orgs = () => entities.filter((e) => e.type === 'org')
  const accounts = () => entities.filter((e) => e.type === 'account')
  const persons = () => entities.filter((e) => e.type === 'person')
  const locations = entities.filter((e) => e.type === 'location')
  const vessels = () => entities.filter((e) => e.type === 'vessel')
  const risk = (rnd: () => number): Risk => (rnd() < 0.18 ? 'high' : rnd() < 0.5 ? 'medium' : 'low')

  // --- filler shell orgs, each owned by B&S and registered by C&V ---
  for (let i = 0; i < 8; i++) {
    const id = `o.shell${i}`
    const name = `${FILLER_SHELL[i % FILLER_SHELL.length]} ${pick(rnd, FILLER_SUFFIX)}`
    const e: Entity = { id, type: 'org', name, subtitle: 'Shell trading co', risk: risk(rnd), aliases: [], note: 'Peripheral invoicing shell.' }
    entities.push(e); byId.set(id, e)
    addRel({ type: 'owns', source: 'o.bs', target: id, date: waveDate(0, 0.12 + rnd() * 0.1) })
    addRel({ type: 'registered', source: id, target: 'o.casselvane', date: waveDate(0, 0.1 + rnd() * 0.1) })
  }

  // --- filler accounts, each owned by a random org + fed by a transfer ---
  for (let i = 0; i < 8; i++) {
    const id = `a.f${i}`
    const owner = pick(rnd, orgs())
    const e: Entity = { id, type: 'account', name: `${owner.name.split(' ')[0]} ****${1000 + Math.floor(rnd() * 8999)}`, subtitle: 'Grindwall Bank', risk: risk(rnd), aliases: [], note: 'Secondary account.' }
    entities.push(e); byId.set(id, e)
    addRel({ type: 'owns', source: owner.id, target: id, date: waveDate(0, 0.14 + rnd() * 0.1) })
    const src = pick(rnd, accounts().filter((a) => a.id !== id))
    addRel({ type: 'transferred', source: src.id, target: id, amount: 5_000 + Math.floor(rnd() * 480_000), date: waveDate(1, rnd()) })
  }

  // --- filler couriers, each employed by an org + communicating with a principal ---
  for (let i = 0; i < 5; i++) {
    const id = `p.f${i}`
    const e: Entity = { id, type: 'person', name: `${pick(rnd, FILLER_FIRST)} ${pick(rnd, FILLER_LAST)}`, subtitle: pick(rnd, ['Courier', 'Clerk', 'Agent', 'Broker']), risk: risk(rnd), aliases: [], note: 'Peripheral operative.' }
    entities.push(e); byId.set(id, e)
    const employer = pick(rnd, orgs())
    addRel({ type: 'employed', source: id, target: employer.id, date: waveDate(0, 0.16 + rnd() * 0.1) })
    const principal = pick(rnd, persons().filter((p) => p.id !== id))
    addRel({ type: 'communicated', source: id, target: principal.id, date: waveDate(1 + Math.floor(rnd() * 2), rnd()) })
  }

  // --- density: extra transfers, communications, shipments spread across waves ---
  while (rels.length < REL_TARGET) {
    const roll = rnd()
    if (roll < 0.45) {
      const a = pick(rnd, accounts()); let b = pick(rnd, accounts())
      let guard = 0; while (b.id === a.id && guard++ < 8) b = pick(rnd, accounts())
      if (a.id === b.id) continue
      addRel({ type: 'transferred', source: a.id, target: b.id, amount: 5_000 + Math.floor(rnd() * 700_000), date: waveDate(Math.floor(rnd() * 3), rnd()) })
    } else if (roll < 0.72) {
      const a = pick(rnd, persons()); let b = pick(rnd, persons())
      let guard = 0; while (b.id === a.id && guard++ < 8) b = pick(rnd, persons())
      if (a.id === b.id) continue
      addRel({ type: 'communicated', source: a.id, target: b.id, date: waveDate(Math.floor(rnd() * 3), rnd()) })
    } else if (roll < 0.88) {
      const v = pick(rnd, vessels()); const dst = pick(rnd, [byId.get('o.stallpine')!, ...orgs().slice(0, 3)])
      const loc = pick(rnd, locations)
      addRel({ type: 'shipped', source: v.id, target: dst.id, locationId: loc.id, date: waveDate(1 + Math.floor(rnd() * 2), rnd()) })
    } else {
      const a = pick(rnd, persons()); let b = pick(rnd, persons())
      let guard = 0; while (b.id === a.id && guard++ < 8) b = pick(rnd, persons())
      if (a.id === b.id) continue
      addRel({ type: 'met', source: a.id, target: b.id, locationId: pick(rnd, locations).id, date: waveDate(Math.floor(rnd() * 3), rnd()) })
    }
  }

  // sort rels chronologically (timeline + shipping-lane order read cleaner)
  rels.sort((a, b) => ms(a.date) - ms(b.date) || (a.id < b.id ? -1 : 1))

  const span: [number, number] = [ms(rels[0].date), ms(rels[rels.length - 1].date)]
  const c: Case = { entities, rels, span, name: CASE_NAME }

  if (import.meta.env?.DEV) {
    void import('./generate.assert').then(({ assertCase }) => assertCase(c))
  }
  return c
}

/** The single, deterministic case (built once, never mutated). */
export const CASE: Case = buildCase()
