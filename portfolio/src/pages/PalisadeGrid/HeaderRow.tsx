import { useRef } from 'react'
import { COLUMN_BY_ID, type ColId } from './schema'
import { HEADER_H, FILTER_H } from './useVirtual'
import type { State } from './model'

type Props = {
  cols: ColId[]
  state: State
  totalWidth: number
  leftOf: (c: number) => number       // sticky-left px for pinned col index c
  isPinned: (id: ColId) => boolean
  onSort: (id: ColId) => void
  onFilter: (id: ColId, v: string) => void
  onResize: (id: ColId, w: number) => void
  onReorder: (from: ColId, to: ColId) => void
  onTogglePin: (id: ColId) => void
}

export function HeaderRow(p: Props) {
  const dragCol = useRef<ColId | null>(null)

  const startResize = (id: ColId, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const startW = p.state.widths[id]
    const move = (ev: PointerEvent) => p.onResize(id, startW + (ev.clientX - startX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div role="rowgroup" className="sticky top-0 z-30" style={{ width: p.totalWidth }}>
      {/* Header row */}
      <div role="row" className="flex" style={{ height: HEADER_H }}>
        {p.cols.map((id, c) => {
          const col = COLUMN_BY_ID[id]
          const pinned = p.isPinned(id)
          const sorted = p.state.sort?.col === id ? p.state.sort.dir : null
          return (
            <div
              key={id}
              role="columnheader"
              aria-colindex={c + 1}
              aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
              draggable={!pinned}
              onDragStart={() => (dragCol.current = id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragCol.current && dragCol.current !== id) p.onReorder(dragCol.current, id); dragCol.current = null }}
              className={`group relative flex items-center gap-1 border-b border-r border-palisade-line bg-palisade-card-2 px-2 text-palisade-ink-2 ${pinned ? 'sticky z-10' : ''}`}
              style={{ width: p.state.widths[id], left: pinned ? p.leftOf(c) : undefined }}
            >
              <button
                type="button"
                onClick={() => p.onSort(id)}
                className="flex min-w-0 flex-1 items-center gap-1 truncate text-left text-[0.7rem] font-semibold uppercase tracking-wide hover:text-palisade-ink"
                title={`Sort by ${col.header}`}
              >
                <span className="truncate">{col.header}</span>
                <span aria-hidden="true" className={`text-palisade-accent ${sorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                  {sorted === 'desc' ? '▾' : '▴'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => p.onTogglePin(id)}
                title={pinned ? 'Unpin column' : 'Pin column'}
                aria-pressed={pinned}
                className={`shrink-0 rounded px-1 text-[0.7rem] ${pinned ? 'text-palisade-accent' : 'text-palisade-muted opacity-0 hover:text-palisade-ink group-hover:opacity-100'}`}
              >
                {pinned ? '📌' : '📍'}
              </button>
              {/* resize handle */}
              <span
                onPointerDown={(e) => startResize(id, e)}
                className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize hover:bg-palisade-accent/60"
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize ${col.header}`}
              />
            </div>
          )
        })}
      </div>

      {/* Filter row */}
      <div role="row" className="flex" style={{ height: FILTER_H }}>
        {p.cols.map((id, c) => {
          const col = COLUMN_BY_ID[id]
          const pinned = p.isPinned(id)
          const val = p.state.filters[id] ?? ''
          const isEnum = col.type === 'enum' || col.type === 'status' || col.type === 'priority'
          return (
            <div
              key={id}
              className={`flex items-center border-b border-r border-palisade-line bg-palisade-card px-1.5 ${pinned ? 'sticky z-10' : ''}`}
              style={{ width: p.state.widths[id], left: pinned ? p.leftOf(c) : undefined }}
            >
              {isEnum ? (
                <select
                  aria-label={`Filter ${col.header}`}
                  value={val}
                  onChange={(e) => p.onFilter(id, e.target.value)}
                  className="w-full bg-transparent py-1 text-[0.72rem] text-palisade-ink-2 outline-none focus-visible:text-palisade-ink"
                >
                  <option value="">All</option>
                  {(col.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  aria-label={`Filter ${col.header}`}
                  value={val}
                  onChange={(e) => p.onFilter(id, e.target.value)}
                  placeholder="Filter…"
                  className="w-full bg-transparent py-1 text-[0.72rem] text-palisade-ink-2 placeholder:text-palisade-muted/60 outline-none focus-visible:text-palisade-ink"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
