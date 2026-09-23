import { useEffect, useRef, useState } from 'react'
import { AdjustSheet } from './components/AdjustSheet'
import { HowMuch, Landing, TakingOver, WantMore, withLessOf, withMoreOf } from './components/Flow'
import { Privacy, Terms } from './components/Legal'
import { Mascot } from './components/Mascot'
import { Results } from './components/Results'
import { Button } from './components/ui'
import { COPY } from './copy'
import { BRAND } from './data/brand'
import { inferProblems, suggestFor } from './data/library'
import { loadFeed } from './lib/feed'
import { clearLocal, decodeRecipe, encodeRecipe, likeFor, loadLocal, newSession, reconcileMix, saveLocal } from './lib/session'
import type { Platform, Session } from './lib/types'

/**
 * The flow (docs/UX_AUDIT.md §5): landing, then up to 3 questions, then the
 * fix. Question 2 only appears when something was named in question 1.
 */
type Step = 'landing' | 'q1' | 'q2' | 'q3' | 'results'
const questions = (s: Session): Step[] => (s.turnDown.length ? ['q1', 'q2', 'q3'] : ['q1', 'q3'])
const isBored = (s: Session) => s.problems.includes('stale') && s.turnDown.length === 0

type Legal = 'privacy' | 'terms' | null
const legalFromHash = (): Legal => (location.hash === '#privacy' ? 'privacy' : location.hash === '#terms' ? 'terms' : null)

