import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../lib/router'
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

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_20rem]">
        {/* The stage — CameraControls owns gestures inside this box only,
            so page scroll survives on touch. */}
        <div className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-meridian-line bg-meridian-card lg:min-h-[34rem]" style={d(120)}>
          <Scene />
          <p className="meridian-label pointer-events-none absolute bottom-3 left-4">
            Drag to orbit · scroll to zoom
          </p>
        </div>

        {/* Configurator panel — real controls land in phase 3. */}
        <aside className="hero-in flex flex-col gap-4" style={d(180)}>
          <section className="rounded-xl border border-meridian-line bg-meridian-card p-5">
            <h1 className="text-xl font-semibold tracking-tight">The Meridian One</h1>
            <p className="mt-1 text-sm text-meridian-ink-2">
              40mm · quartz movement, real local time · every part procedural.
            </p>
            <p className="mt-4 font-mono text-xs text-meridian-muted">
              Configurator lands here — case, dial, bezel, strap.
            </p>
          </section>
          <section className="rounded-xl border border-meridian-line bg-meridian-card p-5">
            <h2 className="meridian-label">Demo pricing</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight">$1,450</p>
            <p className="mt-1 font-mono text-xs text-meridian-muted">Fictional brand, fictional price.</p>
          </section>
        </aside>
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
