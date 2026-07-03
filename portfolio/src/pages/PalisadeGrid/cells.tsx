import { useEffect, useRef, useState } from 'react'
import {
  COLUMN_BY_ID, PRIORITIES, formatValue, parseValue,
  type ColDef, type Row, type Status,
} from './schema'

/* ---- Status badge — icon/dot + text, never colour alone (a11y) ---- */
const STATUS_STYLE: Record<Status, { color: string; dot: string }> = {
  Delivered: { color: 'text-palisade-good', dot: 'bg-palisade-good' },
  'In Transit': { color: 'text-palisade-info', dot: 'bg-palisade-info' },
  Scheduled: { color: 'text-palisade-muted', dot: 'bg-palisade-muted' },
  Delayed: { color: 'text-palisade-warn', dot: 'bg-palisade-warn' },
  Exception: { color: 'text-palisade-bad', dot: 'bg-palisade-bad' },
}

function StatusBadge({ value }: { value: Status }) {
  const st = STATUS_STYLE[value] ?? STATUS_STYLE.Scheduled
  return (
    <span className={`inline-flex items-center gap-1.5 ${st.color}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
      <span className="truncate">{value}</span>
    </span>
  )
}

const PRIORITY_COLOR: Record<string, string> = {
  Critical: 'text-palisade-bad',
  High: 'text-palisade-warn',
  Medium: 'text-palisade-ink',
  Low: 'text-palisade-muted',
}

/** Read-only display of a cell. */
export function CellView({ col, value }: { col: ColDef; value: unknown }) {
  if (col.type === 'status') return <StatusBadge value={value as Status} />
  if (col.type === 'priority')
    return <span className={PRIORITY_COLOR[String(value)] ?? ''}>{String(value)}</span>
  const cls = col.align === 'right' ? 'palisade-num tabular-nums' : ''
  return <span className={`block truncate ${cls}`}>{formatValue(col.type, value)}</span>
}

/* ---- Editors ---- */
export function CellEditor({
  col, row, initial, onCommit, onCancel,
}: {
  col: ColDef
  row: Row               // merged row (for cross-field validation)
  initial: string        // starting text ('' when opened by a typed char handled by caller)
  onCommit: (value: Row[keyof Row], move: 'down' | 'right' | 'none') => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initial)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement) el.select()
  }, [])

  const tryCommit = (move: 'down' | 'right' | 'none') => {
    const res = parseValue(col, text, row)
    if (!res.ok) { setErr(res.error); return false }
    onCommit(res.value, move)
    return true
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation() // the grid controller must not double-handle these
    if (e.key === 'Enter') { e.preventDefault(); tryCommit('down') }
    else if (e.key === 'Tab') { e.preventDefault(); tryCommit(e.shiftKey ? 'none' : 'right') }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  const shared =
    'absolute inset-0 h-full w-full bg-palisade-card-2 px-2 text-[0.82rem] text-palisade-ink ' +
    'outline-none ring-2 ring-inset ' + (err ? 'ring-palisade-bad' : 'ring-palisade-accent')

  if (col.type === 'enum' || col.type === 'status' || col.type === 'priority') {
    const opts = col.options ?? PRIORITIES
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        className={shared}
        value={text || String(row[col.id])}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => tryCommit('none')}
      >
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  const inputType = col.type === 'date' ? 'date' : col.type === 'text' ? 'text' : 'text'
  return (
    <>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={inputType}
        inputMode={col.type === 'number' || col.type === 'currency' ? 'decimal' : undefined}
        className={`${shared} ${col.align === 'right' ? 'text-right tabular-nums' : ''}`}
        value={text}
        onChange={(e) => { setText(e.target.value); if (err) setErr(null) }}
        onKeyDown={onKeyDown}
        onBlur={() => tryCommit('none')}
        aria-invalid={!!err}
        aria-label={`Edit ${col.header}`}
      />
      {err && (
        <span role="alert" className="pointer-events-none absolute left-0 top-full z-40 mt-0.5 whitespace-nowrap rounded bg-palisade-bad px-1.5 py-0.5 text-[0.68rem] font-medium text-palisade-bg shadow-lg">
          {err}
        </span>
      )}
    </>
  )
}

export { COLUMN_BY_ID }
