import { Component, useEffect, useRef, useState } from 'react'
import type { ComponentRef, CSSProperties, ReactNode } from 'react'
import type { CameraControls } from '@react-three/drei'
import { navigate } from '../../lib/router'
import type { PartId, Selection } from './config'
import { bezelOf, caseOf, decodeSelection, dialOf, encodeSelection, strapOf } from './config'
import { Fallback } from './Fallback'
import { Panel } from './Panel'
import Scene from './Scene'
import './theme.css'

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

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** Wordmark — a meridian line through a watch-case circle. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--color-meridian-brass)" strokeWidth="1.6" />
      <path d="M 10 1.5 A 6.5 8.5 0 0 0 10 18.5 A 6.5 8.5 0 0 0 10 1.5" fill="none" stroke="var(--color-meridian-brass)" strokeWidth="0.9" opacity="0.7" />
    </svg>
  )
}

export default function MeridianConfigurator() {
  const [selection, setSelection] = useState<Selection>(() => decodeSelection(window.location.hash))
  const controlsRef = useRef<ComponentRef<typeof CameraControls>>(null)
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)

  // The build is shareable: non-default choices ride the hash query.
  useEffect(() => {
    history.replaceState(null, '', `#/demos/meridian${encodeSelection(selection)}`)
  }, [selection])

  // A shared link opened while already on the page changes only the hash —
  // no remount — so hash edits must sync back into state. Our own
  // replaceState writes don't fire hashchange, so this can't loop.
  useEffect(() => {
    const onHash = () => setSelection(decodeSelection(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const onSelect = (part: PartId, id: string) => setSelection((s) => ({ ...s, [part]: id }))

  useEffect(() => {
    document.body.classList.add('meridian-page')
    const prev = document.title
    document.title = 'Meridian Instruments — the Meridian One'
    return () => {
      document.body.classList.remove('meridian-page')
      document.title = prev
    }
  }, [])

  return (
    <div className="meridian-root flex min-h-svh flex-col bg-meridian-bg text-meridian-ink">
      <header className="sticky top-0 z-10 border-b border-meridian-line bg-meridian-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-meridian-muted transition-colors hover:text-meridian-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-meridian-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Meridian Instruments</span>
            <span className="rounded-full border border-meridian-brass/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-meridian-brass">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-meridian-muted sm:block" style={d(80)}>
            Procedural 3D · no downloaded models
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_21rem]">
        {/* The stage — CameraControls owns gestures inside this box only,
            so page scroll survives on touch. */}
        <div
          className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-meridian-line bg-meridian-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label={`The Meridian One in ${caseOf(selection).label.toLowerCase()} with a ${dialOf(selection).label.toLowerCase()} dial, ${bezelOf(selection).label.toLowerCase()} bezel and ${strapOf(selection).label.toLowerCase()} strap, keeping the current time.`}
        >
          {glOk && !lost ? (
            <SceneBoundary>
              <div className="h-full" style={{ opacity: ready ? 1 : 0, transition: 'opacity 500ms var(--ease-out)' }}>
                <Scene
                  selection={selection}
                  controlsRef={controlsRef}
                  onContextLost={() => setLost(true)}
                  onReady={() => setReady(true)}
                  ready={ready}
                />
              </div>
              {!ready && (
                <p className="meridian-label absolute inset-0 grid place-items-center">assembling the One…</p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
          {glOk && !lost && ready && (
            <p className="meridian-label pointer-events-none absolute bottom-3 left-4">Drag to orbit · scroll to zoom</p>
          )}
        </div>

        <div className="hero-in" style={d(180)}>
          <Panel selection={selection} onSelect={onSelect} controls={controlsRef} />
        </div>
      </div>

      <footer className="border-t border-meridian-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="font-mono text-xs text-meridian-muted">
            Fictional watchmaker — built for Sean Joudrie's portfolio.
          </p>
          <button
            onClick={() => navigate('#range')}
            className="font-mono text-xs text-meridian-muted transition-colors hover:text-meridian-ink"
          >
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
