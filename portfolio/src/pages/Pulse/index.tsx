import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

type Region = { id: number; key: string; label: string; group: string; centroid: [number, number, number]; amp: number; phase: number }
type Manifest = { count: number; regions: Region[] }

const CHAMBER_KEYS = ['lv', 'rv', 'la', 'ra']
const PRESETS = [
  { label: 'Resting', bpm: 55 },
  { label: 'Normal', bpm: 75 },
  { label: 'Exercise', bpm: 150 },
]

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

/** Wordmark — a small heart. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M10 16.5C4.5 12.6 2.5 9.9 2.5 7.4 2.5 5.4 4 4 6 4c1.4 0 2.7.8 3.4 2 .7-1.2 2-2 3.4-2 2 0 3.7 1.4 3.7 3.4 0 2.5-2 5.2-6.5 9.1Z" fill="var(--color-pulse-red)" />
    </svg>
  )
}

export default function Pulse() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selected, setSelected] = useState(-1)
  const [bpm, setBpm] = useState(75)
  const bpmRef = useRef({ bpm: 75 })

  useEffect(() => { bpmRef.current.bpm = bpm }, [bpm])

  useEffect(() => {
    document.title = 'Pulse — a beating particle heart · Sean Joudrie'
    document.body.classList.add('pulse-page')
    fetch(`${import.meta.env.BASE_URL}pulse/pulse-regions.json`)
      .then((r) => r.json())
      .then((m: Manifest) => setManifest(m))
      .catch(() => setLost(true))
    return () => document.body.classList.remove('pulse-page')
  }, [])

  const chambers = manifest?.regions.filter((r) => CHAMBER_KEYS.includes(r.key)) ?? []
  const vessels = manifest?.regions.filter((r) => !CHAMBER_KEYS.includes(r.key)) ?? []
  const current = manifest?.regions.find((r) => r.id === selected)
  const pick = (id: number) => setSelected((s) => (s === id ? -1 : id))
  const zone = bpm < 65 ? 'resting' : bpm < 100 ? 'normal' : bpm < 140 ? 'elevated' : 'peak'

  const Item = ({ r }: { r: Region }) => (
    <li>
      <button
        onClick={() => pick(r.id)}
        aria-pressed={selected === r.id}
        className={`flex w-full items-center rounded-md border px-3 py-1.5 text-left text-sm transition-colors ${
          selected === r.id
            ? 'border-pulse-hot/60 bg-pulse-hot/12 text-pulse-ink'
            : 'border-pulse-line text-pulse-ink-2 hover:border-pulse-line-strong hover:text-pulse-ink'
        }`}
      >
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
          style={{ background: selected === r.id ? 'var(--color-pulse-hot)' : r.group === 'red' ? 'var(--color-pulse-red)' : 'var(--color-pulse-blue)' }}
        />
        {r.label}
      </button>
    </li>
  )

  return (
    <div className="pulse-root flex min-h-svh flex-col bg-pulse-bg text-pulse-ink">
      <header className="sticky top-0 z-10 border-b border-pulse-line bg-pulse-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-pulse-muted transition-colors hover:text-pulse-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-pulse-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Pulse</span>
            <span className="rounded-full border border-pulse-hot/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-pulse-hot">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-pulse-muted sm:block" style={d(80)}>
            {(manifest?.count ?? 53270).toLocaleString('en-US')} points · anatomical atlas
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div
          className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-pulse-line bg-pulse-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label={
            current
              ? `A beating heart of particles with the ${current.label.toLowerCase()} highlighted.`
              : 'A rotating heart made of fifty-three thousand particles, beating — the chambers squeeze and blood surges up the arteries. Select a chamber or vessel to highlight it.'
          }
        >
          {glOk && !lost && manifest ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                <Suspense fallback={null}>
                  <Scene
                    regions={manifest.regions}
                    selected={selected}
                    bpmRef={bpmRef}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="pulse-label absolute inset-0 grid place-items-center">finding a pulse…</p>}
              {ready && (
                <p className="pulse-label pointer-events-none absolute bottom-3 left-4">
                  {current ? current.label : 'Drag to orbit · scroll to zoom'}
                </p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
        </div>

        <aside className="hero-in space-y-4" style={d(180)}>
          {/* Heart rate */}
          <div className="rounded-xl border border-pulse-line bg-pulse-card p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="pulse-label !text-pulse-ink-2">Heart rate</h2>
              <span className="font-mono text-[0.66rem] text-pulse-muted">{bpm} BPM · {zone}</span>
            </div>
            <input
              type="range"
              min={40}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              aria-label="Heart rate in beats per minute"
              className="mt-3 w-full accent-pulse-hot"
            />
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setBpm(p.bpm)}
                  className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    bpm === p.bpm ? 'border-pulse-hot/60 bg-pulse-hot/12 text-pulse-ink' : 'border-pulse-line text-pulse-muted hover:text-pulse-ink'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div className="rounded-xl border border-pulse-line bg-pulse-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="pulse-label !text-pulse-ink-2">Chambers</h2>
              {selected >= 0 && (
                <button onClick={() => setSelected(-1)} className="font-mono text-[0.68rem] text-pulse-muted hover:text-pulse-ink">
                  clear
                </button>
              )}
            </div>
            <ul className="mt-2 space-y-1">{chambers.map((r) => <Item key={r.id} r={r} />)}</ul>
            <h2 className="pulse-label !text-pulse-ink-2 mt-5">Great vessels</h2>
            <ul className="mt-2 space-y-1">{vessels.map((r) => <Item key={r.id} r={r} />)}</ul>
            <p className="mt-3 font-mono text-[0.62rem] leading-relaxed text-pulse-muted">
              <span style={{ color: 'var(--color-pulse-red)' }}>●</span> oxygenated (left){'  '}
              <span style={{ color: 'var(--color-pulse-blue)' }}>●</span> deoxygenated (right)
            </p>
          </div>
        </aside>
      </div>

      <footer className="border-t border-pulse-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="max-w-3xl font-mono text-xs leading-relaxed text-pulse-muted">
            Heart mesh:{' '}
            <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer" className="underline decoration-pulse-line-strong underline-offset-2 hover:text-pulse-ink">
              BodyParts3D
            </a>
            , © The Database Center for Life Science, CC BY-SA 2.1 Japan. The atlas ships the heart as one wall mesh — the four
            chambers are split out procedurally and each beats on its own phase of the cardiac cycle. Particle treatment after{' '}
            <a href="https://github.com/cortiz2894/hologram-particles" target="_blank" rel="noreferrer" className="underline decoration-pulse-line-strong underline-offset-2 hover:text-pulse-ink">
              cortiz2894's hologram-particles
            </a>{' '}
            — rebuilt in plain GLSL.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-pulse-muted transition-colors hover:text-pulse-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
