import { useEffect, useMemo, useRef, useState } from 'react'
import { CASE } from './generate'
import { TYPE_COLOR, TYPE_LABEL } from './schema'
import { TypeGlyph, RiskDot } from './icons'
import type { Action, SkeinState } from './model'
import type { Derived } from './model'

/* The accessible equivalent to the graph: a role="listbox" of every entity —
   filterable, keyboard-navigable (↑/↓, Home/End, Enter to select), in sync
   with the graph selection. Not a second-class fallback; it sits in the
   primary layout. */

type Props = { state: SkeinState; derived: Derived; dispatch: (a: Action) => void }

export function EntityList({ state, derived, dispatch }: Props) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return CASE.entities
      .filter((e) => !needle || e.name.toLowerCase().includes(needle) || e.subtitle.toLowerCase().includes(needle) || e.aliases.some((a) => a.toLowerCase().includes(needle)))
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  }, [q])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => {
    document.getElementById(`skein-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const selSet = new Set(state.selected)

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(rows.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(rows.length - 1) }
    else if (e.key === 'Enter' && rows[active]) { e.preventDefault(); dispatch({ t: 'select', id: rows[active].id, additive: e.shiftKey }) }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-skein-line bg-skein-card p-3">
      <label className="skein-label mb-2" htmlFor="skein-filter">Entities · {rows.length}</label>
      <input
        id="skein-filter"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKey}
        placeholder="Filter entities…"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded="true"
        aria-controls="skein-entity-list"
        aria-activedescendant={rows[active] ? `skein-opt-${active}` : undefined}
        className="mb-2 w-full rounded-lg border border-skein-line bg-skein-card-2 px-3 py-2 text-sm text-skein-ink outline-none placeholder:text-skein-muted"
      />
      <ul id="skein-entity-list" ref={listRef} role="listbox" aria-label="Case entities" className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((e, i) => {
          const st = derived.nodeState.get(e.id)!
          const isSel = selSet.has(e.id)
          return (
            <li
              key={e.id}
              id={`skein-opt-${i}`}
              role="option"
              aria-selected={isSel}
              onClick={(ev) => { setActive(i); dispatch({ t: 'select', id: e.id, additive: ev.shiftKey }) }}
              onMouseEnter={() => dispatch({ t: 'hover', id: e.id })}
              onMouseLeave={() => dispatch({ t: 'hover', id: null })}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${
                isSel ? 'bg-skein-sel text-skein-ink' : i === active ? 'bg-skein-card-2 text-skein-ink' : 'text-skein-ink-2'
              } ${st.dim && !isSel ? 'opacity-45' : ''}`}
            >
              <span style={{ color: TYPE_COLOR[e.type] }} title={TYPE_LABEL[e.type]}><TypeGlyph type={e.type} size={15} /></span>
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              <RiskDot risk={e.risk} />
            </li>
          )
        })}
        {rows.length === 0 && <li role="option" aria-selected={false} className="px-2 py-6 text-center text-sm text-skein-muted">no entities match “{q}”</li>}
      </ul>
    </div>
  )
}
