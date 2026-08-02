import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { loadReliefMeta } from './meta'
import type { ReliefMeta } from './meta'
import type { Observer } from './Scene'
import type { Heightfield } from './heightfield'
import type { ViewshedStats } from './viewshed'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

/** Observer height range, metres. Logarithmic — the interesting changes are
 *  all in the first 50 m, and a linear slider wastes 90% of its travel. */
const H_MIN = 2
const H_MAX = 500
const toHeight = (t: number) => H_MIN * Math.pow(H_MAX / H_MIN, t)
const fromHeight = (h: number) => Math.log(h / H_MIN) / Math.log(H_MAX / H_MIN)

/**
 * Seed position for the observer.
 *
 * Chosen by `VS_SEARCH=1 node scripts/check-viewshed.mjs`, which scores
 * candidates by the area they actually see. Seeding the *highest* ground is a
 * trap: the 2,638 m high point mid-frame is ringed by higher plateau to the
 * north and sees only 2.7% of the map. This point is 372 m lower but sits on
 * the rim looking out over the gorge, and sees 12.4%.
 */
const SEED = { u: 0.3, v: 0.5 }

const HEIGHT_STOPS = [
  { h: 2, label: 'eye level' },
  { h: 25, label: 'watchtower' },
  { h: 120, label: 'small UAS' },
  { h: 400, label: '400 m' },
]

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** A render error in the 3D tree lands on the static fallback, not a crash. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}

