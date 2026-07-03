import { COLUMNS, COLUMN_BY_ID, DEFAULT_PINNED, sortKey,
  type ColId, type Row } from './schema'
import { ROWS } from './generate'

export type Cell = { r: number; c: number }   // r = view-row index, c = ordered-col index
export type Sort = { col: ColId; dir: 'asc' | 'desc' } | null
export type EditCmd = { kind: 'edit'; cells: { rowId: string; colId: ColId; prev: unknown; next: unknown }[] }

const UNDO_CAP = 100

export type State = {
  cols: ColId[]                       // full column order (pinned + unpinned)
  pinned: ColId[]                     // subset, rendered first, sticky-left
  widths: Record<string, number>      // colId -> px (session-only)
  sort: Sort
  filters: Record<string, string>     // colId -> filter text/enum value
  search: string                      // global quick filter
  edits: Map<string, Partial<Row>>
  active: Cell
  selection: { anchor: Cell; focus: Cell } | null
  editing: Cell | null
  editError: string | null
  undo: EditCmd[]
  redo: EditCmd[]
  announce: string                    // aria-live message
}

export function initialState(): State {
  const widths: Record<string, number> = {}
  for (const c of COLUMNS) widths[c.id] = c.width
  return {
    cols: COLUMNS.map((c) => c.id),
    pinned: [...DEFAULT_PINNED],
    widths,
    sort: null,
    filters: {},
    search: '',
    edits: new Map(),
    active: { r: 0, c: 0 },
    selection: null,
    editing: null,
    editError: null,
    undo: [],
    redo: [],
    announce: '',
  }
}

/** Ordered visible columns: pinned (in cols order) then the rest (in cols order). */
export function orderedCols(s: State): ColId[] {
  const pin = s.cols.filter((c) => s.pinned.includes(c))
  const rest = s.cols.filter((c) => !s.pinned.includes(c))
  return [...pin, ...rest]
}

/** Value of a cell honouring the edit overlay. */
export function cellValue(edits: State['edits'], rowIdx: number, colId: ColId): Row[ColId] {
  const base = ROWS[rowIdx]
  const e = edits.get(base.id)
  return e && colId in e ? (e[colId] as Row[ColId]) : base[colId]
}

/** Merge a base row with its edits (used for cross-field validation). */
export function mergedRow(edits: State['edits'], rowIdx: number): Row {
  const base = ROWS[rowIdx]
  const e = edits.get(base.id)
  return e ? { ...base, ...e } : base
}

/**
 * Pure view derivation: filter + sort → array of BASE indices. Memoize on
 * (edits, sort, filters, search) in the component. ~10k rows filter+sort in
 * a few ms — well under one frame.
 */
export function deriveView(s: State): number[] {
  const active = COLUMNS.filter((c) => (s.filters[c.id] ?? '') !== '')
  const search = s.search.trim().toLowerCase()

  const out: number[] = []
  for (let i = 0; i < ROWS.length; i++) {
    let keep = true
    for (const c of active) {
      const v = String(cellValue(s.edits, i, c.id)).toLowerCase()
      const f = s.filters[c.id].toLowerCase()
      // enum/status/priority filters are exact; text/number/date are substring.
      if (c.type === 'enum' || c.type === 'status' || c.type === 'priority') {
        if (v !== f) { keep = false; break }
      } else if (!v.includes(f)) { keep = false; break }
    }
    if (keep && search) {
      keep = COLUMNS.some((c) => String(cellValue(s.edits, i, c.id)).toLowerCase().includes(search))
    }
    if (keep) out.push(i)
  }

  if (s.sort) {
    const { col, dir } = s.sort
    const type = COLUMN_BY_ID[col].type
    const mul = dir === 'asc' ? 1 : -1
    out.sort((a, b) => {
      const ka = sortKey(type, cellValue(s.edits, a, col))
      const kb = sortKey(type, cellValue(s.edits, b, col))
      if (ka < kb) return -1 * mul
      if (ka > kb) return 1 * mul
      return a - b // stable tiebreak by base index
    })
  }
  return out
}

export type Action =
  | { t: 'active'; cell: Cell; extend?: boolean }
  | { t: 'selectAll'; rows: number; cols: number }
  | { t: 'beginEdit'; cell: Cell }
  | { t: 'cancelEdit' }
  | { t: 'setCell'; rowId: string; colId: ColId; next: unknown }
  | { t: 'applyEdits'; cells: { rowId: string; colId: ColId; next: unknown }[] }
  | { t: 'editError'; msg: string | null }
  | { t: 'undo' } | { t: 'redo' }
  | { t: 'sort'; col: ColId }
  | { t: 'setFilter'; col: ColId; value: string }
  | { t: 'search'; value: string }
  | { t: 'resize'; col: ColId; width: number }
  | { t: 'reorder'; from: ColId; to: ColId }
  | { t: 'togglePin'; col: ColId }
  | { t: 'reset' }
  | { t: 'announce'; msg: string }

const clampCell = (cell: Cell, rows: number, cols: number): Cell => ({
  r: Math.max(0, Math.min(rows - 1, cell.r)),
  c: Math.max(0, Math.min(cols - 1, cell.c)),
})

