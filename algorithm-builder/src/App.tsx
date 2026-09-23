import { useEffect, useRef, useState } from 'react'
import { Privacy, Terms } from './components/Legal'
import { Mascot } from './components/Mascot'
import { MixStep } from './components/MixStep'
import { Results } from './components/Results'
import { Landing, LikesStep, PlatformStep, ProblemStep, TallyStep, TooMuchStep } from './components/Steps'
import { Button } from './components/ui'
import { BRAND } from './data/brand'
import { clearLocal, decodeRecipe, encodeRecipe, likeFor, loadLocal, newSession, reconcileMix, saveLocal } from './lib/session'
import type { Session } from './lib/types'

type Step = 'landing' | 'platform' | 'likes' | 'problem' | 'toomuch' | 'tally' | 'mix' | 'results'
const FLOW: Step[] = ['platform', 'likes', 'problem', 'toomuch', 'tally', 'mix']

type Legal = 'privacy' | 'terms' | null
const legalFromHash = (): Legal => (location.hash === '#privacy' ? 'privacy' : location.hash === '#terms' ? 'terms' : null)

function fromHash(): Session | null {
  const m = location.hash.match(/^#r=([A-Za-z0-9_-]+)/)
  return m ? decodeRecipe(m[1]) : null
}

export default function App() {
  const [fromLink] = useState(fromHash)
  const [resumable, setResumable] = useState(() => !fromLink && !!loadLocal())
  const [s, setS] = useState<Session>(() => fromLink ?? loadLocal() ?? newSession())
  const [step, setStep] = useState<Step>(fromLink ? 'results' : 'landing')
  const [returning, setReturning] = useState(!!fromLink)
  const [legal, setLegal] = useState<Legal>(legalFromHash)
  const main = useRef<HTMLElement>(null)

  const update = (patch: Partial<Session>) => setS((prev) => ({ ...prev, ...patch }))

  useEffect(() => {
    if (step !== 'landing') saveLocal(s)
    if (step === 'results') history.replaceState({ step }, '', `#r=${encodeRecipe(s)}`)
  }, [s, step])

  useEffect(() => {
    const onHash = () => setLegal(legalFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const closeLegal = () => {
    setLegal(null)
    history.replaceState({ step }, '', step === 'results' ? `#r=${encodeRecipe(s)}` : location.pathname)
  }

  // Move focus to the new screen for keyboard and screen-reader users.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [step, legal])

  // Each step is a history entry, so the phone's back gesture goes back a
  // step instead of leaving the site.
  useEffect(() => {
    history.replaceState({ step }, '')
    const onPop = (e: PopStateEvent) => {
      const st = (e.state as { step?: Step } | null)?.step
      if (st) setStep(st)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // Only on mount: later entries are pushed by go().
  }, [])

  const go = (next: Step) => {
    if (next === 'mix' || next === 'results') setS((prev) => ({ ...prev, mix: reconcileMix(prev.mix, prev.likes) }))
    if (next === 'results' && step !== 'results') setReturning(false)
    if (next !== step) history.pushState({ step: next }, '', next === 'results' ? location.hash || location.pathname : location.pathname)
    setStep(next)
  }
  const idx = FLOW.indexOf(step)
  const next = () => go(idx < FLOW.length - 1 ? FLOW[idx + 1] : 'results')
  const back = () => go(idx > 0 ? FLOW[idx - 1] : 'landing')

  const reset = () => {
    clearLocal()
    try {
      localStorage.removeItem('algorithm-builder:done')
    } catch {
      /* ignore */
    }
    history.replaceState({ step: 'landing' }, '', location.pathname)
    setS(newSession())
    setReturning(false)
    setResumable(false)
    setStep('landing')
  }

  const sickOfLabel = s.turnDown.length ? `${s.turnDown[0]}${s.turnDown.length > 1 ? ' & co.' : ''}` : 'The stuff I’m sick of'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[980px] flex-col px-4 sm:px-6">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <nav className="flex items-center justify-between py-4" aria-label="Site">
        <button
          onClick={() => {
            if (legal) closeLegal()
            go('landing')
          }}
          className="flex items-center gap-2 rounded-full pr-2 text-left"
        >
          <Mascot size={36} />
          <span className="font-display text-lg font-bold">{BRAND.name}</span>
        </button>
        {idx >= 0 && !legal && (
          <span className="text-sm tabular-nums text-muted" aria-live="polite">
            Step {idx + 1} of {FLOW.length}
          </span>
        )}
      </nav>
      {idx >= 0 && !legal && (
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          <div className="bar-seg h-full rounded-full bg-accent" style={{ width: `${((idx + 1) / FLOW.length) * 100}%` }} />
        </div>
      )}

      {legal ? (
        <main id="main" ref={main} className="flex-1" tabIndex={-1}>
          <button onClick={closeLegal} className="mb-6 min-h-11 text-sm font-semibold text-ink-2 underline underline-offset-4">
            Back to the app
          </button>
          {legal === 'privacy' ? <Privacy /> : <Terms />}
        </main>
      ) : (
        <main id="main" ref={main} className={`flex-1 ${idx >= 0 ? 'pb-32' : ''} ${step === 'mix' || step === 'results' ? '' : 'mx-auto w-full max-w-[680px]'}`} tabIndex={-1}>
          <div className="[&_h1]:outline-none" key={step}>
            {step === 'landing' && (
              <Landing
                onStart={() => {
                  setReturning(false)
                  go('platform')
                }}
                onResume={resumable ? () => go('results') : null}
              />
            )}
            {step === 'platform' && <PlatformStep s={s} update={update} next={next} />}
            {step === 'likes' && <LikesStep s={s} update={update} />}
            {step === 'problem' && <ProblemStep s={s} update={update} />}
            {step === 'toomuch' && <TooMuchStep s={s} update={update} />}
            {step === 'tally' && (
              <TallyStep
                value={s.baseline}
                onChange={(t) => update({ baseline: t })}
                title="Count your homepage (optional)"
                say="Open your YouTube homepage and count the first 20 videos. Next week you’ll count again and see what changed."
                sickOfLabel={sickOfLabel}
              />
            )}
            {step === 'mix' && (
              <MixStep
                mix={s.mix}
                // Removing a category in the mix also un-picks it, so the likes step stays in sync.
                onChange={(mix) => update({ mix, likes: mix.categories.map(likeFor).filter((l): l is string => l !== null) })}
              />
            )}
            {step === 'results' && (
              <Results s={s} returning={returning} onEdit={() => go('mix')} onReset={reset} onFollowUp={(t) => update({ followUp: t })} />
            )}
          </div>

          {idx >= 0 && (
            // Fixed (not sticky) and keyed by step: iOS WebKit can skip repainting a
            // sticky bar's children after a big content change, which hid Next (O-1).
            <div key={`bar-${step}`} className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper">
              <div className="safe-bottom mx-auto flex w-full max-w-[980px] items-center justify-between gap-3 px-4 pt-3 sm:px-6">
                <Button variant="secondary" onClick={back}>
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {idx >= 2 && step !== 'mix' && (
                    <button onClick={() => go('results')} className="min-h-11 px-2 text-sm font-semibold text-ink-2 underline underline-offset-4">
                      Skip to my fix
                    </button>
                  )}
                  <Button onClick={next} disabled={step === 'platform'} title={step === 'platform' ? 'Pick an app to continue' : undefined}>
                    {step === 'mix' ? 'Looks good, build my fix' : step === 'tally' && !s.baseline ? 'Skip' : 'Next'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="mt-12 border-t border-line py-6 text-sm text-muted">
        <p className="m-0">
          {BRAND.name} never signs in to your accounts. {BRAND.mascot} tells you which buttons to press; you press them.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <span>© 2026 {BRAND.name}</span>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            <a href="#privacy" className="font-semibold text-ink-2 underline underline-offset-4">
              Privacy
            </a>
            <a href="#terms" className="font-semibold text-ink-2 underline underline-offset-4">
              Terms
            </a>
            <a href={BRAND.repo} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 underline underline-offset-4">
              Source on GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
