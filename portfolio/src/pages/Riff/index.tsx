import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { Riff, TONES, type Tone } from './audio'
import type { PlugStage } from './Scene'
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

const ACCENTS = [
  { name: 'Original', color: 'original' },
  { name: 'Black', color: '#17171a' },
  { name: 'White', color: '#eceadf' },
  { name: 'Red', color: '#c11a2b' },
  { name: 'Blue', color: '#2b5fc1' },
  { name: 'Gold', color: '#c9a227' },
  { name: 'Silver', color: '#c9ccd2' },
  { name: 'Pink', color: '#e35b8f' },
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
  const [accentColor, setAccentColor] = useState('original')
  const [tone, setTone] = useState<Tone>('clean')
  const [plugStage, setPlugStage] = useState<PlugStage>('unplugged')
  const [capo, setCapo] = useState(0)
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

  const plugged = plugStage === 'plugged'

  const cableButton = async () => {
    void riff.current!.click()
    if (plugged) {
      await riff.current!.plug(false)
      setPlugStage('unplugged')
    } else if (plugStage === 'unplugged') {
      setPlugStage('armed')
    } else {
      setPlugStage('unplugged') // cancel an armed / dragging cable
    }
  }

  const onJackClick = async (which: 'guitar' | 'amp') => {
    void riff.current!.click()
    if (plugStage === 'armed') {
      setPlugStage(which === 'guitar' ? 'drag-guitar' : 'drag-amp')
    } else if (
      (plugStage === 'drag-guitar' && which === 'amp') ||
      (plugStage === 'drag-amp' && which === 'guitar')
    ) {
      setPlugStage('plugged')
      await riff.current!.plug(true)
      riff.current!.connectThunk()
    }
  }

  const cycleTone = () => {
    void riff.current!.click()
    const next = TONES[(TONES.indexOf(tone) + 1) % TONES.length]
    riff.current!.setTone(next)
    setTone(next)
  }

  const changeCapo = (fret: number) => {
    riff.current!.setCapo(fret)
    setCapo(fret)
  }

  const cableLabel =
    plugged ? '● Plugged in — click to unplug'
    : plugStage === 'unplugged' ? 'Activate the cable'
    : plugStage === 'armed' ? 'Cable in hand — click a glowing jack'
    : 'Now click the other jack…'

  const stageHint =
    plugged ? 'Click the strings · click the body to strum'
    : plugStage === 'armed' ? 'Click a glowing jack to grab the cable'
    : plugStage === 'drag-guitar' ? 'Now plug it into the amp'
    : plugStage === 'drag-amp' ? 'Now plug it into the guitar'
    : 'Activate the cable to play'

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
          className="hero-in relative h-[26rem] self-start overflow-hidden rounded-xl border border-riff-line bg-riff-card sm:h-[30rem] lg:h-[34rem]"
          style={d(120)}
          role="img"
          aria-label="A solid 3D electric guitar beside an amp. Activate the cable, plug both jacks, then click the strings to play open notes."
        >
          {glOk && !lost ? (
            <SceneBoundary>
              <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms var(--ease-out)' }}>
                <Suspense fallback={null}>
                  <Scene
                    bodyColor={bodyColor}
                    accentColor={accentColor}
                    tone={tone}
                    plugStage={plugStage}
                    capo={capo}
                    onPluck={(i) => riff.current!.pluck(i)}
                    onStrum={() => riff.current!.strum()}
                    onAmpClick={cycleTone}
                    onJackClick={onJackClick}
                    onCapoDrag={changeCapo}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="riff-label absolute inset-0 grid place-items-center">tuning up…</p>}
              {ready && (
                <p className="riff-label pointer-events-none absolute bottom-3 left-4">
                  {stageHint}
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
              onClick={cableButton}
              className={`mt-3 w-full rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                plugged || plugStage !== 'unplugged' ? 'border-riff-hot/60 bg-riff-hot/12 text-riff-ink' : 'border-riff-line text-riff-ink-2 hover:border-riff-line-strong hover:text-riff-ink'
              }`}
            >
              {cableLabel}
            </button>
            <div className="mt-3">
              <span className="font-mono text-[0.66rem] text-riff-muted">tone (or click the amp)</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => { void riff.current!.click(); riff.current!.setTone(t); setTone(t) }}
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

          {/* Capo */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <h2 className="riff-label !text-riff-ink-2">Capo</h2>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => { void riff.current!.click(); changeCapo(capo === 0 ? 2 : 0) }}
                aria-pressed={capo > 0}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  capo > 0 ? 'border-riff-hot/60 bg-riff-hot/12 text-riff-ink' : 'border-riff-line text-riff-muted hover:text-riff-ink'
                }`}
              >
                {capo > 0 ? 'On' : 'Off'}
              </button>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={capo === 0 ? 1 : capo}
                disabled={capo === 0}
                onChange={(e) => changeCapo(Number(e.target.value))}
                className="w-full accent-[var(--color-riff-hot)] disabled:opacity-30"
                aria-label="Capo fret"
              />
              <span className="w-14 shrink-0 text-right font-mono text-[0.66rem] text-riff-muted">
                {capo > 0 ? `fret ${capo}` : 'off'}
              </span>
            </div>
            <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-riff-muted">
              Or drag the capo bar along the neck.
            </p>
          </div>

          {/* Finish */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <h2 className="riff-label !text-riff-ink-2">Body finish</h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => { void riff.current!.click(); setBodyColor(f.color) }}
                  title={f.name}
                  aria-label={f.name}
                  className={`aspect-square rounded-md border-2 transition-transform hover:scale-105 ${bodyColor === f.color ? 'border-riff-ink' : 'border-transparent'}`}
                  style={{ background: f.color === 'original' ? 'linear-gradient(135deg, #58c437 0%, #58c437 55%, #b9c437 55%, #b9c437 100%)' : f.color }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 font-mono text-[0.66rem] text-riff-muted">
              custom
              <input type="color" value={bodyColor === 'original' ? '#58c437' : bodyColor} onChange={(e) => setBodyColor(e.target.value)} className="h-6 w-10 cursor-pointer rounded border border-riff-line bg-transparent" />
              <span>{bodyColor === 'original' ? 'as shipped' : bodyColor}</span>
            </label>
          </div>

          {/* Accent (pickups + knobs) */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <h2 className="riff-label !text-riff-ink-2">Accent — pickups &amp; knobs</h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ACCENTS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => { void riff.current!.click(); setAccentColor(f.color) }}
                  title={f.name}
                  aria-label={f.name}
                  className={`aspect-square rounded-md border-2 transition-transform hover:scale-105 ${accentColor === f.color ? 'border-riff-ink' : 'border-transparent'}`}
                  style={{ background: f.color === 'original' ? '#b1ba3f' : f.color }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 font-mono text-[0.66rem] text-riff-muted">
              custom
              <input type="color" value={accentColor === 'original' ? '#b1ba3f' : accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-6 w-10 cursor-pointer rounded border border-riff-line bg-transparent" />
              <span>{accentColor === 'original' ? 'as shipped' : accentColor}</span>
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
