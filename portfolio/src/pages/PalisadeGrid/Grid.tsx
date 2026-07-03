import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { COLUMN_BY_ID, ROW_COUNT, type ColId, type Row } from './schema'
import { ROWS } from './generate'
import {
  cellValue, mergedRow, orderedCols, selRect,
  type Action, type Cell, type State,
} from './model'
import { ROW_H, scrollToRow, useVirtual } from './useVirtual'
import { HeaderRow } from './HeaderRow'
import { CellEditor, CellView } from './cells'
import { handleGridKey } from './useGridKeys'
import { selectionToTSV, tsvToEdits } from './clipboard'

type Props = {
  state: State
  dispatch: (a: Action) => void
  view: number[]
  scrollToRowSignal: number | null   // jump-to-row target (view index) from toolbar
  onScrollHandled: () => void
}

export function Grid({ state, dispatch, view, scrollToRowSignal, onScrollHandled }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportH, setViewportH] = useState(600)
  const rafPending = useRef(false)
  const [editSeed, setEditSeed] = useState('')

  const cols = useMemo(() => orderedCols(state), [state])
  const pinnedSet = useMemo(() => new Set(state.pinned), [state.pinned])
  const isPinned = useCallback((id: ColId) => pinnedSet.has(id), [pinnedSet])

  // Sticky-left offset for the pinned column at ordered index c.
  const leftOf = useCallback((c: number) => {
    let x = 0
    for (let i = 0; i < c; i++) if (isPinned(cols[i])) x += state.widths[cols[i]]
    return x
  }, [cols, isPinned, state.widths])

  const totalWidth = useMemo(
    () => cols.reduce((w, id) => w + state.widths[id], 0),
    [cols, state.widths],
  )

  const win = useVirtual(scrollTop, viewportH, view.length)

  // rAF-coalesced scroll: never setState more than once per frame.
  const onScroll = useCallback(() => {
    if (rafPending.current) return
    rafPending.current = true
    requestAnimationFrame(() => {
      rafPending.current = false
      const el = scroller.current
      if (!el) return
      setScrollTop(el.scrollTop)
      setScrollLeft(el.scrollLeft)
    })
  }, [])

  // Track viewport height.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight))
    ro.observe(el)
    setViewportH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const ensureVisible = useCallback((r: number, c: number) => {
    const el = scroller.current
    if (!el) return
    const top = scrollToRow(r, el.scrollTop, el.clientHeight)
    if (top !== el.scrollTop) el.scrollTop = top
    // horizontal: bring column into view past the pinned band
    let x = 0
    for (let i = 0; i < c; i++) x += state.widths[cols[i]]
    const w = state.widths[cols[c]]
    const pinW = leftOf(cols.length) // total pinned width
    if (x < el.scrollLeft + pinW && !isPinned(cols[c])) el.scrollLeft = Math.max(0, x - pinW)
    else if (x + w > el.scrollLeft + el.clientWidth) el.scrollLeft = x + w - el.clientWidth
  }, [cols, state.widths, leftOf, isPinned])

  // When an edit closes (commit or cancel) the editor unmounts and focus
  // would fall to <body>; return it to the grid so keyboard nav continues.
  const wasEditing = useRef(false)
  useEffect(() => {
    if (wasEditing.current && !state.editing) scroller.current?.focus()
    wasEditing.current = !!state.editing
  }, [state.editing])

  // Jump-to-row from the toolbar.
  useEffect(() => {
    if (scrollToRowSignal == null) return
    ensureVisible(scrollToRowSignal, state.active.c)
    dispatch({ t: 'active', cell: { r: scrollToRowSignal, c: state.active.c } })
    onScrollHandled()
  }, [scrollToRowSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Editing helpers ----
  const beginEdit = useCallback((cell: Cell, seed = '') => {
    setEditSeed(seed)
    dispatch({ t: 'beginEdit', cell })
  }, [dispatch])

  const commitEdit = useCallback((cell: Cell, value: Row[keyof Row], move: 'down' | 'right' | 'none') => {
    const rowIdx = view[cell.r]
    const colId = cols[cell.c]
    dispatch({ t: 'setCell', rowId: ROWS[rowIdx].id, colId, next: value })
    if (move === 'down') { const next = { r: Math.min(view.length - 1, cell.r + 1), c: cell.c }; dispatch({ t: 'active', cell: next }); ensureVisible(next.r, next.c) }
    else if (move === 'right') { const next = { r: cell.r, c: Math.min(cols.length - 1, cell.c + 1) }; dispatch({ t: 'active', cell: next }); ensureVisible(next.r, next.c) }
  }, [view, cols, dispatch, ensureVisible])

  // ---- Clipboard ----
  const copySelection = useCallback(() => {
    const rect = selRect(state.selection) ?? { r0: state.active.r, r1: state.active.r, c0: state.active.c, c1: state.active.c }
    const tsv = selectionToTSV(view, cols, state.edits, rect)
    navigator.clipboard?.writeText(tsv).catch(() => {})
    dispatch({ t: 'announce', msg: `Copied ${(rect.r1 - rect.r0 + 1) * (rect.c1 - rect.c0 + 1)} cells` })
  }, [state.selection, state.active, view, cols, state.edits, dispatch])

  const pasteFrom = useCallback(async () => {
    let tsv = ''
    try { tsv = await navigator.clipboard.readText() } catch { return }
    if (!tsv) return
    const { cells, rejected } = tsvToEdits(tsv, view, cols, state.edits, state.active.r, state.active.c)
    if (cells.length) dispatch({ t: 'applyEdits', cells })
    if (rejected) dispatch({ t: 'announce', msg: `Pasted ${cells.length}, skipped ${rejected} invalid/locked` })
  }, [view, cols, state.edits, state.active, dispatch])

  // Native copy/paste events (fire when the focused grid is the target) —
  // synchronous clipboard access, no permission prompt.
  const onCopy = useCallback((e: React.ClipboardEvent) => {
    if (state.editing) return
    const rect = selRect(state.selection) ?? { r0: state.active.r, r1: state.active.r, c0: state.active.c, c1: state.active.c }
    e.clipboardData.setData('text/plain', selectionToTSV(view, cols, state.edits, rect))
    e.preventDefault()
  }, [state.editing, state.selection, state.active, view, cols, state.edits])

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    if (state.editing) return
    const tsv = e.clipboardData.getData('text/plain')
    if (!tsv) return
    e.preventDefault()
    const { cells, rejected } = tsvToEdits(tsv, view, cols, state.edits, state.active.r, state.active.c)
    if (cells.length) dispatch({ t: 'applyEdits', cells })
    if (rejected) dispatch({ t: 'announce', msg: `Pasted ${cells.length}, skipped ${rejected} invalid/locked` })
  }, [state.editing, view, cols, state.edits, state.active, dispatch])

  const rect = selRect(state.selection)
  const activeId = `pal-cell-${state.active.r}-${state.active.c}`

  // Rendered slice.
  const slice: number[] = []
  for (let i = win.start; i < win.end; i++) slice.push(i)

  return (
    <div
      ref={scroller}
      role="grid"
      aria-label="Cascadia Freight Systems shipment manifest"
      aria-rowcount={view.length + 1}
      aria-colcount={cols.length}
      aria-multiselectable="true"
      aria-activedescendant={activeId}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => handleGridKey(e, {
        state, dispatch, view, cols, viewportH,
        ensureVisible, beginEdit, copySelection, pasteFrom,
      })}
      onCopy={onCopy}
      onPaste={onPaste}
      className="relative h-full w-full overflow-auto bg-palisade-card outline-none"
    >
      <div style={{ width: totalWidth, position: 'relative' }}>
        <HeaderRow
          cols={cols}
          state={state}
          totalWidth={totalWidth}
          leftOf={leftOf}
          isPinned={isPinned}
          onSort={(id) => dispatch({ t: 'sort', col: id })}
          onFilter={(id, v) => dispatch({ t: 'setFilter', col: id, value: v })}
          onResize={(id, w) => dispatch({ t: 'resize', col: id, width: w })}
          onReorder={(from, to) => dispatch({ t: 'reorder', from, to })}
          onTogglePin={(id) => dispatch({ t: 'togglePin', col: id })}
        />

        {/* Spacer: full virtual height so the scrollbar is honest. */}
        <div role="rowgroup" style={{ height: win.totalHeight, position: 'relative' }}>
          {slice.map((vr) => {
            const rowIdx = view[vr]
            const base = ROWS[rowIdx]
            const zebra = vr % 2 === 1
            return (
              <div
                key={base.id}
                role="row"
                aria-rowindex={vr + 2}          // +1 for 1-based, +1 for header row
                aria-selected={rect ? vr >= rect.r0 && vr <= rect.r1 : vr === state.active.r}
                className="absolute left-0 flex"
                style={{ transform: `translateY(${vr * ROW_H}px)`, height: ROW_H, width: totalWidth }}
              >
                {cols.map((id, c) => {
                  const col = COLUMN_BY_ID[id]
                  const pinned = isPinned(id)
                  const isActive = state.active.r === vr && state.active.c === c
                  const inSel = rect && vr >= rect.r0 && vr <= rect.r1 && c >= rect.c0 && c <= rect.c1
                  const editing = state.editing?.r === vr && state.editing?.c === c
                  const value = cellValue(state.edits, rowIdx, id)
                  return (
                    <div
                      key={id}
                      id={`pal-cell-${vr}-${c}`}
                      role="gridcell"
                      aria-colindex={c + 1}
                      aria-selected={!!inSel}
                      onMouseDown={(e) => {
                        if (e.detail === 2) return
                        dispatch({ t: 'active', cell: { r: vr, c }, extend: e.shiftKey })
                      }}
                      onDoubleClick={() => { if (col.editable) beginEdit({ r: vr, c }) }}
                      className={[
                        'relative flex items-center border-b border-r border-palisade-line px-2 text-[0.82rem]',
                        col.align === 'right' ? 'justify-end' : '',
                        pinned ? 'sticky z-10' : '',
                        editing ? '' : zebra ? 'bg-palisade-card' : 'bg-palisade-bg',
                        isActive ? 'palisade-active' : '',
                        state.editError && isActive ? 'palisade-invalid' : '',
                      ].join(' ')}
                      style={{
                        width: state.widths[id],
                        left: pinned ? leftOf(c) : undefined,
                        backgroundColor: inSel && !isActive ? 'var(--color-palisade-sel)' : undefined,
                      }}
                    >
                      {editing ? (
                        <CellEditor
                          col={col}
                          row={mergedRow(state.edits, rowIdx)}
                          initial={editSeed || String(value)}
                          onCommit={(v, move) => commitEdit({ r: vr, c }, v, move)}
                          onCancel={() => dispatch({ t: 'cancelEdit' })}
                        />
                      ) : (
                        <CellView col={col} value={value} />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Keeps scrollLeft referenced so pinned math re-runs on horizontal scroll. */}
      <span hidden aria-hidden="true" data-sl={scrollLeft} />
    </div>
  )
}

export { ROW_COUNT }
