import { useMemo } from 'react'
import { CASE } from './generate'
import { REL_META, TYPE_COLOR, TYPE_LABEL, fmtDate, fmtMoney, ms } from './schema'
import { TypeGlyph, RiskDot } from './icons'
import type { Action, SkeinState } from './model'

/* The inspector: a selected entity (type, risk, aliases, note, its in-window
   relationships), a selected relationship (endpoints, date, amount / location,
   note), a multi-selection list, or the empty prompt. */

type Props = { state: SkeinState; dispatch: (a: Action) => void }

export function DetailPanel({ state, dispatch }: Props) {
  const byId = useMemo(() => new Map(CASE.entities.map((e) => [e.id, e])), [])
  const { selected, selectedRel, window: w } = state

  if (selectedRel) {
    const r = CASE.rels.find((x) => x.id === selectedRel)
    if (!r) return null
    const a = byId.get(r.source)!
    const b = byId.get(r.target)!
    const meta = REL_META[r.type]
    return (
      <Shell title="Relationship">
        <p className="text-sm text-skein-ink">
          <button className="underline decoration-skein-line hover:decoration-skein-thread" onClick={() => dispatch({ t: 'select', id: a.id, additive: false })}>{a.name}</button>
          {' '}<span className="text-skein-thread">{meta.label}</span>{' '}
          <button className="underline decoration-skein-line hover:decoration-skein-thread" onClick={() => dispatch({ t: 'select', id: b.id, additive: false })}>{b.name}</button>
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row k="Date" v={fmtDate(r.date)} />
          {meta.carriesMoney && r.amount != null && <Row k="Amount" v={fmtMoney(r.amount)} />}
          {meta.carriesLocation && r.locationId && <Row k="Location" v={byId.get(r.locationId)?.name ?? r.locationId} />}
          {r.note && <Row k="Note" v={r.note} />}
        </dl>
      </Shell>
    )
  }

  if (selected.length === 1) {
    const e = byId.get(selected[0])
    if (!e) return null
    const rels = CASE.rels
      .filter((r) => (r.source === e.id || r.target === e.id) && ms(r.date) >= w[0] && ms(r.date) <= w[1])
      .sort((a, b) => ms(a.date) - ms(b.date))
    return (
      <Shell title={TYPE_LABEL[e.type]}>
        <div className="flex items-start gap-3">
          <span style={{ color: TYPE_COLOR[e.type] }}><TypeGlyph type={e.type} size={22} /></span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-skein-ink">{e.name}</h3>
            <p className="text-sm text-skein-ink-2">{e.subtitle}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-skein-muted">
          <RiskDot risk={e.risk} /> <span className="uppercase tracking-wide">{e.risk} risk</span>
          {e.country && <><span aria-hidden>·</span> <span>{e.country}</span></>}
        </div>
        {e.aliases.length > 0 && <p className="mt-2 text-xs text-skein-muted">aka {e.aliases.join(', ')}</p>}
        <p className="mt-3 text-sm text-skein-ink-2">{e.note}</p>
        <p className="skein-label mt-4">{rels.length} link{rels.length === 1 ? '' : 's'} in window</p>
        <ul className="mt-1.5 max-h-56 space-y-1 overflow-y-auto pr-1">
          {rels.map((r) => {
            const other = byId.get(r.source === e.id ? r.target : r.source)!
            return (
              <li key={r.id}>
                <button
                  onClick={() => dispatch({ t: 'selectRel', id: r.id })}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm text-skein-ink-2 hover:bg-skein-card-2"
                >
                  <span className="truncate"><span className="text-skein-thread">{REL_META[r.type].short}</span> {other.name}</span>
                  <span className="skein-num shrink-0 text-xs text-skein-muted">{fmtDate(r.date)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Shell>
    )
  }

  if (selected.length > 1) {
    return (
      <Shell title={`${selected.length} entities selected`}>
        <ul className="space-y-1">
          {selected.map((id) => {
            const e = byId.get(id)!
            return <li key={id} className="flex items-center gap-2 text-sm text-skein-ink-2"><span style={{ color: TYPE_COLOR[e.type] }}><TypeGlyph type={e.type} size={14} /></span> {e.name}</li>
          })}
        </ul>
        <button onClick={() => dispatch({ t: 'clearSelection' })} className="skein-num mt-3 text-xs text-skein-thread hover:underline">clear selection</button>
      </Shell>
    )
  }

  return (
    <Shell title="Inspector">
      <p className="text-sm text-skein-ink-2">
        Select an entity in the graph or the list, click a relationship thread, or click a port on the map.
        Scrub the timeline to change the window everything is filtered to.
      </p>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="skein-fade rounded-xl border border-skein-line bg-skein-card p-4">
      <p className="skein-label mb-2">{title}</p>
      {children}
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-skein-muted">{k}</dt>
      <dd className="skein-num text-right text-skein-ink">{v}</dd>
    </div>
  )
}
