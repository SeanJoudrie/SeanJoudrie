import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

type Region = { id: number; key: string; label: string; group: 'cranium' | 'face' | 'jaw' }
type Manifest = { count: number; mandibleId: number; hinge: [number, number, number]; regions: Region[] }

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

/** Wordmark — a small skull-in-profile glyph. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path
        d="M10 3c3.3 0 5.6 2.3 5.6 5.4 0 1.6-.6 2.7-.6 3.8 0 .9-.6 1.3-1.5 1.3-.4 1.2-1.6 2-3.5 2-3 0-5.6-2-5.6-5.1V8.4C4.4 5.3 6.7 3 10 3Z"
        fill="none"
        stroke="var(--color-skull-dot)"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="9" r="1.4" fill="var(--color-skull-hot)" />
      <circle cx="12.4" cy="9" r="1.4" fill="var(--color-skull-dot)" />
    </svg>
  )
}

export default function Skull() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selected, setSelected] = useState(-1)
  const [auto, setAuto] = useState(true)
  const [jaw, setJaw] = useState(0)
  // Live values the render loop reads without re-instantiating the scene.
  const jawRef = useRef({ open: 0, auto: true })

  useEffect(() => {
    jawRef.current.auto = auto
    jawRef.current.open = jaw
  }, [auto, jaw])

  useEffect(() => {
    document.title = 'Skull — a particle skull · Sean Joudrie'
    document.body.classList.add('skull-page')
    fetch(`${import.meta.env.BASE_URL}skull/skull-regions.json`)
      .then((r) => r.json())
      .then((m: Manifest) => setManifest(m))
      .catch(() => setLost(true))
    return () => document.body.classList.remove('skull-page')
  }, [])

  const cranium = manifest?.regions.filter((r) => r.group === 'cranium') ?? []
  const face = manifest?.regions.filter((r) => r.group === 'face') ?? []
  const jawBones = manifest?.regions.filter((r) => r.group === 'jaw') ?? []
  const current = manifest?.regions.find((r) => r.id === selected)
  const pick = (id: number) => setSelected((s) => (s === id ? -1 : id))

  const Item = ({ r }: { r: Region }) => (
    <li>
      <button
        onClick={() => pick(r.id)}
        aria-pressed={selected === r.id}
        className={`w-full rounded-md border px-3 py-1.5 text-left text-sm transition-colors ${
          selected === r.id
            ? 'border-skull-hot/60 bg-skull-hot/12 text-skull-ink'
            : 'border-skull-line text-skull-ink-2 hover:border-skull-line-strong hover:text-skull-ink'
        }`}
      >
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
          style={{ background: selected === r.id ? 'var(--color-skull-hot)' : 'var(--color-skull-dot)' }}
        />
        {r.label}
      </button>
    </li>
  )

  return (
    <div className="skull-root flex min-h-svh flex-col bg-skull-bg text-skull-ink">
      <header className="sticky top-0 z-10 border-b border-skull-line bg-skull-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-skull-muted transition-colors hover:text-skull-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-skull-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Skull</span>
            <span className="rounded-full border border-skull-hot/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-skull-hot">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-skull-muted sm:block" style={d(80)}>
            {(manifest?.count ?? 61058).toLocaleString('en-US')} points · anatomical atlas
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div
          className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-skull-line bg-skull-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label={
            current
              ? `A rotating skull of particles with the ${current.label.toLowerCase()} highlighted.`
              : 'A rotating skull made of sixty-one thousand ivory particles, its jaw gently opening and closing. Select a bone to highlight it.'
          }
        >
          {glOk && !lost && manifest ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                <Suspense fallback={null}>
                  <Scene
                    selected={selected}
                    mandibleId={manifest.mandibleId}
                    hinge={manifest.hinge}
                    jawRef={jawRef}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="skull-label absolute inset-0 grid place-items-center">assembling skull…</p>}
              {ready && (
                <p className="skull-label pointer-events-none absolute bottom-3 left-4">
                  {current ? current.label : 'Drag to orbit · scroll to zoom'}
                </p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
        </div>

        <aside className="hero-in space-y-4" style={d(180)}>
          {/* Jaw control */}
          <div className="rounded-xl border border-skull-line bg-skull-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="skull-label !text-skull-ink-2">Jaw</h2>
              <button
                onClick={() => setAuto((a) => !a)}
                aria-pressed={auto}
                className={`rounded-md border px-2 py-0.5 font-mono text-[0.68rem] transition-colors ${
                  auto ? 'border-skull-hot/60 bg-skull-hot/12 text-skull-ink' : 'border-skull-line text-skull-muted hover:text-skull-ink'
                }`}
              >
                auto
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(jaw * 100)}
              onChange={(e) => { setAuto(false); setJaw(Number(e.target.value) / 100) }}
              aria-label="Jaw opening"
              className="mt-3 w-full accent-skull-hot"
            />
            <p className="mt-1 font-mono text-[0.66rem] text-skull-muted">
              {auto ? 'chewing — drag to take control' : `${Math.round(jaw * 100)}% open`}
            </p>
          </div>

          <div className="rounded-xl border border-skull-line bg-skull-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="skull-label !text-skull-ink-2">Cranium</h2>
              {selected >= 0 && (
                <button onClick={() => setSelected(-1)} className="font-mono text-[0.68rem] text-skull-muted hover:text-skull-ink">
                  clear
                </button>
              )}
            </div>
            <ul className="mt-2 space-y-1">{cranium.map((r) => <Item key={r.id} r={r} />)}</ul>
            <h2 className="skull-label !text-skull-ink-2 mt-5">Face</h2>
            <ul className="mt-2 space-y-1">{face.map((r) => <Item key={r.id} r={r} />)}</ul>
            <h2 className="skull-label !text-skull-ink-2 mt-5">Jaw &amp; hyoid</h2>
            <ul className="mt-2 space-y-1">{jawBones.map((r) => <Item key={r.id} r={r} />)}</ul>
          </div>
        </aside>
      </div>

      <footer className="border-t border-skull-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="max-w-3xl font-mono text-xs leading-relaxed text-skull-muted">
            Meshes:{' '}
            <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer" className="underline decoration-skull-line-strong underline-offset-2 hover:text-skull-ink">
              BodyParts3D
            </a>
            , © The Database Center for Life Science, CC BY-SA 2.1 Japan. Particle treatment after{' '}
            <a href="https://github.com/cortiz2894/hologram-particles" target="_blank" rel="noreferrer" className="underline decoration-skull-line-strong underline-offset-2 hover:text-skull-ink">
              cortiz2894's hologram-particles
            </a>{' '}
            (concept: igloo.inc) — rebuilt in plain GLSL.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-skull-muted transition-colors hover:text-skull-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
