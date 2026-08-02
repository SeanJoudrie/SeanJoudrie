import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { loadReliefMeta } from './meta'
import type { ReliefMeta } from './meta'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

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

/** Wordmark — three contour lines with a sight line crossing them. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M2 14 Q6 9 10 11 T18 8" fill="none" stroke="var(--color-relief-rock)" strokeWidth="1.2" />
      <path d="M2 17 Q6 12.5 10 14.5 T18 11.5" fill="none" stroke="var(--color-relief-rock)" strokeWidth="1.2" />
      <path d="M4 10.5 Q7.5 6.5 10.5 8 T17 5" fill="none" stroke="var(--color-relief-line-strong)" strokeWidth="1" />
      <line x1="3" y1="4" x2="17" y2="16" stroke="var(--color-relief-visible)" strokeWidth="1.2" strokeDasharray="2 2" />
      <circle cx="3" cy="4" r="1.8" fill="var(--color-relief-visible)" />
    </svg>
  )
}

export default function Relief() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [meta, setMeta] = useState<ReliefMeta | null>(null)
  const [metaFailed, setMetaFailed] = useState(false)

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

  const broken = !glOk || lost || metaFailed

  return (
    <div className="relief-root flex min-h-svh flex-col bg-relief-bg text-relief-ink">
      <header className="flex items-center justify-between gap-4 border-b border-relief-line px-4 py-3 sm:px-6">
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
                <div className="absolute inset-0">
                  <Scene meta={meta} onFail={() => setLost(true)} />
                </div>
              ) : (
                <div className="grid flex-1 place-items-center">
                  <span className="relief-label">loading terrain…</span>
                </div>
              )}
            </Suspense>
          </SceneBoundary>
        )}
      </main>

      <footer className="border-t border-relief-line px-4 py-3 text-xs leading-relaxed text-relief-muted sm:px-6">
        Elevation data: Copernicus GLO-30 DEM, © European Space Agency / Copernicus
        Programme, accessed via the AWS open-data mirror. Terrain rendering and the
        viewshed algorithm are original.
      </footer>
    </div>
  )
}
