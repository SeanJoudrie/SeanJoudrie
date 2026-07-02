import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { MonthRow, TierId } from './data'
import { ChartTable, ChartTooltip, HoverMarks } from './ChartHover'
import { exportChartPng } from './exportPng'
import { fmtCompact, fmtMonth } from './format'
import type { SeriesId } from './series'
import { SERIES, visValue } from './series'
import { addTask, easeOutCubic } from './useSharedTicker'

/** Fixed resample count — every timeframe renders as the same number of
    points, so morphs are a plain element-wise tween, Safari included. */
const SAMPLES = 48
const MORPH_MS = 550

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

/** Linear resample of a value series onto n evenly spaced points. */
function resample(vals: number[], n: number): number[] {
  if (vals.length === 1) return new Array<number>(n).fill(vals[0])
  const out = new Array<number>(n)
  const L = vals.length - 1
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * L
    const lo = Math.floor(t)
    const hi = Math.min(L, lo + 1)
    out[i] = vals[lo] + (vals[hi] - vals[lo]) * (t - lo)
  }
  return out
}

type Samples = Record<SeriesId, number[]>
type View = { key: string; rows: MonthRow[]; samples: Samples; max: number }

/**
 * The revenue trend, hand-rolled. React owns the committed view (axes,
 * labels, final paths); timeframe and tier changes tween the resampled
 * series on the page's shared rAF loop, writing `d` straight to the path
 * nodes — no React render ever runs at 60Hz. Axes re-commit when the
 * morph lands.
 */