function applyCmd(edits: State['edits'], cmd: EditCmd, dir: 'do' | 'undo'): State['edits'] {
  const next = new Map(edits)
  for (const ch of cmd.cells) {
    const val = dir === 'do' ? ch.next : ch.prev
    const base = next.get(ch.rowId) ?? {}
    next.set(ch.rowId, { ...base, [ch.colId]: val })
  }
  return next
}

export function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'active': {
      const selection = a.extend
        ? { anchor: s.selection?.anchor ?? s.active, focus: a.cell }
        : null
      return { ...s, active: a.cell, selection, editing: null, editError: null }
    }
    case 'selectAll':
      return {
        ...s,
        selection: { anchor: { r: 0, c: 0 }, focus: { r: a.rows - 1, c: a.cols - 1 } },
        announce: `Selected all ${a.rows} rows`,
      }
    case 'beginEdit':
      return { ...s, editing: a.cell, active: a.cell, editError: null }
    case 'cancelEdit':
      return { ...s, editing: null, editError: null }
    case 'editError':
      return { ...s, editError: a.msg }
    case 'setCell': {
      const prev = (s.edits.get(a.rowId) ?? {})[a.colId] ??
        (ROWS.find((r) => r.id === a.rowId) as Row)[a.colId]
      if (prev === a.next) return { ...s, editing: null, editError: null }
      const cmd: EditCmd = { kind: 'edit', cells: [{ rowId: a.rowId, colId: a.colId, prev, next: a.next }] }
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'do'),
        undo: [...s.undo, cmd].slice(-UNDO_CAP),
        redo: [],
        editing: null,
        editError: null,
      }
    }
    case 'applyEdits': {
      const cells = a.cells.map((c) => {
        const cur = (s.edits.get(c.rowId) ?? {})[c.colId] ??
          (ROWS.find((r) => r.id === c.rowId) as Row)[c.colId]
        return { rowId: c.rowId, colId: c.colId, prev: cur, next: c.next }
      }).filter((c) => c.prev !== c.next)
      if (!cells.length) return s
      const cmd: EditCmd = { kind: 'edit', cells }
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'do'),
        undo: [...s.undo, cmd].slice(-UNDO_CAP),
        redo: [],
        announce: `Pasted ${cells.length} cell${cells.length === 1 ? '' : 's'}`,
      }
    }
    case 'undo': {
      if (!s.undo.length) return { ...s, announce: 'Nothing to undo' }
      const cmd = s.undo[s.undo.length - 1]
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'undo'),
        undo: s.undo.slice(0, -1),
        redo: [...s.redo, cmd].slice(-UNDO_CAP),
        announce: `Undo ${cmd.cells.length} cell${cmd.cells.length === 1 ? '' : 's'}`,
      }
    }
    case 'redo': {
      if (!s.redo.length) return { ...s, announce: 'Nothing to redo' }
      const cmd = s.redo[s.redo.length - 1]
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'do'),
        redo: s.redo.slice(0, -1),
        undo: [...s.undo, cmd].slice(-UNDO_CAP),
        announce: `Redo ${cmd.cells.length} cell${cmd.cells.length === 1 ? '' : 's'}`,
      }
    }
    case 'sort': {
      const cur = s.sort
      const dir: 'asc' | 'desc' | null =
        !cur || cur.col !== a.col ? 'asc' : cur.dir === 'asc' ? 'desc' : null
      const header = COLUMN_BY_ID[a.col].header
      return {
        ...s,
        sort: dir ? { col: a.col, dir } : null,
        active: { ...s.active, r: 0 },
        announce: dir ? `Sorted by ${header} ${dir === 'asc' ? 'ascending' : 'descending'}` : `Sort cleared`,
      }
    }
    case 'setFilter': {
      const filters = { ...s.filters }
      if (a.value === '') delete filters[a.col]
      else filters[a.col] = a.value
      return { ...s, filters, active: { ...s.active, r: 0 }, selection: null }
    }
    case 'search':
      return { ...s, search: a.value, active: { ...s.active, r: 0 }, selection: null }
    case 'resize':
      return { ...s, widths: { ...s.widths, [a.col]: Math.max(60, Math.round(a.width)) } }
    case 'reorder': {
      if (a.from === a.to) return s
      const cols = s.cols.filter((c) => c !== a.from)
      const idx = cols.indexOf(a.to)
      cols.splice(idx, 0, a.from)
      return { ...s, cols, announce: `Moved ${COLUMN_BY_ID[a.from].header}` }
    }
    case 'togglePin': {
      const pinned = s.pinned.includes(a.col)
        ? s.pinned.filter((c) => c !== a.col)
        : [...s.pinned, a.col]
      return { ...s, pinned, announce: `${pinned.includes(a.col) ? 'Pinned' : 'Unpinned'} ${COLUMN_BY_ID[a.col].header}` }
    }
    case 'reset':
      return { ...initialState(), announce: 'Grid reset' }
    case 'announce':
      return { ...s, announce: a.msg }
    default:
      return s
  }
}

/** Selection rectangle (inclusive) in view coordinates. */
export function selRect(sel: State['selection']): { r0: number; r1: number; c0: number; c1: number } | null {
  if (!sel) return null
  return {
    r0: Math.min(sel.anchor.r, sel.focus.r),
    r1: Math.max(sel.anchor.r, sel.focus.r),
    c0: Math.min(sel.anchor.c, sel.focus.c),
    c1: Math.max(sel.anchor.c, sel.focus.c),
  }
}
export { clampCell }
