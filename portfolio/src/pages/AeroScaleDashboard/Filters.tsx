import { useRef } from 'react'
import type { TfId, TierId } from './data'
import { TIER_META, TIER_ORDER, TIMEFRAMES } from './data'

/**
 * The one filter row — it scopes every card below it, so all the numbers on
 * screen always agree. Standard form controls styled to the chart chrome.
 */

export function TimeframeControl({ value, onChange }: { value: TfId; onChange: (t: TfId) => void }) {
  const btns = useRef<(HTMLButtonElement | null)[]>([])
  const idx = TIMEFRAMES.findIndex((t) => t.id === value)
  const move = (i: number) => {
    onChange(TIMEFRAMES[i].id)
    btns.current[i]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-label="Timeframe"
      className="relative grid grid-cols-6 rounded-lg border border-aero-line p-1"
      onKeyDown={(e) => {
        const n = TIMEFRAMES.length
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move((idx + n - 1) % n)
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move((idx + 1) % n)
        else if (e.key === 'Home') move(0)
        else if (e.key === 'End') move(n - 1)
        else return
        e.preventDefault()
      }}
    >
      {/* The sliding selection — one element, transform only. */}
      <span
        aria-hidden="true"
        className="aero-slide absolute bottom-1 left-1 top-1 rounded-md bg-aero-card-2"
        style={{ width: 'calc((100% - 0.5rem) / 6)', transform: `translateX(${idx * 100}%)` }}
      />
      {TIMEFRAMES.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            btns.current[i] = el
          }}
          role="radio"
          aria-checked={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          onClick={() => onChange(t.id)}
          className={`relative rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors ${
            t.id === value ? 'text-aero-ink' : 'text-aero-muted hover:text-aero-ink-2'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function TierChips({
  active,
  onToggle,
  onPreview,
}: {
  active: ReadonlySet<TierId>
  onToggle: (t: TierId) => void
  onPreview: (t: TierId | null) => void
}) {
  return (
    <div role="group" aria-label="Revenue tiers" className="flex items-center gap-2">
      {TIER_ORDER.map((id) => {
        const on = active.has(id)
        // An empty chart is a bug you designed in — the last tier stays on.
        const last = on && active.size === 1
        return (
          <button
            key={id}
            aria-pressed={on}
            title={last ? 'At least one tier stays on' : undefined}
            onClick={() => {
              if (!last) onToggle(id)
            }}
            onMouseEnter={() => on && onPreview(id)}
            onMouseLeave={() => onPreview(null)}
            onFocus={() => on && onPreview(id)}
            onBlur={() => onPreview(null)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              on
                ? 'border-aero-line bg-aero-card text-aero-ink-2 hover:text-aero-ink'
                : 'border-transparent text-aero-muted opacity-55 hover:opacity-80'
            }`}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full border transition-colors"
              style={{ background: on ? TIER_META[id].color : 'transparent', borderColor: TIER_META[id].color }}
            />
            {TIER_META[id].name}
          </button>
        )
      })}
    </div>
  )
}
