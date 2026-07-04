import { useEffect, useMemo, useRef } from 'react'
import { addTask } from '../../lib/ticker'
import { CASE } from './generate'
import { LayoutEngine, WORLD } from './layout'
import { REL_META, TYPE_COLOR, THREAD } from './schema'
import { PATHS } from './icons'
import type { Derived } from './model'
import type { Action } from './model'

/* The link chart. Edges + nodes render declaratively (selection/dim styling is
   data-driven), but positions are written imperatively every frame via element
   refs, so ~50 nodes × ~132 edges never trigger a React re-render mid-
   simulation. One addTask task owns the paint loop; it stops when the sim cools
   and is re-armed by ensureRunning() on interaction. Pan/zoom live in a
   ref-backed viewport <g>. Node glyphs reuse PATHS from icons.tsx — one copy. */

type Props = {
  engine: LayoutEngine
  derived: Derived
  selected: string[]
  selectedRel: string | null
  hover: string | null
  reduceMotion: boolean
  dispatch: (a: Action) => void
}

type View = { x: number; y: number; k: number }

export function Graph({ engine, derived, selected, selectedRel, hover, reduceMotion, dispatch }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewportRef = useRef<SVGGElement | null>(null)
  const nodeEls = useRef(new Map<string, SVGGElement>())
  const edgeEls = useRef(new Map<string, SVGLineElement>())
  const view = useRef<View>({ x: 0, y: 0, k: 1 })
  const running = useRef(false)
  const unsub = useRef<(() => void) | null>(null)
  const drag = useRef<{ id: string; moved: boolean } | null>(null)
  const pan = useRef<{ x: number; y: number } | null>(null)
  const justPanned = useRef(false)

  const selSet = useMemo(() => new Set(selected), [selected])

  // --- imperative paint (positions only; styling is React below) ---
  const applyView = () => {
    const g = viewportRef.current
    if (g) g.setAttribute('transform', `translate(${view.current.x} ${view.current.y}) scale(${view.current.k})`)
  }
  const paint = () => {
    for (const r of CASE.rels) {
      const el = edgeEls.current.get(r.id)
      if (!el) continue
      const a = engine.node(r.source)
      const b = engine.node(r.target)
      if (!a || !b) continue
      el.setAttribute('x1', String(a.x)); el.setAttribute('y1', String(a.y))
      el.setAttribute('x2', String(b.x)); el.setAttribute('y2', String(b.y))
    }
    for (const e of CASE.entities) {
      const el = nodeEls.current.get(e.id)
      if (!el) continue
      const n = engine.node(e.id)
      if (n) el.setAttribute('transform', `translate(${n.x} ${n.y})`)
    }
  }

  const ensureRunning = () => {
    if (running.current) return
    running.current = true
    unsub.current = addTask(() => {
      const hot = drag.current ? true : engine.step()
      paint()
      if (!hot) { running.current = false; unsub.current = null; return true }
      return false
    })
  }

  // Boot the simulation once.
  useEffect(() => {
    if (reduceMotion) {
      engine.settle()  // synchronous pre-settle; no animation
      paint()
      applyView()
      return
    }
    engine.reheat()
    applyView()
    ensureRunning()
    return () => { unsub.current?.(); running.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reheat ONLY when the active topology changes (timeline scrub / location
  // filter) — those move which edges pull. Keyed on the active counts, NOT the
  // whole `derived` object: hovering or selecting a node mints a fresh `derived`
  // reference every render, and keying on it would reheat the sim on every
  // mouse-move, so the graph would jiggle continuously while you explore. The
  // counts change only on a real window/filter change, which is exactly when a
  // relax is wanted.
  useEffect(() => {
    if (reduceMotion) return
    engine.reheat(0.35)
    ensureRunning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived.activeNodeCount, derived.activeRelCount])

  // --- coordinate helpers ---
  // Client → viewBox units via the SVG's own screen matrix. Mapping across the
  // element rect would be wrong whenever the pane's aspect ≠ 960:660 —
  // preserveAspectRatio letterboxes, so the naive math teleports pinned nodes
  // away from the cursor (and the trailing click then hits bare background and
  // clears the selection you just made).
  const svgPt = (clientX: number, clientY: number) => {
    const svg = svgRef.current!
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const inv = ctm.inverse()
    return { x: inv.a * clientX + inv.c * clientY + inv.e, y: inv.b * clientX + inv.d * clientY + inv.f }
  }
  const toWorld = (clientX: number, clientY: number) => {
    const p = svgPt(clientX, clientY)
    return { x: (p.x - view.current.x) / view.current.k, y: (p.y - view.current.y) / view.current.k }
  }

  // --- pointer: node drag OR background pan ---
  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element
    const nodeG = target.closest('[data-node-id]') as SVGGElement | null
    ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
    if (nodeG) {
      const id = nodeG.getAttribute('data-node-id')!
      drag.current = { id, moved: false }
      const w = toWorld(e.clientX, e.clientY)
      engine.pin(id, w.x, w.y)
      svgRef.current?.classList.add('skein-dragging')
      // Under reduced motion the rAF loop is never started; onPointerMove paints
      // the dragged node directly. Starting the loop here would run a live settle
      // on release — exactly what reduced motion should avoid.
      if (!reduceMotion) ensureRunning()
    } else {
      pan.current = { x: e.clientX, y: e.clientY }
      justPanned.current = false
      svgRef.current?.classList.add('skein-panning')
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const w = toWorld(e.clientX, e.clientY)
      engine.moveTo(drag.current.id, w.x, w.y)
      engine.pin(drag.current.id, w.x, w.y)
      drag.current.moved = true
      if (reduceMotion) paint()
    } else if (pan.current) {
      const a = svgPt(pan.current.x, pan.current.y)
      const b = svgPt(e.clientX, e.clientY)
      view.current.x += b.x - a.x
      view.current.y += b.y - a.y
      if (Math.abs(e.clientX - pan.current.x) + Math.abs(e.clientY - pan.current.y) > 3) justPanned.current = true
      pan.current = { x: e.clientX, y: e.clientY }
      applyView()
    }
  }
  // All click semantics live HERE, not in per-element onClick handlers:
  // setPointerCapture retargets pointerup to the svg, so the browser computes
  // the composed `click`'s target as the svg itself — a per-element onClick on
  // a node or edge never fires, and an svg-level onClick would misread every
  // node select as a background click and clear it.
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current) {
      const { id, moved } = drag.current
      engine.unpin(id) // let it rejoin the sim; delete this line to keep drags pinned
      if (!moved) dispatch({ t: 'select', id, additive: e.shiftKey })
      drag.current = null
      svgRef.current?.classList.remove('skein-dragging')
    } else if (pan.current) {
      const wasPan = justPanned.current
      pan.current = null
      justPanned.current = false
      svgRef.current?.classList.remove('skein-panning')
      if (!wasPan) {
        // A clean press-release on the background: an edge under the pointer
        // selects that relationship; bare background clears the selection.
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const edge = el?.closest('[data-edge-id]')
        if (edge) dispatch({ t: 'selectRel', id: edge.getAttribute('data-edge-id')! })
        else dispatch({ t: 'clearSelection' })
      }
    }
  }

  // --- wheel zoom about the cursor ---
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const { x: px, y: py } = svgPt(e.clientX, e.clientY)
    const factor = Math.exp(-e.deltaY * 0.0015)
    const k2 = Math.min(3.5, Math.max(0.4, view.current.k * factor))
    // keep the world point under the cursor fixed
    view.current.x = px - ((px - view.current.x) * k2) / view.current.k
    view.current.y = py - ((py - view.current.y) * k2) / view.current.k
    view.current.k = k2
    applyView()
  }

  return (
    <svg
      ref={svgRef}
      data-skein="graph"
      viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
      className="skein-canvas h-full w-full select-none"
      role="img"
      aria-label={`Link chart: ${derived.activeNodeCount} active entities, ${derived.activeRelCount} relationships in the current window. An equivalent keyboard-navigable list is provided.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <g ref={viewportRef}>
        {/* edges */}
        <g>
          {CASE.rels.map((r) => {
            const st = derived.edgeState.get(r.id)!
            const isSel = selectedRel === r.id
            const money = REL_META[r.type].carriesMoney && r.amount
            const stroke = st.hi || isSel ? THREAD : 'var(--color-skein-edge)'
            const width = isSel ? 3 : money ? Math.min(4, 1 + Math.log10(r.amount!) / 2) : 1.4
            return (
              <line
                key={r.id}
                data-edge-id={r.id}
                ref={(el) => { if (el) edgeEls.current.set(r.id, el); else edgeEls.current.delete(r.id) }}
                stroke={stroke}
                strokeWidth={width}
                strokeOpacity={st.dim ? 0.05 : st.hi || isSel ? 0.95 : 0.5}
                style={{ cursor: 'pointer', pointerEvents: st.dim ? 'none' : 'stroke' }}
              />
            )
          })}
        </g>
        {/* nodes */}
        <g>
          {CASE.entities.map((e) => {
            const st = derived.nodeState.get(e.id)!
            const n = engine.node(e.id)
            const deg = n?.degree ?? 1
            const rad = 8 + Math.min(12, Math.sqrt(deg) * 3)
            const color = TYPE_COLOR[e.type]
            const isSel = selSet.has(e.id)
            const isHover = hover === e.id
            return (
              <g
                key={e.id}
                data-node-id={e.id}
                ref={(el) => { if (el) nodeEls.current.set(e.id, el); else nodeEls.current.delete(e.id) }}
                style={{ cursor: 'pointer', opacity: st.dim && !isSel ? 0.16 : 1 }}
                onPointerEnter={() => dispatch({ t: 'hover', id: e.id })}
                onPointerLeave={() => dispatch({ t: 'hover', id: null })}
              >
                {(isSel || st.hi) && (
                  <circle r={rad + 6} fill="none" stroke={THREAD} strokeWidth={isSel ? 2 : 1.25} strokeDasharray={isSel ? undefined : '3 3'} />
                )}
                <circle r={rad} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={isHover ? 2.5 : 1.6} />
                {/* type glyph as a small mark; raw path so nodes don't nest an <svg> */}
                <g transform={`translate(${-rad * 0.5} ${-rad * 0.5}) scale(${(rad * 0.9) / 24})`} stroke={color} fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} pointerEvents="none">
                  <path d={PATHS[e.type]} />
                </g>
                {(isSel || isHover || st.hi) && (
                  <text y={rad + 13} textAnchor="middle" fontSize="11" fill="var(--color-skein-ink)" style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                    {e.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </g>
    </svg>
  )
}
