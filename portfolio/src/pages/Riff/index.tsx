import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { Riff, TONES, type Tone } from './audio'
import type { PlugStage, SceneApi } from './Scene'
import { flashString } from './Scene'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

const FINISHES = [
  { name: 'Reset', color: 'original' },
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
  { name: 'Reset', color: 'original' },
  { name: 'Black', color: '#17171a' },
  { name: 'White', color: '#eceadf' },
  { name: 'Red', color: '#c11a2b' },
  { name: 'Blue', color: '#2b5fc1' },
  { name: 'Gold', color: '#c9a227' },
  { name: 'Silver', color: '#c9ccd2' },
  { name: 'Pink', color: '#e35b8f' },
]

const TONE_LABEL: Record<Tone, string> = { clean: 'Clean', drive: 'Drive', reverb: 'Reverb' }

// Standard tuning open-string MIDI numbers (low E → high e) for note readout.
const OPEN_MIDI = [40, 45, 50, 55, 59, 64]
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const noteName = (i: number, semis: number) => {
  const m = OPEN_MIDI[i] + semis
  return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1)
}

// Open-position chord shapes, low E → high e; -1 = don't play that string.
const CHORDS: { name: string; frets: number[] }[] = [
  { name: 'Em', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'G', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'C', frets: [-1, 3, 2, 0, 1, 0] },
  { name: 'D', frets: [-1, -1, 0, 2, 3, 2] },
  { name: 'A', frets: [-1, 0, 2, 2, 2, 0] },
  { name: 'E', frets: [0, 2, 2, 1, 0, 0] },
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
  const [reduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [bodyColor, setBodyColor] = useState('original')
  const [accentColor, setAccentColor] = useState('original')
  const [tone, setTone] = useState<Tone>('clean')
  const [plugStage, setPlugStage] = useState<PlugStage>('unplugged')
  const [capo, setCapo] = useState(0)
  const [note, setNote] = useState<{ n: string; id: number } | null>(null)
  const riff = useRef<Riff | null>(null)
  const sceneApi = useRef<SceneApi | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const noteId = useRef(0)
  const capoRef = useRef(0)
  if (!riff.current) riff.current = new Riff()
  const plugged = plugStage === 'plugged'
  capoRef.current = capo

  const showNote = (n: string) => {
    setNote({ n, id: ++noteId.current })
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(null), 900)
  }

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

  const playNote = (i: number, fret = 0, showName = true) => {
    riff.current!.pluck(i, fret)
    flashString(i, fret)
    if (showName) showNote(noteName(i, Math.max(fret, capoRef.current)))
  }
  const strum = () => { riff.current!.strum(); for (let i = 0; i < 6; i++) setTimeout(() => flashString(i), i * 45) }
  const strumChord = (c: { name: string; frets: number[] }) => {
    let k = 0
    for (let i = 0; i < 6; i++) {
      const f = c.frets[i]
      if (f < 0) continue
      setTimeout(() => playNote(i, f, false), k * 40)
      k++
    }
    showNote(c.name)
  }

  // Keyboard play: 1–6 pluck a string, space strums (once plugged in).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (!plugged) return
      if (e.key >= '1' && e.key <= '6') { playNote(Number(e.key) - 1) }
      else if (e.key === ' ') { e.preventDefault(); strum() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [plugged]) // eslint-disable-line react-hooks/exhaustive-deps

  // One-tap plug (and unplug) — the fast path.
  const quickPlug = async () => {
    void riff.current!.click()
    if (plugged) { await riff.current!.plug(false); setPlugStage('unplugged') }
    else { setPlugStage('plugged'); await riff.current!.plug(true); riff.current!.connectThunk() }
  }
  // Manual hand-plugging: arm the cable, then click each glowing jack.
  const armCable = () => { void riff.current!.click(); setPlugStage(plugStage === 'unplugged' ? 'armed' : 'unplugged') }

  const onJackClick = async (which: 'guitar' | 'amp') => {
    void riff.current!.click()
    if (plugStage === 'armed') {
      setPlugStage(which === 'guitar' ? 'drag-guitar' : 'drag-amp')
    } else if ((plugStage === 'drag-guitar' && which === 'amp') || (plugStage === 'drag-amp' && which === 'guitar')) {
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
  const setToneClick = (t: Tone) => { void riff.current!.click(); riff.current!.setTone(t); setTone(t) }
  const changeCapo = (fret: number) => { riff.current!.setCapo(fret); setCapo(fret) }

  const stageHint =
    plugged ? 'Click along a string to fret a note · body = strum · keys 1–6 / space'
    : plugStage === 'armed' ? 'Click a glowing jack to grab the cable'
    : plugStage === 'drag-guitar' ? 'Now click the amp’s INPUT jack'
    : plugStage === 'drag-amp' ? 'Now click the guitar’s jack'
    : '' // unplugged: the pill already says "Plug in to play"

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

      <p className="sr-only">
        Interactive 3D electric guitar and amp. Use the Plug in button first. Once plugged in, press number keys 1 to 6 to
        pluck the six strings from low to high, and the space bar to strum all six. The controls on the right change the amp
        tone, add a capo, and recolour the guitar.
      </p>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div
          className="hero-in relative h-[26rem] self-start overflow-hidden rounded-xl border border-riff-line bg-riff-card sm:h-[30rem] lg:h-[34rem]"
          style={d(120)}
          role="img"
          aria-label="A solid 3D electric guitar beside an amp. Plug in, then click the strings to play open notes."
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
                    reduce={reduce}
                    apiRef={sceneApi}
                    onPluck={playNote}
                    onStrum={strum}
                    onAmpClick={cycleTone}
                    onJackClick={onJackClick}
                    onCapoDrag={changeCapo}
                    onReady={() => setReady(true)}
                    onFail={() => setLost(true)}
                  />
                </Suspense>
              </div>
              {!ready && <p className="riff-label absolute inset-0 grid place-items-center">tuning up…</p>}
              {/* note-name readout */}
              {note && (
                <div key={note.id} className="riff-note pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 font-mono text-3xl font-bold text-riff-ink">
                  {note.n}
                </div>
              )}
              {ready && (
                <>
                  {/* reset view */}
                  <button
                    onClick={() => sceneApi.current?.resetView()}
                    title="Reset view"
                    aria-label="Reset view"
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md border border-riff-line bg-riff-bg/70 text-riff-muted backdrop-blur transition-colors hover:text-riff-ink"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                  </button>
                  {/* in-scene primary action, reachable without scrolling on mobile */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-3">
                    {stageHint && <p className="riff-label rounded bg-riff-bg/60 px-2 py-0.5 backdrop-blur">{stageHint}</p>}
                    {(plugStage === 'unplugged' || plugged) && (
                      <button
                        onClick={quickPlug}
                        className={`pointer-events-auto rounded-full border px-5 py-2 text-sm font-semibold shadow-lg backdrop-blur transition-colors ${
                          plugged ? 'border-riff-hot/60 bg-riff-hot/20 text-riff-ink' : 'border-riff-hot/60 bg-riff-hot/90 text-white hover:bg-riff-hot'
                        }`}
                      >
                        {plugged ? '● Plugged in — tap to unplug' : '⚡ Plug in to play'}
                      </button>
                    )}
                    {(plugStage === 'armed' || plugStage === 'drag-guitar' || plugStage === 'drag-amp') && (
                      <button onClick={() => setPlugStage('unplugged')} className="pointer-events-auto rounded-full border border-riff-line bg-riff-bg/80 px-4 py-1.5 text-xs text-riff-muted backdrop-blur">
                        Cancel
                      </button>
                    )}
                  </div>
                </>
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
              onClick={quickPlug}
              className={`mt-3 w-full rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                plugged ? 'border-riff-hot/60 bg-riff-hot/12 text-riff-ink' : 'border-riff-hot/60 bg-riff-hot/90 text-white hover:bg-riff-hot'
              }`}
            >
              {plugged ? '● Plugged in — unplug' : '⚡ Plug in'}
            </button>
            {!plugged && plugStage === 'unplugged' && (
              <button onClick={armCable} className="mt-2 w-full text-center font-mono text-[0.66rem] text-riff-muted underline decoration-riff-line-strong underline-offset-2 hover:text-riff-ink">
                …or plug the cable in by hand
              </button>
            )}
            {(plugStage === 'armed' || plugStage === 'drag-guitar' || plugStage === 'drag-amp') && (
              <button onClick={() => setPlugStage('unplugged')} className="mt-2 w-full rounded-md border border-riff-line px-3 py-1.5 text-xs text-riff-muted hover:text-riff-ink">
                Cancel hand-plugging
              </button>
            )}
            <div className="mt-3">
              <span className="font-mono text-[0.66rem] text-riff-muted">tone (or click the amp)</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setToneClick(t)}
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

          {/* Capo — one slider, 0 = off */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="riff-label !text-riff-ink-2">Capo</h2>
              <span className="font-mono text-[0.66rem] text-riff-muted">{capo > 0 ? `fret ${capo}` : 'off'}</span>
            </div>
            <input
              type="range"
              min={0}
              max={7}
              step={1}
              value={capo}
              onChange={(e) => changeCapo(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--color-riff-hot)]"
              aria-label="Capo fret (0 = off)"
            />
            <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-riff-muted">
              0 = off. Or drag the capo along the neck.
            </p>
          </div>

          {/* Chords */}
          <div className="rounded-xl border border-riff-line bg-riff-card p-4">
            <h2 className="riff-label !text-riff-ink-2">Chords</h2>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {CHORDS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => plugged ? strumChord(c) : undefined}
                  disabled={!plugged}
                  className="rounded-md border border-riff-line px-2 py-2 text-sm font-semibold text-riff-ink-2 transition-colors hover:border-riff-hot/60 hover:text-riff-ink disabled:opacity-40 disabled:hover:border-riff-line disabled:hover:text-riff-ink-2"
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-riff-muted">
              {plugged ? 'Tap a chord to strum it — the shape lights up on the neck.' : 'Plug in to strum chords.'}
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
                  title={f.name === 'Reset' ? 'Reset to original' : f.name}
                  aria-label={f.name === 'Reset' ? 'Reset to original' : f.name}
                  className={`grid aspect-square place-items-center rounded-md border-2 transition-transform hover:scale-105 ${bodyColor === f.color ? 'border-riff-ink' : 'border-transparent'}`}
                  style={{ background: f.color === 'original' ? '#2a2a2e' : f.color }}
                >
                  {f.color === 'original' && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-riff-ink-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                  )}
                </button>
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
                  title={f.name === 'Reset' ? 'Reset to original' : f.name}
                  aria-label={f.name === 'Reset' ? 'Reset to original' : f.name}
                  className={`grid aspect-square place-items-center rounded-md border-2 transition-transform hover:scale-105 ${accentColor === f.color ? 'border-riff-ink' : 'border-transparent'}`}
                  style={{ background: f.color === 'original' ? '#2a2a2e' : f.color }}
                >
                  {f.color === 'original' && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-riff-ink-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                  )}
                </button>
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
