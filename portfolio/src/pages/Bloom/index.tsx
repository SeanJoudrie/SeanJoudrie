import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import type { Level } from './Scene'
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

/** Wordmark — a tiny rose of three cubes on a stem cube. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect x="7" y="3" width="6" height="6" fill="var(--color-bloom-hot)" rx="1" />
      <rect x="4" y="6" width="4" height="4" fill="var(--color-bloom-hot)" opacity="0.7" rx="1" />
      <rect x="12.5" y="6.5" width="3.5" height="3.5" fill="var(--color-bloom-hot)" opacity="0.55" rx="1" />
      <rect x="9" y="10" width="2.4" height="7" fill="var(--color-bloom-leaf)" rx="1" />
      <rect x="11.5" y="12" width="3.4" height="2.4" fill="var(--color-bloom-leaf)" opacity="0.8" rx="1" />
    </svg>
  )
}

export default function Bloom() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [levels, setLevels] = useState<Level[] | null>(null)
  const [level, setLevel] = useState(4) // mid-detail first — the reveal works both ways

  useEffect(() => {
    document.title = 'Bloom — a voxel rose · Sean Joudrie'
    document.body.classList.add('bloom-page')
    let alive = true
    Promise.all([
      import('./Scene'),
      fetch(`${import.meta.env.BASE_URL}rose/rose.bin`).then((r) => r.arrayBuffer()),
    ])
      .then(([mod, buf]) => { if (alive) setLevels(mod.parseRose(buf)) })
      .catch(() => alive && setLost(true))
    return () => {
      alive = false
      document.body.classList.remove('bloom-page')
    }
  }, [])

  const current = levels?.[level]
  const ready = !!levels

  return (
    <div className="bloom-root flex min-h-svh flex-col bg-bloom-bg text-bloom-ink">
      <header className="sticky top-0 z-10 border-b border-bloom-line bg-bloom-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-bloom-muted transition-colors hover:text-bloom-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-bloom-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Bloom</span>
            <span className="rounded-full border border-bloom-hot/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-bloom-hot">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-bloom-muted sm:block" style={d(80)}>
            {current ? `${current.count.toLocaleString('en-US')} cubes · grid ${current.r}³` : 'voxel rose'}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8">
        <div
          className="hero-in relative h-full min-h-[26rem] overflow-hidden rounded-xl border border-bloom-line bg-bloom-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label={
            current
              ? `A rotating rose built from ${current.count.toLocaleString('en-US')} lit cubes — red bloom, green stem and leaves. A slider changes how many cubes it is carved into.`
              : 'A rotating rose built from cubes.'
          }
        >
          {glOk && !lost ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                {levels && (
                  <Suspense fallback={null}>
                    <Scene levels={levels} level={level} onFail={() => setLost(true)} />
                  </Suspense>
                )}
              </div>
              {!ready && <p className="bloom-label absolute inset-0 grid place-items-center">voxelizing the rose…</p>}
              {ready && (
                <>
                  {/* The detail slider — the whole point of the piece. Up = finer. */}
                  <div className="absolute inset-y-0 right-0 flex w-16 flex-col items-center justify-center gap-3">
                    <span className="bloom-label select-none">fine</span>
                    <input
                      type="range"
                      className="bloom-vslider"
                      min={0}
                      max={levels.length - 1}
                      step={1}
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      aria-label="Cube detail"
                      aria-valuetext={current ? `${current.count.toLocaleString('en-US')} cubes` : undefined}
                    />
                    <span className="bloom-label select-none">chunky</span>
                  </div>
                  <p className="bloom-label pointer-events-none absolute bottom-3 left-4">
                    {current ? `${current.count.toLocaleString('en-US')} cubes · drag to orbit` : ''}
                  </p>
                </>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
        </div>
      </div>

      <footer className="border-t border-bloom-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="max-w-3xl font-mono text-xs leading-relaxed text-bloom-muted">
            Model:{' '}
            <a href="https://poly.pizza/m/4UQ29NSK0ir" target="_blank" rel="noreferrer" className="underline decoration-bloom-line-strong underline-offset-2 hover:text-bloom-ink">
              Rose by Erbay ÇELIK
            </a>{' '}
            (CC BY, via Poly Pizza) — voxelized at nine resolutions at build time. A cousin of the particle series after{' '}
            <a href="https://github.com/cortiz2894/hologram-particles" target="_blank" rel="noreferrer" className="underline decoration-bloom-line-strong underline-offset-2 hover:text-bloom-ink">
              cortiz2894's hologram-particles
            </a>
            , traded glow for solid lit bodies.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-bloom-muted transition-colors hover:text-bloom-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