function fromHash(): Session | null {
  const m = location.hash.match(/^#r=([A-Za-z0-9_-]+)/)
  return m ? decodeRecipe(m[1]) : null
}

/** `?from=tiktok` in a shared link picks the app for them. */
function fromParam(): Platform | null {
  const f = new URLSearchParams(location.search).get('from')
  return f === 'youtube' || f === 'instagram' || f === 'tiktok' || f === 'x' ? f : null
}

export default function App() {
  const [fromLink] = useState(fromHash)
  const [resumable, setResumable] = useState(() => !fromLink && !!loadLocal())
  const [s, setS] = useState<Session>(() => fromLink ?? loadLocal() ?? newSession(fromParam() ?? 'youtube'))
  const [step, setStep] = useState<Step>(fromLink ? 'results' : 'landing')
  const [returning, setReturning] = useState(!!fromLink)
  const [legal, setLegal] = useState<Legal>(legalFromHash)
  const [adjusting, setAdjusting] = useState(false)
  const [draft, setDraft] = useState('')
  const seeded = useRef(false)
  const main = useRef<HTMLElement>(null)

  const update = (patch: Partial<Session>) => setS((prev) => ({ ...prev, ...patch }))

  useEffect(() => {
    if (step !== 'landing') saveLocal(s)
    if (step === 'results') history.replaceState({ step }, '', `#r=${encodeRecipe(s)}`)
  }, [s, step])

  useEffect(() => {
    const onHash = () => {
      setLegal(legalFromHash())
      // A personal link pasted into an open tab only changes the hash: open it.
      const linked = fromHash()
      if (linked) {
        setS(linked)
        setReturning(true)
        setStep('results')
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Each step is a history entry, so the phone's back gesture goes back a step.
  useEffect(() => {
    history.replaceState({ step }, '')
    const onPop = (e: PopStateEvent) => {
      const st = (e.state as { step?: Step } | null)?.step
      if (st) setStep(st)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Start fetching this week's channel videos once they begin the questions.
  useEffect(() => {
    if (step !== 'landing') loadFeed()
  }, [step])

  // Move focus to the new question for keyboard and screen-reader users.
  useEffect(() => {
    setDraft('')
    window.scrollTo({ top: 0 })
    main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [step, legal])

  const closeLegal = () => {
    setLegal(null)
    history.replaceState({ step }, '', step === 'results' ? `#r=${encodeRecipe(s)}` : location.pathname + location.search)
  }

  const go = (next: Step) => {
    setS((prev) => {
      let out = prev
      // Leaving question 1: work out the problem instead of asking for it.
      if (step === 'q1') out = { ...out, problems: inferProblems(out.turnDown, isBored(out)) }
      // Arriving at question 3 the first time: pre-pick topics from what they're tired of.
      if (next === 'q3' && !seeded.current && out.likes.length === 0) {
        seeded.current = true
        out = { ...out, likes: suggestFor(out.turnDown) }
      }
      if (next === 'results') out = { ...out, mix: reconcileMix(out.mix, out.likes) }
      return out
    })
    if (next === 'results' && step !== 'results') setReturning(false)
    if (next !== step) history.pushState({ step: next }, '', next === 'results' ? location.hash || location.pathname : location.pathname + location.search)
    setStep(next)
  }

  const qs = questions(s)
  const idx = qs.indexOf(step)
  const next = () => {
    // Something typed but not added yet counts: nobody should have to find "Add".
    const patch = !draft.trim() ? {} : step === 'q1' ? withLessOf(s, draft) : step === 'q3' ? withMoreOf(s, draft) : {}
    const after = { ...s, ...patch }
    if (Object.keys(patch).length) setS((prev) => ({ ...prev, ...patch }))
    const q = questions(after)
    const i = q.indexOf(step)
    go(i < q.length - 1 ? q[i + 1] : 'results')
  }
  const back = () => go(idx > 0 ? qs[idx - 1] : 'landing')
  const canGo = step !== 'q1' || s.turnDown.length > 0 || isBored(s) || draft.trim() !== ''

  const reset = () => {
    clearLocal()
    try {
      localStorage.removeItem('algorithm-builder:done')
      sessionStorage.removeItem('algorithm-builder:search')
    } catch {
      /* ignore */
    }
    history.replaceState({ step: 'landing' }, '', location.pathname + location.search)
    seeded.current = false
    setS(newSession(fromParam() ?? 'youtube'))
    setReturning(false)
    setResumable(false)
    setStep('landing')
  }

  const nav = COPY.nav
  const primaryLabel = step === 'q3' ? nav.showFix : !canGo ? nav.pickOne : nav.next

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[980px] flex-col px-4 sm:px-6">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4" aria-label="Site">
        <button
          onClick={() => {
            if (legal) closeLegal()
            go('landing')
          }}
          aria-label={`${BRAND.name}. ${nav.home}`}
          className="flex min-h-12 items-center gap-2 rounded-full pr-2 text-left"
        >
          <Mascot size={36} />
          <span className="font-display text-lg font-bold">{BRAND.name}</span>
        </button>
        {idx >= 0 && !legal && (
          <span className="text-base font-semibold tabular-nums text-ink-2" aria-live="polite">
            {nav.question(idx + 1, qs.length)}
          </span>
        )}
      </nav>
      {idx >= 0 && !legal && (
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          <div className="bar-seg h-full rounded-full bg-accent" style={{ width: `${((idx + 1) / qs.length) * 100}%` }} />
        </div>
      )}

      {legal ? (
        <main id="main" ref={main} className="flex-1" tabIndex={-1}>
          <button onClick={closeLegal} className="mb-6 min-h-12 text-base font-semibold text-ink-2 underline underline-offset-4">
            {COPY.footer.back}
          </button>
          {legal === 'privacy' ? <Privacy /> : <Terms />}
        </main>
      ) : (
        <main id="main" ref={main} className={`flex-1 ${idx >= 0 ? 'pb-36' : ''} ${step === 'results' ? '' : 'mx-auto w-full max-w-[680px]'}`} tabIndex={-1}>
          <div className="[&_h1]:outline-none" key={step}>
            {step === 'landing' && (
              <Landing
                onStart={() => {
                  setReturning(false)
                  // "Fix my feed" starts fresh; "Pick up where I left off" is how to continue.
                  // A shared ?from= link picks the app, else keep the one they used.
                  if (resumable) {
                    seeded.current = false
                    setS(newSession(fromParam() ?? s.platform))
                    setResumable(false)
                  }
                  go('q1')
                }}
                onResume={resumable ? () => go('results') : null}
              />
            )}
            {step === 'q1' && <TakingOver s={s} update={update} draft={{ text: draft, setText: setDraft }} />}
            {step === 'q2' && <HowMuch s={s} update={update} next={next} />}
            {step === 'q3' && <WantMore s={s} update={update} draft={{ text: draft, setText: setDraft }} />}
            {step === 'results' && (
              <Results s={s} returning={returning} onAdjust={() => setAdjusting(true)} onReset={reset} onFollowUp={(t) => update({ followUp: t })} onHide={(hidden) => update({ hidden })} onMix={(mix) => update({ mix })} />
            )}
          </div>

          {idx >= 0 && (
            // Fixed, and re-created per step: iOS WebKit can skip repainting a
            // sticky bar after a big change, which once hid Next (O-1).
            <div key={`bar-${step}`} className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper">
              <div className="safe-bottom mx-auto flex w-full max-w-[680px] flex-wrap items-center justify-between gap-3 px-4 pt-3 sm:px-6">
                <Button variant="secondary" onClick={back}>
                  {nav.back}
                </Button>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {step === 'q2' && (
                    <button onClick={next} className="min-h-12 px-2 text-base font-semibold text-ink-2 underline underline-offset-4">
                      {nav.skip}
                    </button>
                  )}
                  <Button onClick={next} disabled={!canGo}>
                    {primaryLabel}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      <AdjustSheet
        open={adjusting}
        mix={s.mix}
        onClose={() => setAdjusting(false)}
        // Removing a topic here also un-picks it, so question 3 stays in sync.
        onChange={(mix) => update({ mix, likes: mix.categories.map(likeFor).filter((l): l is string => l !== null) })}
      />

      <footer className={`mt-12 border-t border-line py-6 text-base text-ink-2 ${idx >= 0 && !legal ? 'hidden' : ''}`}>
        <p className="m-0">{COPY.footer.promise(BRAND.name, BRAND.mascot)}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <span>© 2026 {BRAND.name}</span>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            <a href="#privacy" className="inline-flex min-h-12 items-center font-semibold text-ink-2 underline underline-offset-4">
              {COPY.footer.privacy}
            </a>
            <a href="#terms" className="inline-flex min-h-12 items-center font-semibold text-ink-2 underline underline-offset-4">
              {COPY.footer.terms}
            </a>
            <a href={BRAND.repo} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center font-semibold text-ink-2 underline underline-offset-4">
              {COPY.footer.source}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
