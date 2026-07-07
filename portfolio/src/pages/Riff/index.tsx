import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { Riff, TONES, type Tone } from './audio'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

const FINISHES = [
  { name: 'Original', color: 'original' },
  { name: 'Cherry', color: '#7c1c22' },
  { name: 'Sunburst', color: '#b9741f' },
  { name: 'Surf Green', color: '#5cae94' },
  { name: 'Lake Blue', color: '#5f96c4' },
  { name: 'Candy', color: '#c11a2b' },
  { name: 'Gold Top', color: '#c9a227' },
  { name: 'Olympic', color: '#e9e3d4' },
  { name: 'Black', color: '#17171a' },
]

const TONE_LABEL: Record<Tone, string> = { clean: 'Clean', drive: 'Drive', reverb: 'Reverb' }

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

/** Wordmark — a little plectrum. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M10 3c3.5 0 6 2.2 6 5 0 3.2-3.4 7.4-5.2 8.6a1.4 1.4 0 0 1-1.6 0C7.4 15.4 4 11.2 4 8c0-2.8 2.5-5 6-5Z" fill="var(--color-riff-hot)" />
    </svg>
  )
}

export default function RiffPage() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [bodyColor, setBodyColor] = useState('original')
  const [tone, setTone] = useState<Tone>('clean')
  const [plugged, setPlugged] = useState(false)
  const riff = useRef<Riff | null>(null)
  if (!riff.current) riff.current = new Riff()

  useEffect(() => {
    document.title = 'Riff — a playable guitar · Sean Joudrie'
    document.body.classList.add('riff-page')
    const r = riff.current
    ;(window as unknown as { __riff?: Riff }).__riff = r ?? undefined
    return () => {
      document.body.classList.remove('riff-page')
      r?.dispose()
    }
  }, [])

  const togglePlug = async () => {
    const next = !plugged
    await riff.current!.plug(next)
    setPlugged(next)
  }
  const cycleTone = () => {
    const next = TONES[(TONES.indexOf(tone) + 1) % TONES.length]
    riff.current!.setTone(next)
    setTone(next)
  }

  return (
    <div className="riff-root flex min-h-svh flex-col bg-riff-bg text-riff-ink">
      <header className="sticky top-0 z-10 border-b border-riff-line bg-riff-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button onClick={() => navigate('#range')} className="hero-in font-mono text-xs tracking-wide text-riff-muted transition-colors hover:text-riff-ink" style={d(0)}>
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-riff-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Riff</span>
            <span className="rounded-full border border-riff-hot/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-riff-hot">Demo</span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-riff-muted sm:block" style={d(80)}>
            solid 3D · Web Audio · no samples
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div
          className="hero-in relative min-h-[26rem] overflow-hidden rounded-xl border border-riff-line bg-riff-card lg:min-h-[34rem]"
          style={d(120)}
          role="img"
          aria-label="A solid 3D electric guitar beside an amp. Plug in the cable, then click the strings to play open notes."
        >
          {glOk && !lost ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                <Suspense fallback={null}>
                  <Scene
                    bodyColor={bodyColor}
                    tone={tone}
                    plugged={plugged}
                    onPluck={(i) => riff.current!.pluck(i)}
                    onStrum={() => riff.current!.strum()}
                    onAmpClick={cycleTone}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="riff-label absolute inset-0 grid place-items-center">tuning up…</p>}
              {ready && (
                <p className="riff-label pointer-events-none absolute bottom-3 left-4">
                  {plugged ? 'Click the strings · click the body to strum' : 'Plug in to play'}
                </p>
              )}
            </SceneBoundary>
          ) : (
            <Fallback />
          )}
        </div>

        <aside className="hero-in space-y-4" style={d(180)}>
          {/* Amp / cable */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <h2 className="riff-label !text-riff-ink-2">Amp</h2>
            <button
              onClick={togglePlug}
              className={`mt-3 w-full rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                plugged ? 'border-riff-hot/60 bg-riff-hot/12 text-riff-ink' : 'border-riff-line text-riff-ink-2 hover:border-riff-line-strong hover:text-riff-ink'
              }`}
            >
              {plugged ? '● Plugged in' : 'Plug in the cable'}
            </button>
            <div className="mt-3">
              <span className="font-mono text-[0.66rem] text-riff-muted">tone (or click the amp)</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => { riff.current!.setTone(t); setTone(t) }}
                    aria-pressed={tone === t}
                    className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                      tone === t ? 'border-riff-hot/60 bg-riff-hot/12 text-riff-ink' : 'border-riff-line text-riff-muted hover:text-riff-ink'
                    }`}
                  >
                    {TONE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Finish */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <h2 className="riff-label !text-riff-ink-2">Body finish</h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setBodyColor(f.color)}
                  title={f.name}
                  aria-label={f.name}
                  className={`aspect-square rounded-md border-2 transition-transform hover:scale-105 ${bodyColor === f.color ? 'border-riff-ink' : 'border-transparent'}`}
                  style={{ background: f.color === 'original' ? 'linear-gradient(135deg, #8f1f24 0%, #c4353a 55%, #e9e3d4 55%, #d9d2c2 100%)' : f.color }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 font-mono text-[0.66rem] text-riff-muted">
              custom
              <input type="color" value={bodyColor === 'original' ? '#7c1c22' : bodyColor} onChange={(e) => setBodyColor(e.target.value)} className="h-6 w-10 cursor-pointer rounded border border-riff-line bg-transparent" />
              <span>{bodyColor === 'original' ? 'textured' : bodyColor}</span>
            </label>
          </div>
        </aside>
      </div>

      <footer className="border-t border-riff-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="max-w-3xl font-mono text-xs leading-relaxed text-riff-muted">
The sound is hand-rolled Web Audio — Karplus-Strong plucked strings, a waveshaper drive and a synthesized reverb, no samples, no audio library. Models (CC BY): guitar “Electric guitar” by maxkorkiat (via Sketchfab), amp by Poly by Google (via Poly Pizza). A cousin of the series after{' '}
            <a href="https://github.com/cortiz2894/hologram-particles" target="_blank" rel="noreferrer" className="underline decoration-riff-line-strong underline-offset-2 hover:text-riff-ink">cortiz2894</a>.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-riff-muted transition-colors hover:text-riff-ink">Back to the portfolio →</button>
        </div>
      </footer>
    </div>
  )
}
