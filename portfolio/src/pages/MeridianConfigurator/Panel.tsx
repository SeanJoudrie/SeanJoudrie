import { useRef, useState } from 'react'
import { useCountUp } from '../../lib/ticker'
import type { PartId, Selection } from './config'
import { PARTS, priceOf } from './config'
import type { ControlsRef, PresetId } from './Scene'
import { flyTo } from './Scene'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmt = (n: number) => usd.format(n)

const VIEWS: { id: PresetId; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'dial', label: 'Dial' },
  { id: 'crown', label: 'Crown' },
  { id: 'strap', label: 'Strap' },
]

/**
 * The configurator panel — plain HTML buttons doing all the work, so the
 * whole watch is configurable without ever touching the canvas. One polite
 * live region narrates changes for screen readers.
 */
export function Panel({
  selection,
  onSelect,
  controls,
}: {
  selection: Selection
  onSelect: (part: PartId, id: string) => void
  controls: ControlsRef
}) {
  const price = priceOf(selection)
  const priceRef = useCountUp(price, fmt, 700)
  const [announce, setAnnounce] = useState('')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(0)

  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-xl border border-meridian-line bg-meridian-card p-5">
        <h1 className="text-xl font-semibold tracking-tight">The Meridian One</h1>
        <p className="mt-1 text-sm text-meridian-ink-2">40mm · quartz, keeping your real local time · every part procedural.</p>

        {PARTS.map((part) => (
          <fieldset key={part.id} className="mt-4">
            <legend className="meridian-label">{part.label}</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {part.options.map((o) => {
                const active = selection[part.id] === o.id
                return (
                  <button
                    key={o.id}
                    aria-pressed={active}
                    onClick={() => {
                      onSelect(part.id, o.id)
                      setAnnounce(`${part.label}: ${o.label}${o.priceDelta ? ` (+$${o.priceDelta})` : ''}`)
                    }}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-meridian-brass bg-meridian-card-2 text-meridian-ink'
                        : 'border-meridian-line text-meridian-ink-2 hover:border-meridian-brass-2 hover:text-meridian-ink'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full border border-white/20"
                      style={{ background: o.swatch }}
                    />
                    {o.label}
                    {o.priceDelta > 0 && <span className="font-mono text-[10px] text-meridian-muted">+{o.priceDelta}</span>}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="rounded-xl border border-meridian-line bg-meridian-card p-5">
        <h2 className="meridian-label">Views</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => flyTo(controls, v.id)}
              className="rounded-md border border-meridian-line px-3 py-1.5 font-mono text-xs text-meridian-ink-2 transition-colors hover:border-meridian-brass-2 hover:text-meridian-ink"
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-meridian-line bg-meridian-card p-5">
        <h2 className="meridian-label">Demo pricing</h2>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-meridian-ink">
          <span className="sr-only">{fmt(price)}</span>
          <span aria-hidden="true" className="relative inline-block">
            <span className="invisible">{fmt(price)}</span>
            <span ref={priceRef} className="absolute inset-0 whitespace-nowrap" />
          </span>
        </p>
        <p className="mt-1 font-mono text-xs text-meridian-muted">Fictional brand, fictional price.</p>
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(window.location.href).then(() => {
              setCopied(true)
              setAnnounce('Link copied to clipboard')
              window.clearTimeout(copyTimer.current)
              copyTimer.current = window.setTimeout(() => setCopied(false), 1800)
            })
          }}
          className="springy mt-4 w-full rounded-lg bg-meridian-brass px-4 py-2.5 text-sm font-semibold text-meridian-bg hover:bg-meridian-brass-2"
        >
          {copied ? 'Link copied ✓' : 'Share this build'}
        </button>
      </section>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </aside>
  )
}
