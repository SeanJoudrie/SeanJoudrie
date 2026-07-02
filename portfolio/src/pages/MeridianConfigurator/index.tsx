import { useEffect, useRef, useState } from 'react'
import type { ComponentRef, CSSProperties } from 'react'
import type { CameraControls } from '@react-three/drei'
import { navigate } from '../../lib/router'
import type { PartId, Selection } from './config'
import { decodeSelection, encodeSelection } from './config'
import { Panel } from './Panel'
import Scene from './Scene'
import './theme.css'

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

  // The build is shareable: non-default choices ride the hash query.
  useEffect(() => {
    history.replaceState(null, '', `#/demos/meridian${encodeSelection(selection)}`)
  }, [selection])

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
        <div className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-meridian-line bg-meridian-card lg:min-h-[34rem]" style={d(120)}>
          <Scene selection={selection} controlsRef={controlsRef} />
          <p className="meridian-label pointer-events-none absolute bottom-3 left-4">
            Drag to orbit · scroll to zoom
          </p>
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
