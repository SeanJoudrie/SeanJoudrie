import { useEffect, useRef, useState } from 'react'
import { WILDCARD_ID } from '../data/topics'
import type { Category, Mix } from '../lib/types'

/**
 * The mix, three ways (F-07): a two-ring sunburst (categories inside,
 * sub-topics outside), stacked bars, and a numbers table that doubles as the
 * accessible view. Same data, one toggle.
 */

export type View = 'pie' | 'bars' | 'numbers'

/** Color follows the category (its slot), never its rank. */
export function categoryColor(cats: Category[], id: string): string {
  if (id === WILDCARD_ID) return 'var(--s-wild)'
  const slot = cats.filter((c) => c.id !== WILDCARD_ID).findIndex((c) => c.id === id)
  return `var(--s${(slot % 7) + 1})`
}

/** Sub-topics are tints of their parent hue. */
export function childColor(base: string, i: number): string {
  const mix = [100, 70, 50, 36, 26][Math.min(i, 4)]
  return mix === 100 ? base : `color-mix(in oklab, ${base} ${mix}%, var(--card))`
}

export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const opts: { id: View; label: string }[] = [
    { id: 'pie', label: 'Pie' },
    { id: 'bars', label: 'Bars' },
    { id: 'numbers', label: 'Numbers' },
  ]
  return (
    <div role="radiogroup" aria-label="Chart view" className="inline-flex rounded-full border border-line bg-paper-2 p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={view === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            view === o.id ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function MixChart({
  mix,
  view,
  selected,
  onSelect,
}: {
  mix: Mix
  view: View
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div key={view} className="anim-pop">
      {view === 'pie' && <Sunburst mix={mix} selected={selected} onSelect={onSelect} />}
      {view === 'bars' && <Bars mix={mix} selected={selected} onSelect={onSelect} />}
      {view === 'numbers' && <NumbersTable mix={mix} />}
      {view !== 'numbers' && <Legend mix={mix} />}
    </div>
  )
}

/* ---------- Sunburst ---------- */

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tween an array of numbers so arcs grow instead of jumping. */
function useTween(target: number[], ms = 380): number[] {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const key = target.join(',')
  useEffect(() => {
    if (reduceMotion() || from.current.length !== target.length) {
      from.current = target
      setValue(target)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      const next = target.map((v, i) => a[i] + (v - a[i]) * e)
      setValue(next)
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      from.current = target
    }
  }, [key])
  return value
}

function arc(r0: number, r1: number, a0: number, a1: number): string {
  const gap = 0.012 // radians of surface between slices
  if (a1 - a0 <= gap * 1.5) return ''
  const s = a0 + gap / 2
  const e = a1 - gap / 2
  const p = (r: number, a: number) => `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`
  const large = e - s > Math.PI ? 1 : 0
  if (e - s >= 2 * Math.PI - 0.02) {
    // A full ring: two half arcs.
    const m = s + Math.PI
    return `M ${p(r1, s)} A ${r1} ${r1} 0 1 1 ${p(r1, m)} A ${r1} ${r1} 0 1 1 ${p(r1, s)} M ${p(r0, s)} A ${r0} ${r0} 0 1 0 ${p(r0, m)} A ${r0} ${r0} 0 1 0 ${p(r0, s)} Z`
  }
  return `M ${p(r1, s)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, e)} L ${p(r0, e)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, s)} Z`
}

function Sunburst({ mix, selected, onSelect }: { mix: Mix; selected: string | null; onSelect: (id: string) => void }) {
  const cats = mix.categories
  const flat = cats.flatMap((c) => [c.weight, ...c.children.map((k) => k.weight)])
  const tw = useTween(flat)
  const [hover, setHover] = useState<{ label: string; pct: number } | null>(null)

  // Rebuild the tweened values into angles.
  let idx = 0
  let angle = 0
  const segs = cats.map((c) => {
    const w = tw[idx++]
    const a0 = angle
    const a1 = angle + (w / 100) * 2 * Math.PI
    angle = a1
    let inner = a0
    const kids = c.children.map((k) => {
      const kw = tw[idx++]
      const k0 = inner
      const k1 = inner + ((a1 - a0) * kw) / 100
      inner = k1
      return { k, k0, k1 }
    })
    return { c, a0, a1, kids }
  })

  const center = hover ?? (selected ? find(cats, selected) : null)

  return (
    <figure className="m-0">
      <svg viewBox="-110 -110 220 220" className="mx-auto block w-full max-w-[320px]" role="group" aria-label="Your mix as a two-ring pie chart">
        {segs.map(({ c, a0, a1, kids }) => {
          const base = categoryColor(cats, c.id)
          const isSel = selected === c.id
          return (
            <g key={c.id}>
              <path
                d={arc(isSel ? 38 : 40, isSel ? 74 : 72, a0, a1)}
                fill={base}
                stroke="var(--card)"
                strokeWidth={1}
                tabIndex={0}
                role="button"
                aria-label={`${c.label}: ${c.weight}%. Edit sub-topics`}
                className="cursor-pointer outline-none"
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(c.id))}
                onMouseEnter={() => setHover({ label: c.label, pct: c.weight })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ label: c.label, pct: c.weight })}
                onBlur={() => setHover(null)}
              />
              {kids.map(({ k, k0, k1 }, i) => (
                <path
                  key={k.id}
                  d={arc(76, 104, k0, k1)}
                  fill={childColor(base, i)}
                  stroke="var(--card)"
                  strokeWidth={1}
                  aria-hidden
                  onMouseEnter={() => setHover({ label: `${k.label} (in ${c.label})`, pct: Math.round((c.weight * k.weight) / 100) })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(c.id)}
                  className="cursor-pointer"
                />
              ))}
            </g>
          )
        })}
        <text textAnchor="middle" y={center ? -2 : 4} className="font-display" fontSize={center ? 22 : 24} fontWeight={800} fill="var(--ink)">
          {center ? `${center.pct}%` : '100%'}
        </text>
        <text textAnchor="middle" y={center ? 14 : 20} fontSize={center ? 8 : 9} fill="var(--muted)">
          {center ? truncate(center.label, 22) : 'your feed'}
        </text>
      </svg>
      <figcaption className="sr-only">Inner ring: categories. Outer ring: sub-topics within each category. Switch to Numbers for a table.</figcaption>
    </figure>
  )
}

