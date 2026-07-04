import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../lib/router'
import { CASE } from './generate'
import { LayoutEngine } from './layout'
import { reducer, initialState, derive } from './model'
import { Graph } from './Graph'
import { Timeline } from './Timeline'
import { MapPane } from './MapPane'
import { DetailPanel } from './DetailPanel'
import { EntityList } from './EntityList'
import { Legend } from './Legend'
import './theme.css'

const d = (msDelay: number) => ({ '--d': `${msDelay}ms` }) as CSSProperties

/** Wordmark — a coiled thread resolving into a straight line. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M3 15c3 0 3-4 6-4s3 4 6 4" fill="none" stroke="var(--color-skein-thread)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 9c3 0 3-4 6-4s3 4 8 4" fill="none" stroke="var(--color-skein-thread)" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

export default function Skein() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(CASE))
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const engineRef = useRef<LayoutEngine | null>(null)
  if (!engineRef.current) engineRef.current = new LayoutEngine(CASE.entities, CASE.rels)

  // derive() doesn't read `hover`, so memoize on the fields it actually uses.
  // This keeps `derived`'s reference stable across hover — cheaper, and it means
  // hovering never churns the three views (see the Graph reheat note).
  const derived = useMemo(
    () => derive(state, CASE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.window, state.selected, state.selectedRel, state.locationFilter],
  )

  useEffect(() => {
    document.body.classList.add('skein-page')
    const prev = document.title
    document.title = 'Skein — link-analysis case board'
    // Focus the entity filter (the graph's keyboard equivalent) so the very
    // first Tab lands inside the tool. Focus is not motion — always do it.
    requestAnimationFrame(() => document.getElementById('skein-filter')?.focus())
    return () => { document.body.classList.remove('skein-page'); document.title = prev }
  }, [])

  // Every window/filter change speaks a live count (kept out of the reducer so
  // it stays pure).
  useEffect(() => {
    dispatch({ t: 'announce', msg: `${derived.activeNodeCount} entities, ${derived.activeRelCount} links in view` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived.activeNodeCount, derived.activeRelCount])

  return (
    <div className="skein-root flex min-h-svh flex-col bg-skein-bg text-skein-ink">
      <header className="sticky top-0 z-20 border-b border-skein-line bg-skein-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <button onClick={() => navigate('#range')} className="skein-in font-mono text-xs tracking-wide text-skein-muted transition-colors hover:text-skein-ink" style={d(0)}>
            ← Portfolio
          </button>
          <span aria-hidden className="h-4 w-px bg-skein-line" />
          <div className="skein-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Skein</span>
            <span className="rounded-full border border-skein-thread/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-skein-thread">Demo</span>
            <span className="hidden text-xs text-skein-muted sm:inline">· {CASE.name}</span>
          </div>
          <span className="skein-in ml-auto hidden font-mono text-xs text-skein-muted md:block" style={d(80)}>
            Scrub the timeline and watch the network surface.
          </span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[15rem_1fr_19rem]">
        {/* left rail: entity list (a11y equivalent) + legend. On lg the rail is
            sticky and viewport-height so the 50-row list scrolls INTERNALLY —
            otherwise it would stretch the whole grid row to ~1700px and the
            board would never fit on screen. On mobile the list is capped. */}
        <aside className="skein-in order-2 flex min-h-0 flex-col gap-4 lg:sticky lg:top-[4.5rem] lg:order-1 lg:h-[calc(100svh-6.5rem)]" style={d(120)}>
          <div className="min-h-0 flex-1 max-h-[24rem] lg:max-h-none"><EntityList state={state} derived={derived} dispatch={dispatch} /></div>
          <Legend />
        </aside>

        {/* center: graph + timeline — sized to the viewport on lg so the whole
            board reads as one screen; the graph pane takes what the timeline
            doesn't. */}
        <section className="skein-in order-1 flex min-h-[60vh] flex-col gap-4 lg:order-2 lg:h-[calc(100svh-6.5rem)]" style={d(60)}>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-skein-line bg-skein-card">
            <Graph
              engine={engineRef.current}
              derived={derived}
              selected={state.selected}
              selectedRel={state.selectedRel}
              hover={state.hover}
              reduceMotion={reduceMotion}
              dispatch={dispatch}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex gap-3 rounded-lg border border-skein-line bg-skein-bg/70 px-3 py-1.5 backdrop-blur">
              <span className="skein-num text-xs text-skein-ink-2">{derived.activeNodeCount} entities</span>
              <span className="skein-num text-xs text-skein-ink-2">{derived.activeRelCount} links</span>
            </div>
          </div>
          <Timeline state={state} dispatch={dispatch} />
        </section>

        {/* right rail: map + inspector */}
        <aside className="skein-in order-3 flex flex-col gap-4" style={d(180)}>
          <MapPane state={state} derived={derived} dispatch={dispatch} />
          <DetailPanel state={state} dispatch={dispatch} />
        </aside>
      </main>

      <footer className="border-t border-skein-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="font-mono text-xs text-skein-muted">
            Force-directed link analysis, hand-rolled — no graph library, no map tiles. Synthetic case built for Sean Joudrie's portfolio.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-skein-muted transition-colors hover:text-skein-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>

      {/* screen-reader live region: filter + selection announcements */}
      <div role="status" aria-live="polite" className="sr-only">{state.announce}</div>
    </div>
  )
}
