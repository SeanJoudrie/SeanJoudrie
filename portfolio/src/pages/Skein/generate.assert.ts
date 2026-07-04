import {
  ENTITY_TYPES, REL_META, REL_TYPES, ms,
  type Case, type Entity,
} from './schema'
import { WINDOW_START, WINDOW_END, ENTITY_TARGET, REL_TARGET } from './generate'

/**
 * The case contract, enforced in dev only. If any of these fail the demo's whole
 * premise ("a believable, self-consistent investigation") is a lie, so we throw
 * loudly with every violation listed.
 */
export function assertCase(c: Case): void {
  const errs: string[] = []
  const fail = (m: string) => errs.push(`  · ${m}`)
  const T0 = ms(WINDOW_START)
  const T1 = ms(WINDOW_END)
  const byId = new Map<string, Entity>(c.entities.map((e) => [e.id, e]))

  // --- entities ---
  if (c.entities.length < ENTITY_TARGET - 1) fail(`expected ~${ENTITY_TARGET} entities, got ${c.entities.length}`)
  if (new Set(c.entities.map((e) => e.id)).size !== c.entities.length) fail('entity ids not unique')
  for (const t of ENTITY_TYPES) if (!c.entities.some((e) => e.type === t)) fail(`no entities of type ${t}`)
  for (const e of c.entities) {
    if (!ENTITY_TYPES.includes(e.type)) fail(`${e.id}: bad type ${e.type}`)
    if (!e.name) fail(`${e.id}: empty name`)
    if (e.type === 'location' && (e.mx == null || e.my == null)) fail(`${e.id}: location missing map coords`)
    if (e.type === 'location' && (e.mx! < 0 || e.mx! > 1 || e.my! < 0 || e.my! > 1)) fail(`${e.id}: map coords out of 0..1`)
  }

  // --- relationships ---
  if (c.rels.length < REL_TARGET - 1) fail(`expected ~${REL_TARGET} rels, got ${c.rels.length}`)
  if (new Set(c.rels.map((r) => r.id)).size !== c.rels.length) fail('rel ids not unique (some blank/duplicated)')
  const degree = new Map<string, number>()
  for (const r of c.rels) {
    if (!REL_TYPES.includes(r.type)) fail(`${r.id}: bad rel type ${r.type}`)
    if (!byId.has(r.source)) fail(`${r.id}: source ${r.source} is not a real entity`)
    if (!byId.has(r.target)) fail(`${r.id}: target ${r.target} is not a real entity`)
    if (r.source === r.target) fail(`${r.id}: self-loop on ${r.source}`)
    const t = ms(r.date)
    if (Number.isNaN(t) || t < T0 || t > T1) fail(`${r.id}: date ${r.date} outside the window`)
    const meta = REL_META[r.type]
    if (meta.carriesMoney && !(typeof r.amount === 'number' && r.amount > 0)) fail(`${r.id}: ${r.type} missing positive amount`)
    if (!meta.carriesMoney && r.amount != null) fail(`${r.id}: ${r.type} should not carry an amount`)
    if (meta.carriesLocation) {
      if (!r.locationId || byId.get(r.locationId)?.type !== 'location') fail(`${r.id}: ${r.type} needs a valid location`)
    } else if (r.locationId != null) fail(`${r.id}: ${r.type} should not carry a location`)
    degree.set(r.source, (degree.get(r.source) ?? 0) + 1)
    degree.set(r.target, (degree.get(r.target) ?? 0) + 1)
    // Locations are never rel endpoints — they participate via locationId, so
    // count that as connectivity or every port would read as an orphan.
    if (r.locationId) degree.set(r.locationId, (degree.get(r.locationId) ?? 0) + 1)
  }

  // --- no orphan nodes ---
  for (const e of c.entities) if (!degree.get(e.id)) fail(`${e.id} (${e.name}) is an orphan — no relationships`)

  // --- ownership resolves to the UBO (p.alderisle) via owns/controls edges ---
  const controlAdj = new Map<string, string[]>()
  for (const r of c.rels) {
    if (r.type === 'owns' || r.type === 'controls') {
      // walk UPWARD: child -> its owner/controller
      controlAdj.set(r.target, [...(controlAdj.get(r.target) ?? []), r.source])
    }
  }
  const reachesUBO = (start: string): boolean => {
    const seen = new Set<string>()
    const stack = [start]
    while (stack.length) {
      const cur = stack.pop()!
      if (cur === 'p.alderisle') return true
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const up of controlAdj.get(cur) ?? []) stack.push(up)
    }
    return false
  }
  for (const e of c.entities) {
    if (e.type === 'org' && e.id !== 'o.grindwall' && e.id !== 'o.casselvane' && e.id !== 'o.veridian' && e.id !== 'o.stallpine') {
      if (!reachesUBO(e.id)) fail(`${e.id} (${e.name}) ownership does not resolve to the UBO`)
    }
  }

  // --- timeline spans a believable window (uses most of the 18 months) ---
  const [s, en] = c.span
  const covered = (en - s) / (T1 - T0)
  if (covered < 0.85) fail(`event span covers only ${(covered * 100).toFixed(0)}% of the window`)

  if (errs.length) throw new Error(`Skein case invariants failed:\n${errs.join('\n')}`)
  // eslint-disable-next-line no-console
  console.info(`[Skein] ${c.entities.length} entities · ${c.rels.length} rels · span ${WINDOW_START}…${WINDOW_END} OK`)
}
