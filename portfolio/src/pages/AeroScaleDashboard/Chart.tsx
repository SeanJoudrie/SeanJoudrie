import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { MonthRow } from './data'
import { ChartTable, ChartTooltip, HoverMarks } from './ChartHover'
import { fmtCompact, fmtMonth } from './format'
import type { SeriesId } from './series'
import { SERIES, seriesValue } from './series'

/** Stagger for the draw-on, ms — total leads, tiers follow. */
const DRAW_DELAY: Record<SeriesId, number> = { total: 650, starter: 850, pro: 1000, ent: 1150 }
const DRAW_MS = 1300

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) => (s.w !== width || s.h !== height ? { w: width, h: height } : s))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/** A tick step that lands on clean numbers (1/2/2.5/5 × 10^k). */
function niceStep(rough: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const unit = rough / pow
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10
  return nice * pow
}

/**
 * The revenue trend, hand-rolled: pixel-space scales computed from the
 * container (ResizeObserver), straight 2px segments with round joins, a
 * gradient wash + blurred glow echo under the total line only, and the
 * dash-offset draw-on choreographed after the tiles cascade in.
 */
export function Chart({ months }: { months: MonthRow[] }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const [drawn, setDrawn] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  const endedRef = useRef(0)
  const hideRef = useRef<number | null>(null)

  // Reduced motion never fires animationend, so the hover layer must not
  // wait for the draw there.
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const ready = drawn || reduced

  useEffect(() => () => {
    if (hideRef.current) clearTimeout(hideRef.current)
  }, [])

  const showEndLabels = w >= 560
  const M = { top: 12, right: showEndLabels ? 92 : 14, bottom: 26, left: 46 }

  const geo = useMemo(() => {
    if (w === 0 || h === 0) return null
    const max = Math.max(...months.map((m) => m.mrr)) * 1.06
    const step = niceStep(max / 4.5)
    const ticks: number[] = []
    for (let v = 0; v <= max; v += step) ticks.push(v)

    const x = (i: number) => M.left + (i / (months.length - 1)) * (w - M.left - M.right)
    const y = (v: number) => M.top + (1 - v / max) * (h - M.top - M.bottom)
    const linePath = (id: SeriesId) =>
      months.map((m, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(2)} ${y(seriesValue(id, m)).toFixed(2)}`).join(' ')

    const baseline = y(0)
    const areaPath = `${linePath('total')} L ${x(months.length - 1).toFixed(2)} ${baseline} L ${x(0).toFixed(2)} ${baseline} Z`
    const everyOther = w < 640
    return { max, ticks, x, y, linePath, areaPath, baseline, everyOther }
  }, [months, w, h, M.left, M.right])

  /** Snap the pointer to the nearest month — aim at a date, not a 2px line. */
  const snap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ready) return
    if (hideRef.current) {
      clearTimeout(hideRef.current)
      hideRef.current = null
    }
    const bounds = e.currentTarget.getBoundingClientRect()
    const stepW = (w - M.left - M.right) / (months.length - 1)
    const i = Math.round((e.clientX - bounds.left - M.left) / stepW)
    setHovered(Math.max(0, Math.min(months.length - 1, i)))
  }

  const label = useMemo(() => {
    const first = months[0]
    const last = months[months.length - 1]
    return `Monthly recurring revenue, ${fmtMonth(first.label)} to ${fmtMonth(last.label)}: total grows from ${fmtCompact(first.mrr)} to ${fmtCompact(last.mrr)}, split by Starter, Professional and Enterprise tiers.`
  }, [months])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5 text-xs text-aero-ink-2">
            <span aria-hidden="true" className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
      <div
        ref={ref}
        className="relative mt-3 min-h-64 flex-1 rounded-md"
        tabIndex={0}
        aria-label={`${label} Interactive: left and right arrows move between months, Escape dismisses.`}
        onKeyDown={(e) => {
          if (!ready || !geo) return
          const lastIdx = months.length - 1
          let next: number | null = null
          if (e.key === 'ArrowLeft') next = hovered === null ? lastIdx : Math.max(0, hovered - 1)
          else if (e.key === 'ArrowRight') next = hovered === null ? 0 : Math.min(lastIdx, hovered + 1)
          else if (e.key === 'Home') next = 0
          else if (e.key === 'End') next = lastIdx
          else if (e.key === 'Escape') {
            setHovered(null)
            return
          } else return
          e.preventDefault()
          setHovered(next)
        }}
        onBlur={() => setHovered(null)}
      >
        {geo && (
          <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label={label}
            onPointerMove={snap}
            onPointerDown={snap}
            onPointerLeave={() => {
              // A beat of grace so the tooltip doesn't flicker at the edges.
              hideRef.current = window.setTimeout(() => setHovered(null), 90)
            }}
          >
            <defs>
              <linearGradient id="aero-total-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--color-aero-total)', stopOpacity: 0.14 }} />
                <stop offset="1" style={{ stopColor: 'var(--color-aero-total)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>

            {/* Grid — solid hairlines, one step off the surface, recessive. */}
            {geo.ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={w - M.right} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--color-aero-grid)" strokeWidth="1" />
                <text x={M.left - 8} y={geo.y(t) + 3.5} textAnchor="end" className="fill-aero-muted font-mono text-[10px] tabular-nums">
                  {t === 0 ? '$0' : fmtCompact(t)}
                </text>
              </g>
            ))}
            {months.map((m, i) =>
              geo.everyOther && i % 2 === 1 ? null : (
                <text key={m.label} x={geo.x(i)} y={h - 8} textAnchor="middle" className="fill-aero-muted font-mono text-[10px]">
                  {m.label.split(' ')[0]}
                </text>
              ),
            )}

            {/* Wash + glow live under everything and wipe in with the total line. */}
            <g className={drawn ? undefined : 'aero-wipe'} style={{ '--dd': `${DRAW_DELAY.total}ms` } as CSSProperties}>
              <path d={geo.areaPath} fill="url(#aero-total-fill)" />
              <path d={geo.linePath('total')} fill="none" stroke="var(--color-aero-total)" strokeWidth="7" className="aero-glow" />
            </g>

            <g
              onAnimationEnd={(e) => {
                if (e.animationName !== 'aero-draw') return
                endedRef.current += 1
                if (endedRef.current >= SERIES.length) setDrawn(true)
              }}
            >
              {[...SERIES].reverse().map((s) => (
                <path
                  key={s.id}
                  d={geo.linePath(s.id)}
                  pathLength={1}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.id === 'total' ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={drawn ? undefined : 'aero-draw'}
                  style={{ '--dd': `${DRAW_DELAY[s.id]}ms` } as CSSProperties}
                />
              ))}
            </g>

            {/* End dots (2px surface ring) + selective direct labels. */}
            {SERIES.map((s) => {
              const last = months[months.length - 1]
              const ex = geo.x(months.length - 1)
              const ey = geo.y(seriesValue(s.id, last))
              return (
                <g
                  key={s.id}
                  className={drawn ? undefined : 'aero-fade'}
                  style={{ '--dd': `${DRAW_DELAY[s.id] + DRAW_MS - 150}ms` } as CSSProperties}
                >
                  <circle cx={ex} cy={ey} r="4" fill={s.color} stroke="var(--color-aero-card)" strokeWidth="2" />
                  {showEndLabels && (
                    <>
                      <text x={ex + 10} y={ey + 3.5} className="fill-aero-ink-2 text-[11px] font-medium">
                        {s.id === 'total' ? 'Total' : s.name}
                      </text>
                      <text x={ex + 10} y={ey + 16} className="fill-aero-muted font-mono text-[10px] tabular-nums">
                        {fmtCompact(seriesValue(s.id, last))}
                      </text>
                    </>
                  )}
                </g>
              )
            })}

            {ready && hovered !== null && (
              <HoverMarks months={months} hovered={hovered} x={geo.x} y={geo.y} top={M.top} bottom={h - M.bottom} />
            )}
          </svg>
        )}

        {geo && ready && hovered !== null && (
          <ChartTooltip
            months={months}
            hovered={hovered}
            px={geo.x(hovered)}
            py={geo.y(seriesValue('total', months[hovered]))}
            w={w}
            h={h}
          />
        )}

        <div aria-live="polite" className="sr-only">
          {hovered !== null &&
            `${fmtMonth(months[hovered].label)}: total ${fmtCompact(seriesValue('total', months[hovered]))}`}
        </div>
      </div>

      <ChartTable months={months} />
    </div>
  )
}