function find(cats: Category[], id: string) {
  const c = cats.find((x) => x.id === id)
  return c ? { label: c.label, pct: c.weight } : null
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/* ---------- Bars ---------- */

function Bars({ mix, selected, onSelect }: { mix: Mix; selected: string | null; onSelect: (id: string) => void }) {
  const cats = mix.categories
  const max = Math.max(...cats.map((c) => c.weight), 1)
  return (
    <ul className="m-0 list-none space-y-3 p-0" aria-label="Your mix as bars">
      {cats.map((c) => {
        const base = categoryColor(cats, c.id)
        return (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={`block w-full rounded-lg p-1 text-left ${selected === c.id ? 'bg-paper-2' : ''}`}
              aria-label={`${c.label}: ${c.weight}%. Edit sub-topics`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium text-ink">{c.label}</span>
                <span className="font-display tabular-nums text-ink-2">{c.weight}%</span>
              </div>
              <div className="flex h-5 overflow-hidden rounded-r-[4px]" style={{ width: `${(c.weight / max) * 100}%`, minWidth: c.weight ? 6 : 0 }}>
                {c.children.map((k, i) => (
                  <div
                    key={k.id}
                    className="bar-seg h-full"
                    title={`${k.label}: ${Math.round((c.weight * k.weight) / 100)}% of your feed`}
                    style={{
                      width: `${k.weight}%`,
                      background: childColor(base, i),
                      borderRight: i < c.children.length - 1 ? '2px solid var(--card)' : undefined,
                    }}
                  />
                ))}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ---------- Numbers (also the accessible table) ---------- */

function NumbersTable({ mix }: { mix: Mix }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Your mix: share of your feed by category and sub-topic</caption>
      <thead>
        <tr className="border-b border-line text-left text-muted">
          <th scope="col" className="py-2 font-medium">Topic</th>
          <th scope="col" className="py-2 text-right font-medium">Share of feed</th>
        </tr>
      </thead>
      <tbody>
        {mix.categories.map((c) => (
          <FragmentRows key={c.id} c={c} cats={mix.categories} />
        ))}
      </tbody>
    </table>
  )
}

function FragmentRows({ c, cats }: { c: Category; cats: Category[] }) {
  const base = categoryColor(cats, c.id)
  return (
    <>
      <tr className="border-b border-line">
        <th scope="row" className="py-2 text-left font-semibold text-ink">
          <span className="mr-2 inline-block h-3 w-3 rounded-full align-[-1px]" style={{ background: base }} aria-hidden />
          {c.label}
        </th>
        <td className="py-2 text-right font-display font-semibold tabular-nums">{c.weight}%</td>
      </tr>
      {c.children.length > 1 &&
        c.children.map((k, i) => (
          <tr key={k.id} className="text-ink-2">
            <th scope="row" className="py-1 pl-5 text-left font-normal">
              <span className="mr-2 inline-block h-2 w-2 rounded-full align-[-1px]" style={{ background: childColor(base, i) }} aria-hidden />
              {k.label}
            </th>
            <td className="py-1 text-right tabular-nums">{Math.round((c.weight * k.weight) / 100)}%</td>
          </tr>
        ))}
    </>
  )
}

function Legend({ mix }: { mix: Mix }) {
  return (
    <ul className="mt-4 flex list-none flex-wrap justify-center gap-x-4 gap-y-2 p-0 text-sm text-ink-2" aria-hidden>
      {mix.categories.map((c) => (
        <li key={c.id} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: categoryColor(mix.categories, c.id) }} />
          {c.label} <span className="tabular-nums text-muted">{c.weight}%</span>
        </li>
      ))}
    </ul>
  )
}
