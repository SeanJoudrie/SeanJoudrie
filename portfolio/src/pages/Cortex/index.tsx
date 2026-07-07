import { Component, Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

type Region = { id: number; key: string; label: string; group: 'deep' | 'shell' }
type Manifest = { count: number; regions: Region[] }

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

/** Wordmark — a small cortex-lobe glyph. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6 5.5c-2 0-3 1.4-3 2.8 0 .7.3 1.2.7 1.6-.5.4-.8 1-.8 1.7 0 1.5 1.2 2.4 2.8 2.4M6 5.5c1 0 1.8.5 2.2 1.3M6 13c1 0 1.9-.5 2.3-1.4"
        fill="none"
        stroke="var(--color-cortex-hot)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M11 4.8c2.6 0 4.5 1.7 4.5 4 0 1-.4 1.9-1 2.5.3.5.5 1 .5 1.6 0 1.8-1.6 3-3.8 3"
        fill="none"
        stroke="var(--color-cortex-ink-2)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Cortex() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selected, setSelected] = useState(-1)

  useEffect(() => {
    document.title = 'Cortex — a particle brain · Sean Joudrie'
    document.body.classList.add('cortex-page')
    fetch(`${import.meta.env.BASE_URL}cortex/regions.json`)
      .then((r) => r.json())
      .then((m: Manifest) => setManifest(m))
      .catch(() => setLost(true))
    return () => document.body.classList.remove('cortex-page')
  }, [])

  const deepFlags = useMemo(() => {
    const f = new Uint8Array(64)
    manifest?.regions.forEach((r) => (f[r.id] = r.group === 'deep' ? 1 : 0))
    return f
  }, [manifest])

  const deep = manifest?.regions.filter((r) => r.group === 'deep') ?? []
  const shell = manifest?.regions.filter((r) => r.group === 'shell') ?? []
  const current = manifest?.regions.find((r) => r.id === selected)

  const pick = (id: number) => setSelected((s) => (s === id ? -1 : id))

  const Item = ({ r }: { r: Region }) => (
    <li>
      <button
        onClick={() => pick(r.id)}
        aria-pressed={selected === r.id}
        className={`w-full rounded-md border px-3 py-1.5 text-left text-sm transition-colors ${
          selected === r.id
            ? 'border-cortex-hot/60 bg-cortex-hot/12 text-cortex-ink'
            : 'border-cortex-line text-cortex-ink-2 hover:border-cortex-line-strong hover:text-cortex-ink'
        }`}
      >
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
          style={{ background: selected === r.id ? 'var(--color-cortex-hot)' : 'var(--color-cortex-dot)' }}
        />
        {r.label}
      </button>
    </li>
  )

  return (
    <div className="cortex-root flex min-h-svh flex-col bg-cortex-bg text-cortex-ink">
      <header className="sticky top-0 z-10 border-b border-cortex-line bg-cortex-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-cortex-muted transition-colors hover:text-cortex-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-cortex-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Cortex</span>
            <span className="rounded-full border border-cortex-hot/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cortex-hot">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-cortex-muted sm:block" style={d(80)}>
            {(manifest?.count ?? 80198).toLocaleString('en-US')} points · anatomical atlas
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div
          className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-cortex-line bg-cortex-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label={
            current
              ? `A rotating brain of particles with the ${current.label.toLowerCase()} highlighted in red, the cortex dimmed to a blue ghost around it.`
              : 'A rotating brain made of eighty thousand blue particles. Select a structure to highlight it in red.'
          }
        >
          {glOk && !lost && manifest ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                <Suspense fallback={null}>
                  <Scene
                    selected={selected}
                    deepFlags={deepFlags}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="cortex-label absolute inset-0 grid place-items-center">assembling cortex…</p>}
              {ready && (
                <p className="cortex-label pointer-events-none absolute bottom-3 left-4">
                  {current ? current.label : 'Drag to orbit · scroll to zoom'}
                </p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
        </div>

        {/* The region list — deep structures are the stars; lobes ghost behind. */}
        <aside className="hero-in" style={d(180)}>
          <div className="rounded-xl border border-cortex-line bg-cortex-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="cortex-label !text-cortex-ink-2">Deep structures</h2>
              {selected >= 0 && (
                <button onClick={() => setSelected(-1)} className="font-mono text-[0.68rem] text-cortex-muted hover:text-cortex-ink">
                  clear
                </button>
              )}
            </div>
            <ul className="mt-2 space-y-1">
              {deep.map((r) => <Item key={r.id} r={r} />)}
            </ul>
            <h2 className="cortex-label !text-cortex-ink-2 mt-5">Lobes &amp; surface</h2>
            <ul className="mt-2 space-y-1">
              {shell.map((r) => <Item key={r.id} r={r} />)}
            </ul>
          </div>
        </aside>
      </div>

      <footer className="border-t border-cortex-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="max-w-3xl font-mono text-xs leading-relaxed text-cortex-muted">
            Meshes:{' '}
            <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer" className="underline decoration-cortex-line-strong underline-offset-2 hover:text-cortex-ink">
              BodyParts3D
            </a>
            , © The Database Center for Life Science, CC BY-SA 2.1 Japan. Particle treatment after{' '}
            <a href="https://github.com/cortiz2894/hologram-particles" target="_blank" rel="noreferrer" className="underline decoration-cortex-line-strong underline-offset-2 hover:text-cortex-ink">
              cortiz2894's hologram-particles
            </a>{' '}
            (concept: igloo.inc) — rebuilt in plain GLSL.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-cortex-muted transition-colors hover:text-cortex-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