/** Wordmark — contour lines with a sight line crossing them. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M2 14 Q6 9 10 11 T18 8" fill="none" stroke="var(--color-relief-rock)" strokeWidth="1.2" />
      <path d="M2 17 Q6 12.5 10 14.5 T18 11.5" fill="none" stroke="var(--color-relief-rock)" strokeWidth="1.2" />
      <line x1="3" y1="4" x2="17" y2="16" stroke="var(--color-relief-visible)" strokeWidth="1.2" strokeDasharray="2 2" />
      <circle cx="3" cy="4" r="1.8" fill="var(--color-relief-visible)" />
    </svg>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="relief-label">{label}</span>
      <span className="relief-num text-relief-ink">
        {value}
        {unit && <span className="ml-1 text-relief-muted">{unit}</span>}
      </span>
    </div>
  )
}

export default function Relief() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [meta, setMeta] = useState<ReliefMeta | null>(null)
  const [metaFailed, setMetaFailed] = useState(false)

  const [observer, setObserver] = useState<Observer | null>(null)
  const [height, setHeight] = useState(25)
  const [refraction, setRefraction] = useState(true)
  const [stats, setStats] = useState<ViewshedStats | null>(null)

  const radius = useMemo(
    () => (meta ? Math.hypot(meta.widthM, meta.heightM) : 60000),
    [meta],
  )

  useEffect(() => {
    document.title = 'Relief — a Grand Canyon viewshed · Sean Joudrie'
    document.body.classList.add('relief-page')
    return () => document.body.classList.remove('relief-page')
  }, [])

  useEffect(() => {
    let cancelled = false
    loadReliefMeta()
      .then((m) => !cancelled && setMeta(m))
      .catch(() => !cancelled && setMetaFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  /** Seed the observer so the page shows a real result before anything is
   *  touched. See SEED above for how the position was chosen. */
  const handleReady = useCallback((field: Heightfield) => {
    setObserver({ u: SEED.u, v: SEED.v, ground: field.elevAt(SEED.u, SEED.v), height: 25 })
  }, [])

  const move = useCallback(
    (du: number, dv: number) =>
      setObserver((o) =>
        o ? { ...o, u: Math.min(Math.max(o.u + du, 0), 1), v: Math.min(Math.max(o.v + dv, 0), 1) } : o,
      ),
    [],
  )

  // Keyboard: arrows nudge the observer, +/- adjust height.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT') return
      const s = e.shiftKey ? 0.02 : 0.005
      if (e.key === 'ArrowLeft') move(-s, 0)
      else if (e.key === 'ArrowRight') move(s, 0)
      else if (e.key === 'ArrowUp') move(0, s)
      else if (e.key === 'ArrowDown') move(0, -s)
      else if (e.key === '+' || e.key === '=') setHeight((h) => Math.min(h * 1.3, H_MAX))
      else if (e.key === '-' || e.key === '_') setHeight((h) => Math.max(h / 1.3, H_MIN))
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  // Height lives in its own state so the slider stays responsive; fold it into
  // the observer whenever it changes.
  useEffect(() => {
    setObserver((o) => (o && o.height !== height ? { ...o, height } : o))
  }, [height])

  const broken = !glOk || lost || metaFailed

  return (
    <div className="relief-root flex min-h-svh flex-col bg-relief-bg text-relief-ink">
      <header className="z-10 flex items-center justify-between gap-4 border-b border-relief-line px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="font-semibold tracking-tight">Relief</span>
          <span className="relief-label hidden sm:inline">Grand Canyon · viewshed</span>
        </div>
        <button
          onClick={() => navigate('#/')}
          className="rounded-lg border border-relief-line px-3 py-1.5 text-sm font-medium text-relief-ink-2 transition-colors hover:border-relief-line-strong hover:text-relief-ink"
        >
          ← Portfolio
        </button>
      </header>

      <main className="relative flex flex-1 flex-col">
        {broken ? (
          <Fallback />
        ) : (
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="grid flex-1 place-items-center">
                  <span className="relief-label">loading terrain…</span>
                </div>
              }
            >
              {meta ? (
                <>
                  <div className="absolute inset-0">
                    <Scene
                      meta={meta}
                      observer={observer}
                      setObserver={setObserver}
                      radius={radius}
                      refraction={refraction}
                      onStats={setStats}
                      onReady={handleReady}
                      onFail={() => setLost(true)}
                    />
                  </div>

                  {/* Control panel — a side card on desktop, a bottom sheet on
                      phones so it never covers the terrain it describes. */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:inset-auto sm:left-4 sm:top-4 sm:w-72 sm:p-0">
                    <div className="pointer-events-auto rounded-xl border border-relief-line bg-relief-card/92 p-4 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <span className="relief-label">Observer</span>
                        <button
                          onClick={() => {
                            setHeight(25)
                            setRefraction(true)
                          }}
                          className="text-xs font-medium text-relief-muted underline decoration-relief-line underline-offset-4 hover:text-relief-ink"
                        >
                          Reset
                        </button>
                      </div>

                      <label className="mt-4 block">
                        <span className="flex items-baseline justify-between">
                          <span className="text-sm text-relief-ink-2">Height above ground</span>
                          <span className="relief-num text-sm text-relief-visible">
                            {height < 10 ? height.toFixed(1) : Math.round(height)} m
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.001}
                          value={fromHeight(height)}
                          onChange={(e) => setHeight(toHeight(Number(e.target.value)))}
                          className="mt-2 w-full accent-[var(--color-relief-visible)]"
                          aria-label="Observer height above ground, metres"
                        />
                        <span className="mt-1 flex justify-between text-[0.62rem] text-relief-muted">
                          {HEIGHT_STOPS.map((s) => (
                            <button
                              key={s.h}
                              onClick={() => setHeight(s.h)}
                              className="hover:text-relief-ink"
                              title={`${s.h} m`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </span>
                      </label>

                      <label className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm text-relief-ink-2">
                          Refraction correction
                          <span className="ml-1 text-relief-muted">(k = 0.13)</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={refraction}
                          onChange={(e) => setRefraction(e.target.checked)}
                          className="h-4 w-4 accent-[var(--color-relief-visible)]"
                        />
                      </label>

                      <div className="mt-4 space-y-1.5 border-t border-relief-line pt-3">
                        {observer && (
                          <Stat label="Ground elev." value={Math.round(observer.ground).toLocaleString()} unit="m" />
                        )}
                        {stats && (
                          <>
                            <Stat label="Visible area" value={stats.visibleKm2.toFixed(1)} unit="km²" />
                            <Stat
                              label="Of frame"
                              value={(stats.visibleFraction * 100).toFixed(1)}
                              unit="%"
                            />
                            <Stat label="Furthest" value={stats.furthestKm.toFixed(1)} unit="km" />
                          </>
                        )}
                      </div>

                      <p className="mt-3 text-[0.68rem] leading-relaxed text-relief-muted">
                        Click the terrain to move the observer, or drag the marker. Drag
                        elsewhere to orbit, scroll to zoom. Arrow keys nudge; +/− change height.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid flex-1 place-items-center">
                  <span className="relief-label">loading terrain…</span>
                </div>
              )}
            </Suspense>
          </SceneBoundary>
        )}
      </main>

      <footer className="z-10 border-t border-relief-line px-4 py-3 text-xs leading-relaxed text-relief-muted sm:px-6">
        <p>
          <span className="text-relief-ink-2">Method.</span> A viewshed marks every cell whose
          vertical angle from the observer exceeds the maximum angle of all ground between them
          — computed here as a GPU reference-angle pass, corrected for Earth curvature
          (d²/2R) and atmospheric refraction. This is a bare-earth surface model: vegetation,
          structures and haze are not accounted for.
        </p>
        <p className="mt-1.5">
          Elevation data: Copernicus GLO-30 DEM, © European Space Agency / Copernicus
          Programme, accessed via the AWS open-data mirror. Terrain rendering and the viewshed
          algorithm are original.
        </p>
      </footer>
    </div>
  )
}
