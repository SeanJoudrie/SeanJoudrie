import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

type Group = 'cord' | 'cervical' | 'thoracic' | 'lumbar' | 'sacral'
type Region = { id: number; key: string; label: string; group: Group }
type Manifest = { count: number; cordId: number; regions: Region[] }

const SECTIONS: { group: Group; title: string }[] = [
  { group: 'cervical', title: 'Cervical · neck (C1–C7)' },
  { group: 'thoracic', title: 'Thoracic · chest (T1–T12)' },
  { group: 'lumbar', title: 'Lumbar · lower back (L1–L5)' },
  { group: 'sacral', title: 'Sacral' },
]

const short = (r: Region) =>
  r.group === 'sacral' ? 'Sacrum' : r.group === 'cord' ? 'Cord' : r.key.toUpperCase()

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

/** Wordmark — a little stack of vertebrae. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      {[4, 8.4, 12.8].map((y, i) => (
        <rect key={i} x="6" y={y} width="8" height="3.1" rx="1.4" fill="none" stroke="var(--color-spine-dot)" strokeWidth="1.1" />
      ))}
      <line x1="10" y1="3" x2="10" y2="17" stroke="var(--color-spine-cord)" strokeWidth="1.4" />
    </svg>
  )
}

export default function Spine() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selected, setSelected] = useState(-1)
  const [auto, setAuto] = useState(true)
  const [pos, setPos] = useState(0)
  const [bend, setBend] = useState(0)
  // Live values the render loop reads without re-instantiating the scene.
  const pulseRef = useRef({ pos: 0, auto: true })
  const bendRef = useRef({ val: 0 })

  useEffect(() => {
    pulseRef.current.auto = auto
    pulseRef.current.pos = pos
  }, [auto, pos])

  useEffect(() => { bendRef.current.val = bend }, [bend])

  useEffect(() => {
    document.title = 'Spine — a particle vertebral column · Sean Joudrie'
    document.body.classList.add('spine-page')
    fetch(`${import.meta.env.BASE_URL}spine/spine-regions.json`)
      .then((r) => r.json())
      .then((m: Manifest) => setManifest(m))
      .catch(() => setLost(true))
    return () => document.body.classList.remove('spine-page')
  }, [])

  const cord = manifest?.regions.find((r) => r.group === 'cord')
  const current = manifest?.regions.find((r) => r.id === selected)
  const pick = (id: number) => setSelected((s) => (s === id ? -1 : id))

  const Chip = ({ r }: { r: Region }) => (
    <button
      onClick={() => pick(r.id)}
      aria-pressed={selected === r.id}
      title={r.label}
      className={`rounded-md border px-0 py-1.5 text-center font-mono text-xs transition-colors ${
        selected === r.id
          ? 'border-spine-hot/60 bg-spine-hot/12 text-spine-ink'
          : 'border-spine-line text-spine-ink-2 hover:border-spine-line-strong hover:text-spine-ink'
      }`}
    >
      {short(r)}
    </button>
  )

  return (
    <div className="spine-root flex min-h-svh flex-col bg-spine-bg text-spine-ink">
      <header className="sticky top-0 z-10 border-b border-spine-line bg-spine-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-spine-muted transition-colors hover:text-spine-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-spine-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Spine</span>
            <span className="rounded-full border border-spine-hot/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-spine-hot">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-spine-muted sm:block" style={d(80)}>
            {(manifest?.count ?? 63917).toLocaleString('en-US')} points · anatomical atlas
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div
          className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-spine-line bg-spine-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label={
            current
              ? `A rotating vertebral column of particles with the ${current.label} highlighted.`
              : 'A rotating vertebral column made of sixty-four thousand ivory particles, an amber spinal cord threading through, a signal running down it. Select a vertebra to highlight it.'
          }
        >
          {glOk && !lost && manifest ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                <Suspense fallback={null}>
                  <Scene
                    selected={selected}
                    cordId={manifest.cordId}
                    regions={manifest.regions}
                    pulseRef={pulseRef}
                    bendRef={bendRef}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="spine-label absolute inset-0 grid place-items-center">stacking vertebrae…</p>}
              {ready && (
                <p className="spine-label pointer-events-none absolute bottom-3 left-4">
                  {current ? current.label : 'Drag to orbit · scroll to zoom'}
                </p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
        </div>

        <aside className="hero-in space-y-4" style={d(180)}>
          {/* Posture — articulated flexion */}
          <div className="rounded-xl border border-spine-line bg-spine-card p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="spine-label !text-spine-ink-2">Posture</h2>
              <span className="font-mono text-[0.66rem] text-spine-muted">{bend === 0 ? 'neutral' : `${Math.round(bend * 100)}% flexed`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(bend * 100)}
              onChange={(e) => setBend(Number(e.target.value) / 100)}
              aria-label="Spine flexion, straight to bent"
              className="mt-3 w-full accent-spine-hot"
            />
            <div className="mt-1 flex justify-between font-mono text-[0.62rem] text-spine-muted">
              <span>straight</span>
              <span>bent</span>
            </div>
            <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-spine-muted">
              Each vertebra hinges at its own joint — the neck and lower back bend, the rib-caged thoracic stays stiff.
            </p>
          </div>

          {/* Nerve signal */}
          <div className="rounded-xl border border-spine-line bg-spine-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="spine-label !text-spine-ink-2">Nerve signal</h2>
              <button
                onClick={() => setAuto((a) => !a)}
                aria-pressed={auto}
                className={`rounded-md border px-2 py-0.5 font-mono text-[0.68rem] transition-colors ${
                  auto ? 'border-spine-hot/60 bg-spine-hot/12 text-spine-ink' : 'border-spine-line text-spine-muted hover:text-spine-ink'
                }`}
              >
                auto
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(pos * 100)}
              onChange={(e) => { setAuto(false); setPos(Number(e.target.value) / 100) }}
              aria-label="Signal position down the cord"
              className="mt-3 w-full accent-spine-hot"
            />
            <p className="mt-1 font-mono text-[0.66rem] text-spine-muted">
              {auto ? 'firing — drag to take control' : 'brain → tail, drag to move it'}
            </p>
          </div>

          {/* Regions */}
          <div className="rounded-xl border border-spine-line bg-spine-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="spine-label !text-spine-ink-2">Vertebrae</h2>
              {selected >= 0 && (
                <button onClick={() => setSelected(-1)} className="font-mono text-[0.68rem] text-spine-muted hover:text-spine-ink">
                  clear
                </button>
              )}
            </div>

            {cord && (
              <button
                onClick={() => pick(cord.id)}
                aria-pressed={selected === cord.id}
                className={`mt-3 flex w-full items-center rounded-md border px-3 py-1.5 text-left text-sm transition-colors ${
                  selected === cord.id
                    ? 'border-spine-hot/60 bg-spine-hot/12 text-spine-ink'
                    : 'border-spine-line text-spine-ink-2 hover:border-spine-line-strong hover:text-spine-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                  style={{ background: selected === cord.id ? 'var(--color-spine-hot)' : 'var(--color-spine-cord)' }}
                />
                {cord.label}
              </button>
            )}

            {SECTIONS.map(({ group, title }) => {
              const rs = manifest?.regions.filter((r) => r.group === group) ?? []
              if (!rs.length) return null
              return (
                <div key={group} className="mt-4">
                  <h3 className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-spine-muted">{title}</h3>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {rs.map((r) => <Chip key={r.id} r={r} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      </div>

      <footer className="border-t border-spine-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="max-w-3xl font-mono text-xs leading-relaxed text-spine-muted">
            Vertebra meshes:{' '}
            <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer" className="underline decoration-spine-line-strong underline-offset-2 hover:text-spine-ink">
              BodyParts3D
            </a>
            , © The Database Center for Life Science, CC BY-SA 2.1 Japan. The spinal cord isn't in the bone atlas — it's
            synthesized as a tube through the vertebral canal. Particle treatment after{' '}
            <a href="https://github.com/cortiz2894/hologram-particles" target="_blank" rel="noreferrer" className="underline decoration-spine-line-strong underline-offset-2 hover:text-spine-ink">
              cortiz2894's hologram-particles
            </a>{' '}
            (concept: igloo.inc) — rebuilt in plain GLSL.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-spine-muted transition-colors hover:text-spine-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
