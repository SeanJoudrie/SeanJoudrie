import type { MonthRow, TierId } from './data'
import { TIER_META, TIER_ORDER } from './data'
import { fmtCompact, fmtMonth, fmtPct } from './format'

const CX = 100
const CY = 100
const R = 72
const STROKE = 26
/** Half of the 2px surface gap between segments, as an angle at radius R. */
const GAP = 1 / R

const point = (a: number) => [CX + R * Math.cos(a), CY + R * Math.sin(a)]

function arcPath(a0: number, a1: number) {
  const [x0, y0] = point(a0)
  const [x1, y1] = point(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/**
 * Part-to-whole at a glance — three segments, so a donut is the right form.
 * Segments are stroke arcs separated by the 2px surface gap (butt caps; round
 * caps would eat the gap), identity carried by the legend beside it. Scopes
 * to the active tiers, like everything below the filter row.
 */
export function TierDonut({ row, active }: { row: MonthRow; active: ReadonlySet<TierId> }) {
  const ids = TIER_ORDER.filter((id) => active.has(id))
  const total = ids.reduce((s, id) => s + row.tiers[id].mrr, 0)
  const shares = ids.map((id) => ({ id, share: row.tiers[id].mrr / total }))

  let angle = -Math.PI / 2
  const segments = shares.map(({ id, share }) => {
    const a0 = angle
    angle += share * Math.PI * 2
    return { id, d: arcPath(a0 + GAP, angle - GAP) }
  })

  const described = shares.map(({ id, share }) => `${TIER_META[id].name} ${fmtPct(share)}`).join(', ')

  return (
    <div>
      <div className="relative mx-auto mt-2 h-44 w-44">
        <svg viewBox="0 0 200 200" role="img" aria-label={`Revenue by tier, ${fmtMonth(row.label)}: ${described}`}>
          {segments.map((s) => (
            <path key={s.id} d={s.d} fill="none" stroke={TIER_META[s.id].color} strokeWidth={STROKE} />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-semibold tracking-tight text-aero-ink">{fmtCompact(total)}</p>
            <p className="aero-label mt-0.5">MRR</p>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {shares.map(({ id, share }) => (
          <li key={id} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 flex-none rounded-full"
              style={{ background: TIER_META[id as TierId].color }}
            />
            <span className="text-aero-ink-2">{TIER_META[id].name}</span>
            <span className="ml-auto font-mono text-xs text-aero-muted">
              {fmtCompact(row.tiers[id].mrr)} · {fmtPct(share)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
