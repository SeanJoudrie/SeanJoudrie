import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { PARTICLE_COUNT } from './Scene'
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

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** Wordmark — a dotted meridian and equator through a globe circle. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--color-terra-land)" strokeWidth="1.4" />
      <ellipse cx="10" cy="10" rx="4" ry="8.5" fill="none" stroke="var(--color-terra-sea)" strokeWidth="1" strokeDasharray="1.5 2" />
      <line x1="1.5" y1="10" x2="18.5" y2="10" stroke="var(--color-terra-sea)" strokeWidth="1" strokeDasharray="1.5 2" />
    </svg>
  )
}

export default function Terra() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.title = 'Terra — a particle Earth · Sean Joudrie'
    document.body.classList.add('terra-page')
    return () => document.body.classList.remove('terra-page')
  }, [])

  return (
    <div className="terra-root flex min-h-svh flex-col bg-terra-bg text-terra-ink">
      <header className="sticky top-0 z-10 border-b border-terra-line bg-terra-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-terra-muted transition-colors hover:text-terra-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-terra-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Terra</span>
            <span className="rounded-full border border-terra-land/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-terra-land">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-terra-muted sm:block" style={d(80)}>
            {PARTICLE_COUNT.toLocaleString('en-US')} points · no globe library
          </span>
        </div>
      </header>

      {/* The stage — the globe owns the viewport. CameraControls owns
          gestures inside this box only, so page scroll survives on touch. */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8">
        <div
          className="hero-in relative h-full min-h-[26rem] overflow-hidden rounded-xl border border-terra-line bg-terra-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label="A rotating Earth made of sixty thousand glowing particles — green land, blue sea. Move the pointer across it and the surface parts around the cursor."
        >
          {glOk && !lost ? (
            <SceneBoundary>
              {/* Absolute, not h-full: the stage is sized by min-h, so a
                  percentage height would collapse to the canvas default. */}
              <div
                className="absolute inset-0"
                style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}
              >
                <Suspense fallback={null}>
                  <Scene onFail={() => setLost(true)} onReady={() => setReady(true)} />
                </Suspense>
              </div>
              {!ready && (
                <p className="terra-label absolute inset-0 grid place-items-center">sampling coastlines…</p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
          {glOk && !lost && ready && (
            <p className="terra-label pointer-events-none absolute bottom-3 left-4">
              Drag to orbit · glide across to disturb · scroll to zoom
            </p>
          )}
        </div>
      </div>

      <footer className="border-t border-terra-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="font-mono text-xs text-terra-muted">
            Particle treatment after{' '}
            <a
              href="https://github.com/cortiz2894/hologram-particles"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-terra-line-strong underline-offset-2 transition-colors hover:text-terra-ink"
            >
              cortiz2894's hologram-particles
            </a>{' '}
            (concept: igloo.inc) — rebuilt from scratch in plain GLSL. Land mask: NASA, public domain.
          </p>
          <button
            onClick={() => navigate('#range')}
            className="font-mono text-xs text-terra-muted transition-colors hover:text-terra-ink"
          >
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
