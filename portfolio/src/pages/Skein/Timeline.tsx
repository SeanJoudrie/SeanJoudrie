import { useEffect, useMemo, useRef } from 'react'
import { CASE } from './generate'
import { DAY, ms, iso, fmtDate } from './schema'
import type { Action, SkeinState } from './model'

/* The headline interaction: a weekly event-density histogram behind a
   draggable two-handle brush, plus quick-range chips. Brush moves are
   frame-coalesced — the latest pointer value is kept in a ref and flushed at
   most once per rAF (spec §17.1), so a fast scrub re-derives the graph + map
   once per frame, never per pointer event. Pointer math only — no animation,
   so it is inherently reduced-motion safe. */

type Props = { state: SkeinState; dispatch: (a: Action) => void }

const VB_W = 1000
const VB_H = 96
const PAD = 8
const AXIS_Y = 74

export function Timeline({ state, dispatch }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [t0, t1] = state.fullSpan
  const drag = useRef<null | 'start' | 'end' | 'band'>(null)
  const bandGrab = useRef(0)

  // §17.1 — one dispatch per frame while brushing.
  const pending = useRef<[number, number] | null>(null)
  const rafId = useRef(0)
  const flush = () => {
    rafId.current = 0
    if (pending.current) { dispatch({ t: 'window', range: pending.current }); pending.current = null }
  }
  const schedule = (range: [number, number]) => {
    pending.current = range
    if (!rafId.current) rafId.current = requestAnimationFrame(flush)
  }
  useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current) }, [])

  // weekly buckets (histogram)
  const bins = useMemo(() => {
    const WEEK = 7 * DAY
    const count = Math.max(1, Math.ceil((t1 - t0) / WEEK))
    const arr = new Array(count).fill(0)
    for (const r of CASE.rels) {
      const i = Math.min(count - 1, Math.floor((ms(r.date) - t0) / WEEK))
      arr[i]++
    }
    const max = Math.max(1, ...arr)
    return { arr, max, count }
  }, [t0, t1])

  const xOf = (t: number) => PAD + ((t - t0) / (t1 - t0)) * (VB_W - PAD * 2)
  const tOf = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * VB_W
    const frac = (px - PAD) / (VB_W - PAD * 2)
    return Math.max(t0, Math.min(t1, t0 + frac * (t1 - t0)))
  }

  const [ws, we] = state.window
  const xs = xOf(ws)
  const xe = xOf(we)

  const onDown = (which: 'start' | 'end' | 'band') => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    drag.current = which
    if (which === 'band') bandGrab.current = tOf(e.clientX) - ws
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const t = tOf(e.clientX)
    if (drag.current === 'start') schedule([Math.min(t, we - DAY), we])
    else if (drag.current === 'end') schedule([ws, Math.max(t, ws + DAY)])
    else {
      const span = we - ws
      let ns = t - bandGrab.current
      ns = Math.max(t0, Math.min(t1 - span, ns))
      schedule([ns, ns + span])
    }
  }
  const onUp = () => {
    if (drag.current) {
      // flush any pending frame so the announced range matches what's applied
      if (rafId.current) { cancelAnimationFrame(rafId.current); flush() }
      dispatch({ t: 'announce', msg: `Window ${fmtDate(iso(ws))} to ${fmtDate(iso(we))}` })
      drag.current = null
    }
  }

  // quick ranges: full + three waves (see generate WAVES) — discrete changes,
  // dispatched directly (no coalescing needed).
  const span = t1 - t0
  const chip = (label: string, a: number, b: number) => (
    <button
      key={label}
      onClick={() => dispatch({ t: 'window', range: [t0 + span * a, t0 + span * b] })}
      className="skein-num rounded-md border border-skein-line px-2.5 py-1 text-xs text-skein-ink-2 hover:border-skein-thread hover:text-skein-ink"
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-xl border border-skein-line bg-skein-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="skein-label">Timeline · scrub to filter</span>
        <span className="skein-num text-xs text-skein-ink-2">
          {fmtDate(iso(ws))} — {fmtDate(iso(we))}
        </span>
      </div>
      <svg
        ref={svgRef}
        data-skein="timeline"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-24 w-full touch-none"
        role="group"
        aria-label="Time range brush over event density. Drag the handles or the window band to filter every view."
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* histogram */}
        <g>
          {bins.arr.map((c, i) => {
            const bx = PAD + (i / bins.count) * (VB_W - PAD * 2)
            const bw = (VB_W - PAD * 2) / bins.count
            const bh = (c / bins.max) * (AXIS_Y - 12)
            const binT = t0 + (i + 0.5) * 7 * DAY
            const inWin = binT >= ws && binT <= we
            return <rect key={i} x={bx + 0.5} y={AXIS_Y - bh} width={Math.max(1, bw - 1)} height={bh} fill={inWin ? 'var(--color-skein-thread)' : 'var(--color-skein-muted)'} fillOpacity={inWin ? 0.7 : 0.35} rx="1" />
          })}
        </g>
        {/* axis */}
        <line x1={PAD} y1={AXIS_Y} x2={VB_W - PAD} y2={AXIS_Y} stroke="var(--color-skein-line)" />
        {/* selection band */}
        <rect x={xs} y={4} width={Math.max(2, xe - xs)} height={AXIS_Y - 4} fill="var(--color-skein-sel)" stroke="var(--color-skein-thread)" strokeOpacity="0.6"
          style={{ cursor: 'grab' }} onPointerDown={onDown('band')} />
        {/* handles */}
        {(['start', 'end'] as const).map((h) => {
          const x = h === 'start' ? xs : xe
          return (
            <g key={h} onPointerDown={onDown(h)} style={{ cursor: 'ew-resize' }}>
              <line x1={x} y1={2} x2={x} y2={AXIS_Y} stroke="var(--color-skein-thread)" strokeWidth="2" />
              <rect x={x - 5} y={AXIS_Y / 2 - 10} width="10" height="20" rx="2" fill="var(--color-skein-thread)" />
              {/* wide invisible hit target */}
              <rect x={x - 10} y={0} width="20" height={AXIS_Y} fill="transparent" />
            </g>
          )
        })}
        {/* end-date ticks */}
        <text x={PAD} y={VB_H - 4} fontSize="11" fill="var(--color-skein-muted)" style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(iso(t0))}</text>
        <text x={VB_W - PAD} y={VB_H - 4} textAnchor="end" fontSize="11" fill="var(--color-skein-muted)" style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(iso(t1))}</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        {chip('Full span', 0, 1)}
        {chip('Wave I', 0.0, 0.3)}
        {chip('Wave II', 0.33, 0.63)}
        {chip('Wave III', 0.68, 1)}
      </div>
    </div>
  )
}
