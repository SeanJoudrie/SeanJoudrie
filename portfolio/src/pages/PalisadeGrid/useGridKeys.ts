import { COLUMN_BY_ID, type ColId } from './schema'
import { clampCell, type Action, type Cell, type State } from './model'
import { pageRows } from './useVirtual'

export type KeyCtx = {
  state: State
  dispatch: (a: Action) => void
  view: number[]                 // base indices
  cols: ColId[]                  // ordered visible cols
  viewportH: number
  ensureVisible: (r: number, c: number) => void
  beginEdit: (cell: Cell, seedChar?: string) => void
  copySelection: () => void
  pasteFrom: () => void          // reads clipboard, dispatches applyEdits
}

export function handleGridKey(e: React.KeyboardEvent, ctx: KeyCtx): void {
  const { state, dispatch, view, cols } = ctx
  const rows = view.length
  const nCols = cols.length
  if (rows === 0 || nCols === 0) return
  if (state.editing) return // editor owns keys while open

  const a = state.active
  const move = (r: number, c: number, extend = false) => {
    const cell = clampCell({ r, c }, rows, nCols)
    dispatch({ t: 'active', cell, extend })
    ctx.ensureVisible(cell.r, cell.c)
  }

  const mod = e.ctrlKey || e.metaKey
  const key = e.key

  // ---- Clipboard ----
  if (mod && (key === 'c' || key === 'C')) { e.preventDefault(); ctx.copySelection(); return }
  if (mod && (key === 'v' || key === 'V')) { e.preventDefault(); ctx.pasteFrom(); return }
  if (mod && (key === 'a' || key === 'A')) {
    e.preventDefault(); dispatch({ t: 'selectAll', rows, cols: nCols }); return
  }
  if (mod && (key === 'z' || key === 'Z')) { e.preventDefault(); dispatch({ t: e.shiftKey ? 'redo' : 'undo' }); return }
  if (mod && (key === 'y' || key === 'Y')) { e.preventDefault(); dispatch({ t: 'redo' }); return }

  const page = pageRows(ctx.viewportH)

  switch (key) {
    case 'ArrowUp': e.preventDefault(); move(a.r - 1, a.c, e.shiftKey); return
    case 'ArrowDown': e.preventDefault(); move(a.r + 1, a.c, e.shiftKey); return
    case 'ArrowLeft': e.preventDefault(); move(a.r, a.c - 1, e.shiftKey); return
    case 'ArrowRight': e.preventDefault(); move(a.r, a.c + 1, e.shiftKey); return
    case 'Home':
      e.preventDefault()
      if (mod) move(0, 0)
      else move(a.r, 0, e.shiftKey)
      return
    case 'End':
      e.preventDefault()
      if (mod) move(rows - 1, nCols - 1)
      else move(a.r, nCols - 1, e.shiftKey)
      return
    case 'PageUp': e.preventDefault(); move(a.r - page, a.c, e.shiftKey); return
    case 'PageDown': e.preventDefault(); move(a.r + page, a.c, e.shiftKey); return
    case 'Tab':
      e.preventDefault()
      if (e.shiftKey) move(a.c === 0 ? a.r - 1 : a.r, a.c === 0 ? nCols - 1 : a.c - 1)
      else move(a.c === nCols - 1 ? a.r + 1 : a.r, a.c === nCols - 1 ? 0 : a.c + 1)
      return
    case 'Enter':
      e.preventDefault()
      if (COLUMN_BY_ID[cols[a.c]].editable) ctx.beginEdit(a)
      else move(a.r + 1, a.c)
      return
    case 'F2':
      e.preventDefault()
      if (COLUMN_BY_ID[cols[a.c]].editable) ctx.beginEdit(a)
      return
    case 'Delete':
    case 'Backspace': {
      const col = COLUMN_BY_ID[cols[a.c]]
      if (col.type === 'text' && col.editable && col.id !== 'customer') {
        e.preventDefault(); ctx.beginEdit(a, '')
      }
      return
    }
    case 'Escape':
      dispatch({ t: 'active', cell: a }) // clears range selection
      return
    default:
      // Typing a printable char starts an edit seeded with that char.
      if (key.length === 1 && !mod && !e.altKey && COLUMN_BY_ID[cols[a.c]].editable) {
        e.preventDefault()
        ctx.beginEdit(a, key)
      }
  }
}
