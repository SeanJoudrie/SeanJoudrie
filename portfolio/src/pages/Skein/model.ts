import { ms } from './schema'
import type { Case, Rel } from './schema'
import { CASE } from './generate'

/* The single source of cross-filter truth: a useReducer state plus a pure
   derive(). No undo/redo (deviating from Palisade deliberately): Palisade edits
   mutate a dataset, so undo is a real feature. Skein never mutates the case —
   this state is view-only (time window, selection, location filter, hover),
   always reconstructable, with nothing destructive to reverse; {t:'reset'}
   restores neutral in one step. An undo stack here would be ceremony. */

export interface SkeinState {
  /** Inclusive [start, end] epoch-ms of the current time brush. */
  window: [number, number]
  /** The full event span (brush bounds). */
  fullSpan: [number, number]
  /** Selected entity ids (multi-select via shift). */
  selected: string[]
  /** A selected relationship (clicking an edge), or null. */
  selectedRel: string | null
  /** A location filter set by clicking the map, or null. */
  locationFilter: string | null
  /** Hovered entity id (graph/list hover sync), or null. */
  hover: string | null
  /** aria-live message. */
  announce: string
}

export function initialState(c: Case = CASE): SkeinState {
  return {
    window: [...c.span] as [number, number],
    fullSpan: [...c.span] as [number, number],
    selected: [],
    selectedRel: null,
    locationFilter: null,
    hover: null,
    announce: '',
  }
}

export type Action =
  | { t: 'window'; range: [number, number] }
  | { t: 'select'; id: string; additive: boolean }
  | { t: 'selectRel'; id: string | null }
  | { t: 'selectLocation'; id: string }
  | { t: 'hover'; id: string | null }
  | { t: 'clearSelection' }
  | { t: 'reset' }
  | { t: 'announce'; msg: string }

export function reducer(s: SkeinState, a: Action): SkeinState {
  switch (a.t) {
    case 'window': {
      const lo = Math.min(a.range[0], a.range[1])
      const hi = Math.max(a.range[0], a.range[1])
      return { ...s, window: [Math.max(s.fullSpan[0], lo), Math.min(s.fullSpan[1], hi)] }
    }
    case 'select': {
      if (a.additive) {
        const has = s.selected.includes(a.id)
        return {
          ...s,
          selected: has ? s.selected.filter((x) => x !== a.id) : [...s.selected, a.id],
          selectedRel: null,
        }
      }
      return { ...s, selected: [a.id], selectedRel: null, locationFilter: null }
    }
    case 'selectRel':
      return { ...s, selectedRel: a.id, selected: [] }
    case 'selectLocation':
      return {
        ...s,
        locationFilter: s.locationFilter === a.id ? null : a.id,
        selected: [a.id],
        selectedRel: null,
      }
    case 'hover':
      return s.hover === a.id ? s : { ...s, hover: a.id }
    case 'clearSelection':
      return { ...s, selected: [], selectedRel: null, locationFilter: null }
    case 'reset':
      return { ...initialState(), announce: 'View reset' }
    case 'announce':
      return { ...s, announce: a.msg }
    default:
      return s
  }
}

/* ---------- derivation (pure; memoize on state in index.tsx) ---------- */

export interface NodeState { dim: boolean; hi: boolean }
export interface LocationSummary {
  id: string
  activeEntities: number   // distinct entities present here in-window
  activeRels: number
}
export interface Derived {
  nodeState: Map<string, NodeState>
  edgeState: Map<string, NodeState>
  activeRelCount: number
  activeNodeCount: number
  locations: LocationSummary[]
}

/** Is a relationship inside the current time window? */
const inWindow = (r: Rel, w: [number, number]): boolean => {
  const t = ms(r.date)
  return t >= w[0] && t <= w[1]
}

/**
 * The one derivation the three views share. Rules:
 *  - A rel is ACTIVE if it is in the time window AND (no locationFilter OR its
 *    locationId === the filter).
 *  - A node is ACTIVE if it touches an active rel (or, when a locationFilter is
 *    set, IS that location). Inactive nodes/edges render dimmed.
 *  - HIGHLIGHT (hi): the selection neighborhood — selected nodes, their active
 *    incident edges, and the far nodes on those edges; the selected rel and its
 *    two endpoints; every active node when a location filter is on.
 */
export function derive(state: SkeinState, c: Case = CASE): Derived {
  const { window: w, selected, selectedRel, locationFilter } = state
  const nodeState = new Map<string, NodeState>()
  const edgeState = new Map<string, NodeState>()
  for (const e of c.entities) nodeState.set(e.id, { dim: true, hi: false })
  for (const r of c.rels) edgeState.set(r.id, { dim: true, hi: false })

  const activeNodes = new Set<string>()
  const locAgg = new Map<string, { ents: Set<string>; rels: number }>()

  let activeRelCount = 0
  for (const r of c.rels) {
    const active = inWindow(r, w) && (!locationFilter || r.locationId === locationFilter)
    if (!active) continue
    activeRelCount++
    edgeState.set(r.id, { dim: false, hi: false })
    activeNodes.add(r.source)
    activeNodes.add(r.target)
    // Locations participate via locationId (they are never a rel endpoint),
    // so an in-window event at a port lights the port's node too.
    if (r.locationId) activeNodes.add(r.locationId)
    if (r.locationId) {
      const agg = locAgg.get(r.locationId) ?? { ents: new Set<string>(), rels: 0 }
      agg.ents.add(r.source); agg.ents.add(r.target); agg.rels++
      locAgg.set(r.locationId, agg)
    }
  }
  if (locationFilter) activeNodes.add(locationFilter)
  for (const id of activeNodes) nodeState.set(id, { dim: false, hi: false })

  // --- highlight pass ---
  const hiNodes = new Set<string>()
  const hiEdges = new Set<string>()
  if (selectedRel) {
    const r = c.rels.find((x) => x.id === selectedRel)
    if (r) { hiEdges.add(r.id); hiNodes.add(r.source); hiNodes.add(r.target) }
  } else if (selected.length) {
    const sel = new Set(selected)
    for (const id of sel) hiNodes.add(id)
    for (const r of c.rels) {
      if (edgeState.get(r.id)!.dim) continue // only active edges
      if (sel.has(r.source) || sel.has(r.target)) {
        hiEdges.add(r.id); hiNodes.add(r.source); hiNodes.add(r.target)
      }
    }
  }
  if (locationFilter) for (const id of activeNodes) hiNodes.add(id)

  for (const id of hiNodes) { const st = nodeState.get(id); if (st) { st.hi = true; st.dim = false } }
  for (const id of hiEdges) { const st = edgeState.get(id); if (st) { st.hi = true; st.dim = false } }

  const locations: LocationSummary[] = c.entities
    .filter((e) => e.type === 'location')
    .map((e) => ({ id: e.id, activeEntities: locAgg.get(e.id)?.ents.size ?? 0, activeRels: locAgg.get(e.id)?.rels ?? 0 }))

  return {
    nodeState,
    edgeState,
    activeRelCount,
    activeNodeCount: activeNodes.size,
    locations,
  }
}
