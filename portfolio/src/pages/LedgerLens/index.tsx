import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../lib/router'
import { Dropzone } from './Dropzone'
import { ExamplePicker } from './ExamplePicker'
import { ResultsTable } from './ResultsTable'
import { SkeletonRows } from './SkeletonRows'
import { ConfidenceMeter } from './ConfidenceMeter'
import { useExtraction, type ExtractInput } from './useExtraction'
import './theme.css'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** Wordmark spark — a mint check inside a receipt corner. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="3" fill="var(--color-ledger-mint)" opacity="0.16" />
      <polyline points="6,10 9,13 15,6" fill="none" stroke="var(--color-ledger-mint)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function LedgerLens() {
  const { state, start, reset } = useExtraction()
  const working = state.phase === 'reading' || state.phase === 'structuring'

  useEffect(() => {
    document.body.classList.add('ledger-page')
    const prev = document.title
    document.title = 'Ledger Lens — receipt & invoice extractor'
    return () => {
      document.body.classList.remove('ledger-page')
      document.title = prev
    }
  }, [])

  const onPick = (i: ExtractInput) => start(i)

  const docConfidence = state.result
    ? avg([
        state.result.conf.merchant,
        state.result.conf.date,
        state.result.conf.total,
        ...state.result.lines.map((l) => l.confidence),
      ])
    : 0

  return (
    <div className="ledger-root min-h-svh bg-ledger-bg text-ledger-ink">
      <header className="sticky top-0 z-10 border-b border-ledger-line bg-ledger-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <button onClick={() => navigate('#work')} className="hero-in font-mono text-xs tracking-wide text-ledger-muted transition-colors hover:text-ledger-ink" style={d(0)}>
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-ledger-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Ledger Lens</span>
            <span className="rounded-full border border-ledger-mint/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ledger-mint">Demo</span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-ledger-muted sm:block" style={d(80)}>
            Claude Haiku 4.5 · vision
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="hero-in flex flex-wrap items-end justify-between gap-3" style={d(100)}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Read a receipt</h1>
            <p className="mt-1 text-sm text-ledger-ink-2">Photo, or paste messy text — extracted to structured, editable line items.</p>
          </div>
          <p className="ledger-label">Vision + structured output · your key never touches the browser</p>
        </div>

        {/* Input surface (hidden once a result lands, replaced by "start over"). */}
        {state.phase !== 'done' && (
          <div className="mt-6 space-y-6">
            <div className="hero-in" style={d(140)}>
              <Dropzone onSubmit={onPick} disabled={working} />
            </div>
            <div className="hero-in" style={d(200)}>
              <ExamplePicker onPick={onPick} disabled={working} />
            </div>
          </div>
        )}

        {/* Streaming status + skeleton */}
        {working && (
          <div className="fade-in mt-6 rounded-xl border border-ledger-line bg-ledger-card p-5" aria-busy="true">
            <div className="flex items-center gap-3">
              <span className="ledger-pulse h-2 w-2 rounded-full" style={{ background: 'var(--color-ledger-mint)' }} aria-hidden="true" />
              <span className="ledger-label" role="status" aria-live="polite">
                {state.phase === 'reading' ? 'Reading the receipt…' : 'Structuring line items…'}
              </span>
            </div>
            <SkeletonRows count={state.approxRows} />
          </div>
        )}

        {/* Result */}
        {state.phase === 'done' && state.result && (
          <div className="fade-in mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ConfidenceMeter value={docConfidence} />
              <button onClick={reset} className="springy rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">
                ↺ Read another
              </button>
            </div>
            <ResultsTable initial={state.result} />
          </div>
        )}

        {/* Error / rate-limit */}
        {state.phase === 'error' && (
          <div className="fade-in mt-6 rounded-xl border p-5" style={{ borderColor: 'var(--color-ledger-bad)' }} role="alert">
            <p className="text-sm" style={{ color: 'var(--color-ledger-bad)' }}>
              {state.error}
            </p>
            <button onClick={reset} className="springy mt-3 rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">
              Try again
            </button>
          </div>
        )}

        {/* How-it-works strip */}
        <section aria-label="How this demo is built" className="hero-in mt-10 grid gap-5 rounded-xl border border-ledger-line bg-ledger-card p-5 sm:grid-cols-3" style={d(280)}>
          <Blurb title="Vision + strict schema" body="Claude Haiku 4.5 reads the image and is constrained to a JSON schema — merchant, dates, line items, per-field confidence. Structured output, not free text." />
          <Blurb title="Derived, not trusted" body="The table recomputes amount = qty × unit and subtotal/total from the items, then flags any value that disagrees with the receipt. The human is the final authority." />
          <Blurb title="Key stays server-side" body="Every request goes through a rate-limited Supabase Edge Function that holds the Anthropic key. The browser never sees it — the exact REX key-proxy pattern." />
        </section>

        <footer className="hero-in mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ledger-line pt-5" style={d(340)}>
          <p className="font-mono text-xs text-ledger-muted">Generated example receipts, streamed extraction — built for Sean Joudrie's portfolio.</p>
          <button onClick={() => navigate('#work')} className="font-mono text-xs text-ledger-muted transition-colors hover:text-ledger-ink">
            Back to the portfolio →
          </button>
        </footer>
      </div>
    </div>
  )
}

function Blurb({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="ledger-label">{title}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ledger-ink-2">{body}</p>
    </div>
  )
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
