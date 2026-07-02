import type { MonthRow } from './data'
import { fmtCompact, fmtMonth, fmtPct } from './format'
import { netNew, SERIES, seriesValue } from './series'

/**
 * The hover layer: a crosshair that snaps to the nearest month, ringed dots
 * on every series, and ONE tooltip reading out all of them — the pointer
 * aims at a date, never at a 2px line. Everything here also exists without
 * hovering: the table twin below carries every value.
 */

export function HoverMarks({
  months,
  hovered,
  x,
  y,
  top,
  bottom,
}: {
  months: MonthRow[]
  hovered: number
  x: (i: number) => number
  y: (v: number) => number
  top: number
  bottom: number
}) {
  const cx = x(hovered)
  return (
    <g aria-hidden="true">
      <line x1={cx} x2={cx} y1={top} y2={bottom} stroke="var(--color-aero-muted)" strokeOpacity="0.45" strokeWidth="1" />
      {SERIES.map((s) => (
        <circle
          key={s.id}
          cx={cx}
          cy={y(seriesValue(s.id, months[hovered]))}
          r="4"
          fill={s.color}
          stroke="var(--color-aero-card)"
          strokeWidth="2"
        />
      ))}
    </g>
  )
}

export function ChartTooltip({
  months,
  hovered,
  px,
  py,
  w,
  h,
}: {
  months: MonthRow[]
  hovered: number
  /** Pixel anchor: the hovered month's x and the total line's y. */
  px: number
  py: number
  w: number
  h: number
}) {
  const m = months[hovered]
  const flip = px > w * 0.62
  const top = Math.max(8, Math.min(py - 16, h - 168))
  return (
    <div
      aria-hidden="true"
      className="aero-fade pointer-events-none absolute left-0 top-0 z-10 w-48 rounded-lg border border-aero-line bg-aero-card-2/95 p-3 shadow-lg backdrop-blur-sm"
      style={{
        transform: `translate3d(${px.toFixed(1)}px, ${top.toFixed(1)}px, 0) translateX(${flip ? 'calc(-100% - 14px)' : '14px'})`,
        transition: 'transform 140ms var(--ease-out)',
      }}
    >
      <p className="aero-label">{fmtMonth(m.label)}</p>
      <ul className="mt-2 space-y-1.5">
        {SERIES.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-xs">
            <span className="h-0.5 w-3 flex-none rounded-full" style={{ background: s.color }} />
            <span className="text-aero-muted">{s.id === 'total' ? 'Total' : s.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-aero-ink">{fmtCompact(seriesValue(s.id, m))}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-aero-line pt-2 font-mono text-[10px] text-aero-muted">
        +{fmtCompact(netNew(m))} net new · churn {fmtPct(m.churnRate)}
      </p>
    </div>
  )
}

/** The WCAG-clean twin — every plotted value, reachable without a pointer. */
export function ChartTable({ months }: { months: MonthRow[] }) {
  return (
    <table className="sr-only">
      <caption>Monthly recurring revenue by tier, with churn</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          {SERIES.map((s) => (
            <th key={s.id} scope="col">
              {s.name}
            </th>
          ))}
          <th scope="col">Churn</th>
        </tr>
      </thead>
      <tbody>
        {months.map((m) => (
          <tr key={m.label}>
            <th scope="row">{fmtMonth(m.label)}</th>
            {SERIES.map((s) => (
              <td key={s.id}>{fmtCompact(seriesValue(s.id, m))}</td>
            ))}
            <td>{fmtPct(m.churnRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
