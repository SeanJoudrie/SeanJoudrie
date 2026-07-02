import type { CSSProperties } from 'react'
import { useCountUp } from './useSharedTicker'

export type Delta = { label: string; up: boolean; vs: string }

/** 12-point trend in the de-emphasis ink; the current period gets the accent dot. */
function Sparkline({ points }: { points: number[] }) {
  const W = 120
  const H = 30
  const P = 4
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const xy = points.map((v, i) => [
    P + (i / (points.length - 1)) * (W - 2 * P),
    H - P - ((v - min) / span) * (H - 2 * P),
  ])
  const [ex, ey] = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-4 h-8 w-full" aria-hidden="true">
      <polyline
        points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="var(--color-aero-muted)"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={ex} cy={ey} r="2.5" fill="var(--color-aero-starter)" />
    </svg>
  )
}

/**
 * The stat-tile contract: label · value (proportional figures — tabular would
 * loosen large numbers) · signed delta vs a named period · optional trend.
 * The value is a live ticker on the shared rAF loop: it counts up from zero
 * on load and tweens from its current value when a filter rescopes it. The
 * invisible twin span reserves the final width, so nothing reflows mid-count.
 */
export function StatTile({
  label,
  value,
  format,
  delta,
  spark,
  note,
  hero = false,
  delay = 0,
  className = '',
}: {
  label: string
  value: number
  format: (n: number) => string
  delta?: Delta
  spark?: number[]
  note?: string
  hero?: boolean
  delay?: number
  className?: string
}) {
  const ticker = useCountUp(value, format)
  return (
    <section
      className={`hero-in rounded-xl border border-aero-line bg-aero-card p-5 ${className}`}
      style={{ '--d': `${delay}ms` } as CSSProperties}
    >
      <h2 className="aero-label">{label}</h2>
      <p className={`mt-2.5 font-semibold tracking-tight text-aero-ink ${hero ? 'text-5xl' : 'text-3xl'}`}>
        <span className="sr-only">{format(value)}</span>
        <span aria-hidden="true" className="relative inline-block">
          <span className="invisible">{format(value)}</span>
          <span ref={ticker} className="absolute inset-0 whitespace-nowrap" />
        </span>
      </p>
      {delta && (
        <p className="mt-2.5 text-xs font-medium">
          <span className={delta.up ? 'text-aero-good' : 'text-aero-bad'}>
            <span aria-hidden="true">{delta.up ? '▲' : '▼'}</span>
            <span className="sr-only">{delta.up ? 'up' : 'down'}</span> {delta.label}
          </span>
          <span className="ml-1.5 text-aero-muted">vs {delta.vs}</span>
        </p>
      )}
      {note && <p className="mt-2.5 font-mono text-xs text-aero-muted">{note}</p>}
      {spark && <Sparkline points={spark} />}
    </section>
  )
}