export function Chart({
  months,
  range,
  active,
  preview,
}: {
  months: MonthRow[]
  range: [number, number]
  active: ReadonlySet<TierId>
  preview: TierId | null
}) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const [drawn, setDrawn] = useState(false)
  const [morphing, setMorphing] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  const endedRef = useRef(0)
  const hideRef = useRef<number | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const pathRefs = useRef<Partial<Record<SeriesId, SVGPathElement | null>>>({})
  const areaRef = useRef<SVGPathElement | null>(null)
  const glowRef = useRef<SVGPathElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Reduced motion never fires animationend, so the hover layer must not
  // wait for the draw there.
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const ready = (drawn || reduced) && !morphing

  useEffect(
    () => () => {
      if (hideRef.current) clearTimeout(hideRef.current)
      cancelRef.current?.()
    },
    [],
  )

  const target: View = useMemo(() => {
    const rows = months.slice(range[0], range[1] + 1)
    const samples = {} as Samples
    for (const s of SERIES) samples[s.id] = resample(rows.map((m) => visValue(s.id, m, active)), SAMPLES)
    const max = Math.max(...samples.total) * 1.06 || 1
    const key = `${range[0]}-${range[1]}-${[...active].sort().join('.')}`
    return { key, rows, samples, max }
  }, [months, range, active])

  const [view, setView] = useState<View>(target)
  const liveRef = useRef<{ samples: Samples; max: number }>({ samples: target.samples, max: target.max })

  const showEndLabels = w >= 560
  const M = { top: 12, right: showEndLabels ? 92 : 14, bottom: 26, left: 46 }

  const geo = useMemo(() => {
    if (w === 0 || h === 0) return null
    const pw = w - M.left - M.right
    const ph = h - M.top - M.bottom
    const xs = (i: number) => M.left + (i / (SAMPLES - 1)) * pw
    const xm = (i: number, count: number) => M.left + (i / (count - 1)) * pw
    const y = (v: number, max = view.max) => M.top + (1 - v / max) * ph
    const line = (samples: number[], max = view.max) =>
      samples.map((v, i) => `${i ? 'L' : 'M'} ${xs(i).toFixed(2)} ${y(v, max).toFixed(2)}`).join(' ')
    const area = (samples: number[], max = view.max) =>
      `${line(samples, max)} L ${xs(SAMPLES - 1).toFixed(2)} ${(h - M.bottom).toFixed(2)} L ${M.left} ${(h - M.bottom).toFixed(2)} Z`
    const step = niceStep(view.max / 4.5)
    const ticks: number[] = []
    for (let v = 0; v <= view.max; v += step) ticks.push(v)
    return { xs, xm, y, line, area, ticks }
  }, [w, h, view, M.left, M.right, M.top, M.bottom])

  /* Morph: tween live samples toward the new target outside React, then
     commit. Interacting also retires the draw-on ceremony. */
  const mountedRef = useRef(false)
  useLayoutEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (target.key === view.key) return
    setDrawn(true)
    setHovered(null)
    if (reduced || !geo) {
      liveRef.current = { samples: target.samples, max: target.max }
      setView(target)
      return
    }
    setMorphing(true)
    cancelRef.current?.()
    const from = { samples: { ...liveRef.current.samples }, max: liveRef.current.max }
    const t0 = performance.now()
    cancelRef.current = addTask((now) => {
      const p = Math.min(1, (now - t0) / MORPH_MS)
      const k = easeOutCubic(p)
      const max = from.max + (target.max - from.max) * k
      const cur = {} as Samples
      for (const s of SERIES) {
        const a = from.samples[s.id]
        const b = target.samples[s.id]
        cur[s.id] = a.map((v, i) => v + (b[i] - v) * k)
      }
      liveRef.current = { samples: cur, max }
      for (const s of SERIES) pathRefs.current[s.id]?.setAttribute('d', geo.line(cur[s.id], max))
      areaRef.current?.setAttribute('d', geo.area(cur.total, max))
      glowRef.current?.setAttribute('d', geo.line(cur.total, max))
      if (p >= 1) {
        setView(target)
        setMorphing(false)
        return true
      }
      return false
    })
  }, [target.key])

  /** Snap the pointer to the nearest month — aim at a date, not a 2px line. */
  const snap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ready) return
    if (hideRef.current) {
      clearTimeout(hideRef.current)
      hideRef.current = null
    }
    const bounds = e.currentTarget.getBoundingClientRect()
    const stepW = (w - M.left - M.right) / (view.rows.length - 1)
    const i = Math.round((e.clientX - bounds.left - M.left) / stepW)
    setHovered(Math.max(0, Math.min(view.rows.length - 1, i)))
  }

  const label = useMemo(() => {
    const first = view.rows[0]
    const last = view.rows[view.rows.length - 1]
    return `Monthly recurring revenue, ${fmtMonth(first.label)} to ${fmtMonth(last.label)}: total grows from ${fmtCompact(visValue('total', first, active))} to ${fmtCompact(visValue('total', last, active))}, split by Starter, Professional and Enterprise tiers.`
  }, [view, active])

  const tierOpacity = (id: SeriesId) =>
    id === 'total' ? 1 : !active.has(id) ? 0 : preview && preview !== id ? 0.25 : 1

  const everyOther = w < 640 && view.rows.length > 6

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {SERIES.map((s) => (
            <li
              key={s.id}
              className={`flex items-center gap-1.5 text-xs text-aero-ink-2 transition-opacity ${
                s.id !== 'total' && !active.has(s.id) ? 'opacity-40' : ''
              }`}
            >
              <span aria-hidden="true" className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            if (svgRef.current) void exportChartPng(svgRef.current, 'aeroscale-revenue.png')
          }}
          className="ml-auto font-mono text-[11px] text-aero-muted transition-colors hover:text-aero-ink"
        >
          Export PNG ↓
        </button>
      </div>
      <div
        ref={ref}
        className="relative mt-3 min-h-64 flex-1 rounded-md"
        tabIndex={0}
        aria-label={`${label} Interactive: left and right arrows move between months, Escape dismisses.`}
        onKeyDown={(e) => {
          if (!ready || !geo) return
          const lastIdx = view.rows.length - 1
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
            ref={svgRef}
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

            {/* Grid — solid hairlines, one step off the surface, recessive.
                Keyed on the view so a morph commit fades the new scale in. */}
            <g key={view.key} className="aero-fade">
              {geo.ticks.map((t) => (
                <g key={t}>
                  <line x1={M.left} x2={w - M.right} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--color-aero-grid)" strokeWidth="1" />
                  <text x={M.left - 8} y={geo.y(t) + 3.5} textAnchor="end" className="fill-aero-muted font-mono text-[10px] tabular-nums">
                    {t === 0 ? '$0' : fmtCompact(t)}
                  </text>
                </g>
              ))}
              {view.rows.map((m, i) =>
                everyOther && i % 2 === 1 ? null : (
                  <text
                    key={m.label}
                    x={geo.xm(i, view.rows.length)}
                    y={h - 8}
                    textAnchor="middle"
                    className="fill-aero-muted font-mono text-[10px]"
                  >
                    {m.label.split(' ')[0]}
                  </text>
                ),
              )}
            </g>

            {/* Wash + glow live under everything and wipe in with the total line. */}
            <g className={drawn ? undefined : 'aero-wipe'} style={{ '--dd': `${DRAW_DELAY.total}ms` } as CSSProperties}>
              <path ref={areaRef} d={geo.area(view.samples.total)} fill="url(#aero-total-fill)" />
              <path
                ref={glowRef}
                d={geo.line(view.samples.total)}
                fill="none"
                stroke="var(--color-aero-total)"
                strokeWidth="7"
                className="aero-glow"
              />
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
                  ref={(el) => {
                    pathRefs.current[s.id] = el
                  }}
                  d={geo.line(view.samples[s.id])}
                  pathLength={1}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.id === 'total' ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={drawn ? undefined : 'aero-draw'}
                  style={
                    {
                      '--dd': `${DRAW_DELAY[s.id]}ms`,
                      opacity: tierOpacity(s.id),
                      transition: 'opacity 450ms var(--ease-out)',
                    } as CSSProperties
                  }
                />
              ))}
            </g>

            {/* End dots (2px surface ring) + selective direct labels — hidden
                while a morph is in flight, back when it lands. */}
            <g className={`transition-opacity duration-200 ${morphing ? 'opacity-0' : 'opacity-100'}`}>
              {SERIES.filter((s) => s.id === 'total' || active.has(s.id)).map((s) => {
                const v = view.samples[s.id][SAMPLES - 1]
                const ex = geo.xs(SAMPLES - 1)
                const ey = geo.y(v)
                return (
                  <g
                    key={s.id}
                    className={drawn ? undefined : 'aero-fade'}
                    style={{ '--dd': `${DRAW_DELAY[s.id] + DRAW_MS - 150}ms` } as CSSProperties}
                  >
                    <circle cx={ex} cy={ey} r="4" fill={s.color} stroke="var(--color-aero-card)" strokeWidth="2" />
                    {/* A tier sitting at zero (pre-launch) keeps its dot but
                        skips the label — "$0" would collide with the axis. */}
                    {showEndLabels && v >= 0.5 && (
                      <>
                        <text x={ex + 10} y={ey + 3.5} className="fill-aero-ink-2 text-[11px] font-medium">
                          {s.id === 'total' ? 'Total' : s.name}
                        </text>
                        <text x={ex + 10} y={ey + 16} className="fill-aero-muted font-mono text-[10px] tabular-nums">
                          {fmtCompact(v)}
                        </text>
                      </>
                    )}
                  </g>
                )
              })}
            </g>

            {ready && hovered !== null && (
              <HoverMarks
                months={view.rows}
                hovered={hovered}
                active={active}
                x={(i) => geo.xm(i, view.rows.length)}
                y={geo.y}
                top={M.top}
                bottom={h - M.bottom}
              />
            )}
          </svg>
        )}

        {geo && ready && hovered !== null && (
          <ChartTooltip
            months={view.rows}
            hovered={hovered}
            active={active}
            px={geo.xm(hovered, view.rows.length)}
            py={geo.y(visValue('total', view.rows[hovered], active))}
            w={w}
            h={h}
          />
        )}

        <div aria-live="polite" className="sr-only">
          {hovered !== null &&
            `${fmtMonth(view.rows[hovered].label)}: total ${fmtCompact(visValue('total', view.rows[hovered], active))}`}
        </div>
      </div>

      <ChartTable months={months} />
    </div>
  )
}
